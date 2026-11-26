import os
import json
import re
import urllib.request
import urllib.parse
import urllib.error
from typing import Dict, Any, List, Optional
from app.core.config import settings


def _is_real_key(key: Optional[str]) -> bool:
    if not key:
        return False
    k = key.strip()
    return bool(k) and "xxxx" not in k.lower() and not k.startswith("your_")


class AIProviderService:
    """
    Modular AI Provider Architecture for PROJECT ECHO.
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
        "web_search": {
            "id": "web_search",
            "name": "Live Web Knowledge",
            "models": ["wikipedia-duckduckgo"],
            "default_model": "wikipedia-duckduckgo",
            "env_var": "",
        },
    }

    @classmethod
    def get_provider_key(cls, provider_id: str) -> str:
        if provider_id == "web_search":
            return "no_key_required"
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
        if not _is_real_key(cleaned):
            return {"success": False, "message": "Please enter a valid API key."}

        env_var = meta["env_var"]
        setattr(settings, env_var, cleaned)
        os.environ[env_var] = cleaned

        env_path = os.path.join(
            os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
            ".env"
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
            result.append({
                "id": pid,
                "name": meta["name"],
                "models": meta["models"],
                "default_model": (
                    settings.GEMINI_MODEL if pid == "gemini" and settings.GEMINI_MODEL else meta["default_model"]
                ),
                "configured": True if pid == "web_search" else _is_real_key(key),
                "env_var": meta["env_var"],
            })
        return result

    @staticmethod
    def _web_search_query(query: str) -> Optional[str]:
        clean_q = re.sub(
            r"^(what is|what are|who is|who was|how does|how do|how can we|explain|tell me about|build a|write a|compare|differences between)\s+",
            "",
            query.strip(),
            flags=re.IGNORECASE,
        ).rstrip("?!.").strip() or query.strip()

        # 1. DuckDuckGo Instant Answer API
        try:
            ddg_url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(clean_q)}&format=json&no_html=1&skip_disambig=1"
            req = urllib.request.Request(ddg_url, headers={"User-Agent": "ProjectECHO/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                abstract = (data.get("AbstractText") or "").strip()
                if abstract:
                    src = data.get("AbstractSource") or "DuckDuckGo"
                    return f"{abstract}\n\n(Source: {src} via Live Web Knowledge)"
        except Exception:
            pass

        # 2. Wikipedia full-text search (handles natural-language open-ended questions)
        try:
            search_url = (
                "https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=2&format=json&srsearch="
                + urllib.parse.quote(clean_q)
            )
            req = urllib.request.Request(search_url, headers={"User-Agent": "ProjectECHO/1.0"})
            with urllib.request.urlopen(req, timeout=5) as resp:
                search_res = json.loads(resp.read().decode("utf-8"))
                hits = search_res.get("query", {}).get("search", [])
                extracts = []
                titles = []
                for hit in hits[:2]:
                    title = hit.get("title")
                    if not title:
                        continue
                    sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{urllib.parse.quote(title.replace(' ', '_'))}"
                    req2 = urllib.request.Request(sum_url, headers={"User-Agent": "ProjectECHO/1.0"})
                    with urllib.request.urlopen(req2, timeout=5) as resp2:
                        sum_data = json.loads(resp2.read().decode("utf-8"))
                        extract = (sum_data.get("extract") or "").strip()
                        if extract:
                            extracts.append(f"**{title}**: {extract}")
                            titles.append(title)
                if extracts:
                    return "\n\n".join(extracts) + f"\n\n(Source: Live Web Knowledge — Wikipedia: {', '.join(titles)})"
        except Exception:
            pass
        return None

    @classmethod
    def get_default_configured_provider(cls) -> str:
        for pid in ["gemini", "openai", "anthropic", "perplexity", "grok"]:
            if _is_real_key(cls.get_provider_key(pid)):
                return pid
        return "web_search"

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
        """
        Calls the requested (or default configured) AI provider.
        Returns:
          {
            "success": bool,
            "provider_id": str,
            "provider_name": str,
            "model": str,
            "content": Optional[str],
            "error": Optional[str],
          }
        """
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
            }

        meta = cls.PROVIDERS[selected_provider]
        selected_model = model or (
            settings.GEMINI_MODEL if selected_provider == "gemini" and settings.GEMINI_MODEL else meta["default_model"]
        )

        # Zero-key Live Web Knowledge option
        if selected_provider == "web_search":
            # Extract original question if prompt contains "User Question:"
            q_match = re.search(r"User Question:\s*(.+)", prompt)
            raw_q = q_match.group(1).strip() if q_match else prompt
            web_text = cls._web_search_query(raw_q)
            if web_text:
                return {
                    "success": True,
                    "provider_id": "web_search",
                    "provider_name": meta["name"],
                    "model": selected_model,
                    "content": web_text,
                    "error": None,
                }
            return {
                "success": False,
                "provider_id": "web_search",
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": "Live Web Search could not find an encyclopedia/instant answer for this conversational query (or internet access is unavailable).",
            }

        api_key = cls.get_provider_key(selected_provider)

        if not _is_real_key(api_key):
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": (
                    f"{meta['name']} is not configured on the backend "
                    f"({meta['env_var']} is missing in backend/.env)."
                ),
            }

        # Build conversation-aware prompt text if history is supplied
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
                }

        except urllib.error.HTTPError as http_err:
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": f"{meta['name']} API HTTP error ({http_err.code}): {http_err.reason}",
            }
        except Exception as exc:
            return {
                "success": False,
                "provider_id": selected_provider,
                "provider_name": meta["name"],
                "model": selected_model,
                "content": None,
                "error": f"{meta['name']} API call failed: {str(exc)}",
            }

        return {
            "success": False,
            "provider_id": selected_provider,
            "provider_name": meta["name"],
            "model": selected_model,
            "content": None,
            "error": "Provider execution did not return a response.",
        }
