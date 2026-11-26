import os
import re
import zipfile
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Tuple

try:
    import pymupdf as fitz  # type: ignore
except ImportError:
    fitz = None

try:
    from pypdf import PdfReader  # type: ignore
except ImportError:
    PdfReader = None

try:
    import docx  # type: ignore
except ImportError:
    docx = None


class DocumentService:
    @staticmethod
    def extract_text_with_locations(file_path: str, file_type: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Extracts clean text AND section/page locations from PDF, DOCX, or text files.
        Works reliably using pymupdf, pypdf, python-docx, or pure-Python fallbacks.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} does not exist.")

        ftype = file_type.lower().strip(".")
        segments: List[Dict[str, str]] = []

        if ftype == "pdf":
            if fitz is not None:
                doc = fitz.open(file_path)
                for idx, page in enumerate(doc, start=1):
                    txt = (page.get_text() or "").strip()
                    if txt:
                        segments.append({"location": f"Page {idx}", "text": txt})
                doc.close()
            elif PdfReader is not None:
                reader = PdfReader(file_path)
                for idx, page in enumerate(reader.pages, start=1):
                    txt = (page.extract_text() or "").strip()
                    if txt:
                        segments.append({"location": f"Page {idx}", "text": txt})
            else:
                raise RuntimeError("No PDF parser available (install pypdf or pymupdf).")

        elif ftype in ("docx", "doc"):
            if docx is not None:
                doc = docx.Document(file_path)
                for idx, para in enumerate(doc.paragraphs, start=1):
                    if para.text.strip():
                        segments.append({"location": f"Paragraph {idx}", "text": para.text.strip()})
                for t_idx, table in enumerate(doc.tables, start=1):
                    rows_txt = []
                    for row in table.rows:
                        row_text = [cell.text.strip() for cell in row.cells]
                        rows_txt.append(" | ".join(row_text))
                    if rows_txt:
                        segments.append({"location": f"Table {t_idx}", "text": "\n".join(rows_txt)})
            else:
                # Pure-Python DOCX XML fallback
                with zipfile.ZipFile(file_path) as zf:
                    xml_content = zf.read("word/document.xml")
                tree = ET.fromstring(xml_content)
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                for idx, p in enumerate(tree.findall(".//w:p", ns), start=1):
                    texts = [t.text for t in p.findall(".//w:t", ns) if t.text]
                    joined = "".join(texts).strip()
                    if joined:
                        segments.append({"location": f"Paragraph {idx}", "text": joined})

        else:  # txt, md, json, csv
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                raw = f.read().strip()
            if raw:
                chunks = [c.strip() for c in re.split(r"\n\s*\n", raw) if c.strip()]
                for idx, chunk in enumerate(chunks, start=1):
                    segments.append({"location": f"Section {idx}", "text": chunk})

        full_text = "\n\n".join(s["text"] for s in segments).strip()
        return full_text, segments

    @staticmethod
    def extract_text_from_file(file_path: str, file_type: str) -> str:
        full_text, _ = DocumentService.extract_text_with_locations(file_path, file_type)
        return full_text

    @staticmethod
    def extract_knowledge_units_from_text(
        text: str,
        expert_name: str,
        source_title: str,
        segments: List[Dict[str, str]] | None = None,
    ) -> List[Dict[str, Any]]:
        """
        Extracts rich structured Knowledge Units across facts, experiences,
        reasoning/decisions, practical skills, methods, problems/solutions,
        failures/lessons, opinions/hypotheses, and observations.
        Never labels units as expert-approved; callers persist them as 'ai_extracted'.
        """
        if not (text or "").strip():
            return []

        blocks: List[Tuple[str, str]] = []
        if segments:
            for seg in segments:
                for sub in re.split(r"\n\s*\n", seg["text"]):
                    if len(sub.strip()) >= 35:
                        blocks.append((seg["location"], sub.strip()))
        if not blocks:
            for idx, para in enumerate(re.split(r"\n\s*\n", text), start=1):
                if len(para.strip()) >= 35:
                    blocks.append((f"Section {idx}", para.strip()))
        if not blocks:
            blocks = [("Section 1", text.strip())]

        rules = [
            ("failure_lesson", ["fail", "lesson", "mistake", "avoid", "anti-pattern", "caution", "warning", "never", "fracture", "burn-through"], "Failures & Lessons Learned"),
            ("reasoning_decision", ["decid", "select", "chose", "chosen", "alternative", "reject", "trade-off", "tradeoff", "opted", "rationale", "because"], "Reasoning & Decisions"),
            ("problem_solution", ["problem", "challenge", "mitigat", "solv", "resolve", "bottleneck", "issue", "fix"], "Problems & Solutions"),
            ("method_procedure", ["method", "procedure", "step", "protocol", "process", "infiltrat", "calibrat", "install", "how to"], "Methods & Procedures"),
            ("practical_skill", ["technique", "torque", "toleran", "align", "inspect", "skill", "practice", "rule of thumb", "heuristic"], "Practical Skills & Heuristics"),
            ("opinion_hypothesis", ["hypothes", "opinion", "suspect", "believe", "likely", "predict", "future", "may"], "Opinions & Hypotheses"),
            ("experience", ["flight", "test", "experiment", "trial", "run", "observed", "experience", "campaign", "mission"], "Personal Experiences"),
            ("observation", ["notice", "observ", "detect", "anomaly", "reveal", "telemetry", "measured"], "Important Observations"),
        ]

        extracted: List[Dict[str, Any]] = []
        for idx, (loc, block) in enumerate(blocks[:10]):
            b_lower = block.lower()
            matched_cat = "fact_concept"
            matched_topic = "Core Domain Concepts"
            for cat, kws, topic_lbl in rules:
                if any(k in b_lower for k in kws):
                    matched_cat = cat
                    matched_topic = topic_lbl
                    break

            first_sentence = re.split(r"(?<=[.!?])\s+", block.strip())[0]
            clean_title = first_sentence[:95].rstrip(".,;:")
            if len(clean_title) < 12:
                clean_title = f"{source_title[:45]} — Unit {idx + 1}"

            extracted.append({
                "title": clean_title,
                "description": block[:320],
                "category": matched_cat,
                "topic": matched_topic,
                "problem_or_situation": first_sentence if matched_cat in ("problem_solution", "reasoning_decision", "failure_lesson") else None,
                "context_and_experience": block if matched_cat in ("experience", "observation", "fact_concept") else f"Extracted from '{source_title}' ({loc}) attributed to {expert_name}.",
                "reasoning_and_method": block if matched_cat in ("reasoning_decision", "method_procedure", "practical_skill", "problem_solution") else None,
                "decisions_and_alternatives": block if matched_cat == "reasoning_decision" else None,
                "failures_and_lessons": block if matched_cat == "failure_lesson" else None,
                "source_reference": source_title,
                "source_location_or_timestamp": loc,
                "confidence_score": 0.86 if matched_cat != "fact_concept" else 0.82,
            })

        return extracted

    @staticmethod
    def analyze_and_extract_entities(text: str, expert_name: str = "Dr. Alex Morgan") -> Dict[str, Any]:
        """
        Backward-compatible document analysis returning candidate knowledge records
        plus full structured Knowledge Units.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        candidates: Dict[str, Any] = {
            "title_detected": lines[0] if lines else "Extracted Knowledge Document",
            "word_count": len(text.split()),
            "identified_constraints": [],
            "identified_decisions": [],
            "identified_lessons": [],
            "candidate_records": [],
        }

        constraint_keywords = ["constraint", "temperature limit", "weight budget", "payload", "fail-safe", "tolerance", "budget", "must not exceed", "shall withstand"]
        decision_keywords = ["decided", "selected", "evaluated", "trade-off", "opted for", "alternative", "chose", "determined"]
        lesson_keywords = ["lesson", "takeaway", "caution", "discovered", "critical finding", "recommendation", "retrospective"]

        for para in paragraphs:
            para_lower = para.lower()
            if any(k in para_lower for k in constraint_keywords):
                candidates["identified_constraints"].append(para[:200])
            if any(k in para_lower for k in decision_keywords):
                candidates["identified_decisions"].append(para[:250])
            if any(k in para_lower for k in lesson_keywords):
                candidates["identified_lessons"].append(para[:250])

        if candidates["identified_decisions"]:
            candidates["candidate_records"].append({
                "title": f"Decision Pattern: {lines[0][:60] if lines else 'Extracted Decision'}",
                "category": "decision_pattern",
                "content": candidates["identified_decisions"][0],
                "confidence_score": 0.88,
                "key_takeaways": candidates["identified_lessons"][:3] or ["Awaiting expert review of extracted decision rationale."],
            })

        if candidates["identified_constraints"]:
            candidates["candidate_records"].append({
                "title": "Operating Constraints & Boundary Envelopes",
                "category": "heuristic",
                "content": " ".join(candidates["identified_constraints"][:2]),
                "confidence_score": 0.85,
                "key_takeaways": ["Awaiting expert review of extracted operating constraints."],
            })

        return candidates
