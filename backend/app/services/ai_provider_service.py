import os
import json
import re
import time
import urllib.request
import urllib.parse
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Any, List, Optional
from app.core.config import settings


def _is_real_key(key: Optional[str], provider_id: Optional[str] = None) -> bool:
    if not key:
        return False
    k = key.strip()
    if not k or " " in k or len(k) < 20:
        return False
    lowered = k.lower()
    if any(bad in lowered for bad in ("xxxx", "your_", "placeholder", "demo_key", "replace_me", "enter_")):
        return False
    if provider_id == "gemini" and not k.startswith("AIza"):
        return False
    if provider_id == "openai" and not k.startswith("sk-"):
        return False
    if provider_id == "anthropic" and not k.startswith("sk-ant-"):
        return False
    return True


class AIProviderService:
    """
    Extensible AI Provider Architecture for PROJECT ECHO.
    Supports Google Gemini, OpenAI GPT, Anthropic Claude, Perplexity, and Grok (xAI).
    Never fabricates AI responses when keys are missing or API calls fail.
    """

    PROVIDERS: Dict[str, Dict[str, Any]] = {
        "gemini": {
            "id": "gemini",
            "name": "Google Gemini",
            "models": ["gemini-2.5-flash", "gemini-2.5-pro"],
            "default_model": "gemini-2.5-flash",
            "env_var": "GEMINI_API_KEY",
        },
        "openai": {
            "id": "openai",
            "name": "OpenAI GPT",
            "models": ["gpt-4o-mini", "gpt-4o"],
            "default_model": "gpt-4o-mini",
            "env_var": "OPENAI_API_KEY",
        },
        "anthropic": {
            "id": "anthropic",
            "name": "Anthropic Claude",
            "models": ["claude-3-5-haiku-latest", "claude-3-5-sonnet-latest"],
            "default_model": "claude-3-5-haiku-latest",
            "env_var": "ANTHROPIC_API_KEY",
        },
        "perplexity": {
            "id": "perplexity",
            "name": "Perplexity AI",
            "models": ["sonar", "sonar-pro"],
            "default_model": "sonar",
            "env_var": "PERPLEXITY_API_KEY",
        },
        "grok": {
            "id": "grok",
            "name": "Grok (xAI)",
            "models": ["grok-2-latest"],
            "default_model": "grok-2-latest",
            "env_var": "GROK_API_KEY",
        },
    }

    @classmethod
    def get_provider_key(cls, provider_id: str) -> str:
        meta = cls.PROVIDERS.get(provider_id)
        if not meta or not meta["env_var"]:
            return ""
        return getattr(settings, meta["env_var"], "") or os.getenv(meta["env_var"], "") or ""

    @classmethod
    def configure_provider_key(cls, provider_id: str, api_key: str) -> Dict[str, Any]:
        """Saves an API key securely to backend/.env and updates live settings in memory."""
        pid = provider_id.strip().lower()
        meta = cls.PROVIDERS.get(pid)
        if not meta or not meta["env_var"]:
            return {"success": False, "message": f"Provider '{provider_id}' does not use an API key."}
        cleaned = api_key.strip()
        if not _is_real_key(cleaned, pid):
            return {
                "success": False,
                "message": f"Invalid {meta['name']} API key format. Keys must not contain spaces or placeholder text.",
            }

        env_var = meta["env_var"]
        setattr(settings, env_var, cleaned)
        os.environ[env_var] = cleaned

        env_path = os.path.join(
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
            ".env",
        )
        lines: List[str] = []
        if os.path.exists(env_path):
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.read().splitlines()

        updated = False
        new_lines = []
        for line in lines:
            if line.strip().startswith(f"{env_var}="):
                new_lines.append(f"{env_var}={cleaned}")
                updated = True
            else:
                new_lines.append(line)
        if not updated:
            new_lines.append(f"{env_var}={cleaned}")

        with open(env_path, "w", encoding="utf-8") as f:
            f.write("\n".join(new_lines) + "\n")

        return {
            "success": True,
            "provider": pid,
            "provider_name": meta["name"],
            "message": f"{meta['name']} connected and saved securely on the backend.",
        }

    @classmethod
    def list_providers(cls) -> List[Dict[str, Any]]:
        result = []
        for pid, meta in cls.PROVIDERS.items():
            key = cls.get_provider_key(pid)
            default_model = meta["default_model"]
            if pid == "gemini" and settings.GEMINI_MODEL and " " not in settings.GEMINI_MODEL:
                default_model = settings.GEMINI_MODEL
            result.append({
                "id": pid,
                "name": meta["name"],
                "models": meta["models"],
                "default_model": default_model,
                "configured": _is_real_key(key, pid),
                "env_var": meta["env_var"],
            })
        return result

    @classmethod
    def get_configured_providers(cls) -> List[str]:
        return [
            pid for pid in ["gemini", "openai", "anthropic", "perplexity", "grok"]
            if _is_real_key(cls.get_provider_key(pid), pid)
        ]

    @classmethod
    def get_default_configured_provider(cls) -> Optional[str]:
        configured = cls.get_configured_providers()
        return configured[0] if configured else None

    @staticmethod
    def _post_json(url: str, headers: Dict[str, str], payload: Dict[str, Any], timeout: int = 20) -> Dict[str, Any]:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json", **headers},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))

    @classmethod
    def generate(
        cls,
        prompt: str,
        system_prompt: str = "",
        provider: Optional[str] = None,
        model: Optional[str] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        started = time.perf_counter()
        selected_provider = (provider or "").strip().lower()
        if not selected_provider or selected_provider == "auto":
            selected_provider = cls.get_default_configured_provider() or "gemini"

        if selected_provider not in cls.PROVIDERS:
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": selected_provider,
                "model": model or "",
                "content": None,
                "error": f"Unknown AI provider '{selected_provider}'.",
                "latency_ms": 0,
            }

        meta = cls.PROVIDERS[selected_provider]
        gem_model = settings.GEMINI_MODEL if (settings.GEMINI_MODEL and " " not in settings.GEMINI_MODEL) else meta["default_model"]
        selected_model = model or (gem_model if selected_provider == "gemini" else meta["default_model"])

        api_key = cls.get_provider_key(selected_provider)
        if not _is_real_key(api_key, selected_provider):
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": f"{meta['name']} is not configured with a valid API key ({meta['env_var']} missing or invalid in backend/.env).",
                "latency_ms": int((time.perf_counter() - started) * 1000),
            }

        history_block = ""
        if history:
            turns = []
            for h in history[-4:]:
                q = h.get("query", "")
                a = h.get("answer", "")
                if q:
                    turns.append(f"User: {q}\nAssistant: {a[:500]}")
            if turns:
                history_block = "Previous Conversation Context:\n" + "\n---\n".join(turns) + "\n\n"

        full_prompt = f"{history_block}{prompt}"

        try:
            if selected_provider == "gemini":
                from google import genai as google_genai
                client = google_genai.Client(api_key=api_key)
                combined = f"{system_prompt}\n\n{full_prompt}".strip() if system_prompt else full_prompt
                response = client.models.generate_content(model=selected_model, contents=combined)
                text = (response.text or "").strip()
                if not text:
                    raise ValueError("Empty response from Gemini API.")
                return {
                    "success": True,
                    "provider_id": "gemini",
                    "provider_name": meta["name"],
                    "model": selected_model,
                    "content": text,
                    "error": None,
                    "latency_ms": int((time.perf_counter() - started) * 1000),
                }

            if selected_provider == "openai":
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": full_prompt})
                res = cls._post_json(
                    "https://api.openai.com/v1/chat/completions",
                    {"Authorization": f"Bearer {api_key}"},
                    {"model": selected_model, "messages": messages},
                )
                text = (res["choices"][0]["message"]["content"] or "").strip()
                return {
                    "success": True,
                    "provider_id": "openai",
                    "provider_name": meta["name"],
                    "model": selected_model,
                    "content": text,
                    "error": None,
                    "latency_ms": int((time.perf_counter() - started) * 1000),
                }

            if selected_provider == "anthropic":
                res = cls._post_json(
                    "https://api.anthropic.com/v1/messages",
                    {"x-api-key": api_key, "anthropic-version": "2023-06-01"},
                    {
                        "model": selected_model,
                        "max_tokens": 1500,
                        "system": system_prompt or "You are a rigorous engineering and scientific analyst.",
                        "messages": [{"role": "user", "content": full_prompt}],
                    },
                )
                text = (res["content"][0]["text"] or "").strip()
                return {
                    "success": True,
                    "provider_id": "anthropic",
                    "provider_name": meta["name"],
                    "model": selected_model,
                    "content": text,
                    "error": None,
                    "latency_ms": int((time.perf_counter() - started) * 1000),
                }

            if selected_provider in ("perplexity", "grok"):
                url = (
                    "https://api.perplexity.ai/chat/completions"
                    if selected_provider == "perplexity"
                    else "https://api.x.ai/v1/chat/completions"
                )
                messages = []
                if system_prompt:
                    messages.append({"role": "system", "content": system_prompt})
                messages.append({"role": "user", "content": full_prompt})
                res = cls._post_json(
                    url,
                    {"Authorization": f"Bearer {api_key}"},
                    {"model": selected_model, "messages": messages},
                )
                text = (res["choices"][0]["message"]["content"] or "").strip()
                return {
                    "success": True,
                    "provider_id": selected_provider,
                    "provider_name": meta["name"],
                    "model": selected_model,
                    "content": text,
                    "error": None,
                    "latency_ms": int((time.perf_counter() - started) * 1000),
                }

        except urllib.error.HTTPError as http_err:
            err_body = ""
            try:
                err_body = http_err.read().decode("utf-8")[:240]
            except Exception:
                pass
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": f"{meta['name']} API HTTP error ({http_err.code}): {http_err.reason}. {err_body}".strip(),
                "latency_ms": int((time.perf_counter() - started) * 1000),
            }
        except Exception as exc:
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": f"{meta['name']} API call failed: {str(exc)}",
                "latency_ms": int((time.perf_counter() - started) * 1000),
            }

        return {
            "success": False,
            "provider_id": selected_provider,
            "provider_name": meta["name"],
            "model": selected_model,
            "content": None,
            "error": "Provider execution did not return a response.",
            "latency_ms": int((time.perf_counter() - started) * 1000),
        }

    @classmethod
    def generate_multi(
        cls,
        prompt: str,
        system_prompt: str = "",
        providers: Optional[List[str]] = None,
        history: Optional[List[Dict[str, str]]] = None,
    ) -> List[Dict[str, Any]]:
        """
        Queries multiple AI providers in parallel.
        If `providers` is omitted/auto, queries all configured providers (or falls back to
        checking Gemini + OpenAI so missing/failing providers are reported honestly).
        """
        if providers:
            targets = [p.strip().lower() for p in providers if p and p != "auto"]
        else:
            configured = cls.get_configured_providers()
            targets = configured if configured else ["gemini", "openai"]

        # Deduplicate while preserving order
        seen = set()
        ordered_targets = []
        for t in targets:
            if t not in seen:
                seen.add(t)
                ordered_targets.append(t)

        results: Dict[str, Dict[str, Any]] = {}
        with ThreadPoolExecutor(max_workers=max(1, len(ordered_targets))) as pool:
            futs = {
                pool.submit(cls.generate, prompt, system_prompt, pid, None, history): pid
                for pid in ordered_targets
            }
            for fut in as_completed(futs):
                pid = futs[fut]
                try:
                    results[pid] = fut.result()
                except Exception as exc:
                    meta = cls.PROVIDERS.get(pid, {"name": pid, "default_model": ""})
                    results[pid] = {
                        "success": False,
                        "provider_id": pid,
                        "provider_name": meta["name"],
                        "model": meta.get("default_model", ""),
                        "content": None,
                        "error": str(exc),
                        "latency_ms": 0,
                    }

        return [results[pid] for pid in ordered_targets]
