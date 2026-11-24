import os
import json
from typing import Dict, Any, List
import pymupdf as fitz
import docx

class DocumentService:
    @staticmethod
    def extract_text_from_file(file_path: str, file_type: str) -> str:
        """Extracts clean text from PDF, DOCX, or text files."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {file_path} does not exist.")

        file_type = file_type.lower()
        extracted_text = ""

        if file_type == "pdf":
            doc = fitz.open(file_path)
            for page in doc:
                extracted_text += page.get_text() + "\n"
            doc.close()
        elif file_type in ["docx", "doc"]:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                if para.text.strip():
                    extracted_text += para.text + "\n"
            for table in doc.tables:
                for row in table.rows:
                    row_text = [cell.text.strip() for cell in row.cells]
                    extracted_text += " | ".join(row_text) + "\n"
        else: # txt or json
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()

        return extracted_text.strip()

    @staticmethod
    def analyze_and_extract_entities(text: str, expert_name: str = "Dr. Alex Morgan") -> Dict[str, Any]:
        """
        Parses document text into structured candidate knowledge records,
        decision indicators, constraints, and lessons learned.
        """
        paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
        lines = [line.strip() for line in text.split("\n") if line.strip()]

        candidates = {
            "title_detected": lines[0] if lines else "Extracted Knowledge Document",
            "word_count": len(text.split()),
            "identified_constraints": [],
            "identified_decisions": [],
            "identified_lessons": [],
            "candidate_records": []
        }

        # Heuristic extraction of engineering concepts
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

        # Generate structured candidate records
        if candidates["identified_decisions"]:
            candidates["candidate_records"].append({
                "title": f"Decision Pattern: {lines[0][:60] if lines else 'Extracted Decision'}",
                "category": "decision_pattern",
                "content": candidates["identified_decisions"][0],
                "confidence_score": 0.94,
                "key_takeaways": candidates["identified_lessons"][:3] or ["Carefully analyze operating boundary limits before selection."]
            })

        if candidates["identified_constraints"]:
            candidates["candidate_records"].append({
                "title": "Operating Constraints & Thermal Envelopes",
                "category": "heuristic",
                "content": " ".join(candidates["identified_constraints"][:2]),
                "confidence_score": 0.91,
                "key_takeaways": ["Verify safety margins against thermal shock."]
            })

        return candidates
