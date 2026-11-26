import re
import json
import math
from collections import Counter
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.entities import (
    Expert, Document, KnowledgeRecord, Experience, Decision, DecisionAlternative, Evidence, Lesson
)
from app.schemas.common import ConversationTurn


STOP_WORDS = {
    "the", "and", "for", "are", "was", "has", "had", "have", "not", "that",
    "this", "with", "did", "how", "why", "what", "when", "who", "which",
    "from", "into", "can", "its", "our", "their", "his", "her", "she", "him",
    "they", "them", "you", "your", "would", "could", "should", "been",
    "will", "does", "about", "over", "also", "than", "then", "some",
    "any", "all", "but", "out", "one", "two", "use", "get", "per", "via",
    "improve", "make", "best", "ways", "explain", "tell", "compare", "between",
    "system", "systems", "human", "learn", "train", "design", "build", "topic",
    "stored", "causes", "differences", "modern", "short", "write", "work", "does"
}

CONCEPT_SYNONYMS: Dict[str, List[str]] = {
    # Aerospace, Propulsion, Aircraft Engine & Hypersonic Safety (Dr. Alex Morgan)
    "aircraft": ["aerospace", "flight", "airframe", "hypersonic", "glider", "propulsion", "scramjet", "turbine", "engine"],
    "engine": ["propulsion", "scramjet", "aerothermal", "thermal", "turbine", "combustion", "cowl", "exhaust", "nozzle"],
    "safety": ["failure", "fracture", "mitigate", "reliability", "risk", "margin", "resilience", "catastrophic", "inspection", "redundancy"],
    "hypersonic": ["mach", "re-entry", "aerothermal", "hyperion", "glider", "stagnation", "shock", "bow shock"],
    "thermal protection": ["tps", "heat shield", "heat", "temperature", "leading edge", "nose cone", "ablation", "ablative", "c/sic", "composite", "grafoil"],
    "fastener": ["bolt", "flange", "collet", "attachment", "mounting", "bracket", "cte", "thermal expansion", "shear"],
    "c/sic": ["ceramic matrix", "cmc", "carbon silicon carbide", "cvi", "chemical vapor infiltration", "oxidation barrier"],
    "pica": ["pica-x", "ablator", "phenolic", "recession", "expendable"],
    "refractory": ["tantalum", "ta-10w", "tungsten", "hfc", "hafnium", "uhtc"],

    # Life Support & Bioregenerative Systems (Dr. Elena Rostova)
    "life support": ["eclss", "celss", "bioregenerative", "closed loop", "ares", "bio-dome", "habitat", "autotrophy"],
    "algae": ["microalgae", "chlorella", "spirulina", "photobioreactor", "tubular", "biomass", "protein", "food"],
    "biofilm": ["piezoelectric", "ultrasonic", "42 khz", "transducer", "fouling", "adhesion"],
    "water": ["graywater", "distillation", "osmosis", "recycling", "wastewater", "scwo", "catalytic", "uv oxidation"],
    "carbon dioxide": ["co2", "oxygen", "o2", "scrubbing", "respiration", "sabatier", "solid amine", "savd"],

    # Radiation Shielding (Dr. Marcus Vance)
    "radiation": ["gcr", "cosmic ray", "galactic", "spe", "solar particle", "dose", "msv", "titan shield", "attenuation"],
    "shielding": ["bnnt", "boron nitride", "nanotube", "uhmwpe", "polyethylene", "hydrogen", "low-z", "high-z", "lead", "aluminum"],
    "neutron": ["spallation", "secondary neutron", "boron-10", "capture cross-section", "fragmentation", "recoil"],
    "regolith": ["sintering", "microwave", "basaltic", "soil", "brick", "additive", "berm", "in-situ"],

    # Logistics & Mission Architecture (Director Sarah Lin)
    "logistics": ["gear ratio", "caelus", "trans-martian", "injection", "mass ratio", "payload", "manifest", "freight", "booster"],
    "economics": ["capex", "opex", "cost", "billion", "budget", "procurement", "trade-off", "lifecycle"],
    "inflatable": ["vectran", "kevlar", "expandable", "fairing volume", "hab", "module", "rigid titanium"],
    "isru": ["in-situ resource", "break-even", "mining", "harvesting", "autonomous rovers", "precursor"],
}


def _tokenize(text: str) -> List[str]:
    words = re.findall(r"\b[a-z0-9\-\.\/]{3,}\b", (text or "").lower())
    return [w for w in words if w not in STOP_WORDS]


def _cosine_similarity(vec_a: Dict[str, float], vec_b: Dict[str, float]) -> float:
    if not vec_a or not vec_b:
        return 0.0
    common = set(vec_a.keys()) & set(vec_b.keys())
    dot = sum(vec_a[k] * vec_b[k] for k in common)
    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot / (norm_a * norm_b)


class HumanKnowledgeService:
    """
    Dedicated Human Knowledge Retrieval Service for PROJECT ECHO.
    Performs semantic TF-IDF + synonym-expanded retrieval across Experts,
    Documents (PDF/DOCX), Experiences, KnowledgeRecords, Decision DNA,
    Rejected Alternatives, Evidence, and Lessons Learned.
    """

    @staticmethod
    def resolve_conversation_context(
        query_lower: str,
        history: Optional[List[ConversationTurn]],
    ) -> Tuple[List[str], Optional[str]]:
        context_tokens: List[str] = []
        active_expert: Optional[str] = None
        if not history:
            return context_tokens, active_expert

        last_turn = history[-1]
        last_q = (last_turn.query or "").lower()
        last_a = (last_turn.answer or "").lower()
        last_exp = (last_turn.expert_name or "").lower()

        follow_up_triggers = [
            "she", "he", "it", "they", "that", "this", "those", "these",
            "why did", "what was", "what were", "the outcome", "alternatives",
            "decision", "the other", "compare", "follow up", "more about", "their"
        ]
        is_follow_up = any(t in query_lower for t in follow_up_triggers) or len(query_lower.split()) <= 5

        if is_follow_up:
            combined_prev = f"{last_q} {last_a} {last_exp}"
            if any(k in combined_prev for k in ["alex", "morgan", "hyperion"]):
                active_expert = "Dr. Alex Morgan"
                context_tokens.extend(["morgan", "hyperion", "c/sic", "aerothermal", "fastener"])
            elif any(k in combined_prev for k in ["elena", "rostova", "bio-dome", "ares"]):
                active_expert = "Dr. Elena Rostova"
                context_tokens.extend(["rostova", "ares", "photobioreactor", "life", "support"])
            elif any(k in combined_prev for k in ["marcus", "vance", "titan shield"]):
                active_expert = "Dr. Marcus Vance"
                context_tokens.extend(["vance", "radiation", "bnnt", "regolith", "sintering"])
            elif any(k in combined_prev for k in ["sarah", "lin", "caelus"]):
                active_expert = "Director Sarah Lin"
                context_tokens.extend(["lin", "caelus", "logistics", "gear", "isru"])

        return context_tokens, active_expert

    @staticmethod
    def expand_query_tokens(query_lower: str, context_tokens: List[str]) -> Tuple[List[str], List[str]]:
        base_words = set(_tokenize(query_lower))
        base_words.update(context_tokens)

        expanded = set(base_words)
        for word in list(base_words):
            for key, syns in CONCEPT_SYNONYMS.items():
                if word == key or word in syns:
                    expanded.add(key)
                    expanded.update(syns[:4])

        return list(base_words), list(expanded)

    @staticmethod
    def retrieve(
        db: Session,
        query: str,
        conversation_history: Optional[List[ConversationTurn]] = None,
        expert_id_filter: Optional[int] = None,
        focus_domain: Optional[str] = None,
    ) -> Dict[str, Any]:
        query_lower = query.strip().lower()
        context_tokens, context_expert = HumanKnowledgeService.resolve_conversation_context(
            query_lower, conversation_history
        )
        base_tokens, expanded_tokens = HumanKnowledgeService.expand_query_tokens(
            query_lower, context_tokens
        )

        # Load all DB records
        experts = db.query(Expert).all()
        documents = db.query(Document).all()
        experiences = db.query(Experience).all()
        records = db.query(KnowledgeRecord).all()
        decisions = db.query(Decision).all()
        alternatives = db.query(DecisionAlternative).all()
        evidence_list = db.query(Evidence).all()
        lessons = db.query(Lesson).all()

        # Filter by domain if provided
        domain_expert_ids: Optional[set] = None
        if focus_domain and focus_domain.lower() != "all":
            fd_lower = focus_domain.lower()
            domain_expert_ids = {
                e.id for e in experts if fd_lower in (e.domain or "").lower()
            }

        def _expert_allowed(eid: Optional[int]) -> bool:
            if expert_id_filter and eid != expert_id_filter:
                return False
            if domain_expert_ids is not None and eid not in domain_expert_ids:
                return False
            return True

        # Build corpus for TF-IDF semantic similarity
        corpus_docs: List[Tuple[str, int, str]] = []
        for d in decisions:
            if _expert_allowed(d.expert_id):
                corpus_docs.append((
                    "decision",
                    d.id,
                    f"{d.title} {d.problem_definition} {d.context} {d.selected_decision} {d.reasoning} {d.outcome} {d.lessons_learned}"
                ))
        for r in records:
            if _expert_allowed(r.expert_id):
                corpus_docs.append((
                    "record",
                    r.id,
                    f"{r.title} {r.category} {r.content} {r.key_takeaways or ''}"
                ))
        for doc in documents:
            if _expert_allowed(doc.expert_id):
                corpus_docs.append((
                    "document",
                    doc.id,
                    f"{doc.title} {doc.extracted_text or ''}"
                ))
        for exp_item in experiences:
            if _expert_allowed(exp_item.expert_id):
                corpus_docs.append((
                    "experience",
                    exp_item.id,
                    f"{exp_item.title} {exp_item.context} {exp_item.situation} {exp_item.challenge} {exp_item.actions_taken} {exp_item.results} {exp_item.key_learnings}"
                ))
        for lsn in lessons:
            if _expert_allowed(lsn.expert_id):
                corpus_docs.append((
                    "lesson",
                    lsn.id,
                    f"{lsn.title} {lsn.insight} {lsn.anti_pattern_to_avoid} {lsn.recommended_practice}"
                ))

        # Compute IDF across corpus
        doc_token_lists: Dict[Tuple[str, int], Counter] = {}
        df: Counter = Counter()
        for kind, oid, txt in corpus_docs:
            toks = _tokenize(txt)
            cnt = Counter(toks)
            doc_token_lists[(kind, oid)] = cnt
            for t in set(toks):
                df[t] += 1

        n_docs = max(len(corpus_docs), 1)
        idf = {t: math.log((n_docs + 1) / (freq + 1)) + 1.0 for t, freq in df.items()}

        # Build query TF-IDF vector (base tokens weight 1.0, expanded synonyms weight 0.55)
        q_vec: Dict[str, float] = {}
        for t in expanded_tokens:
            weight = 1.0 if t in base_tokens else 0.55
            q_vec[t] = q_vec.get(t, 0.0) + weight * idf.get(t, 1.2)

        def _tfidf_sim(kind: str, oid: int) -> float:
            cnt = doc_token_lists.get((kind, oid))
            if not cnt:
                return 0.0
            d_vec = {t: c * idf.get(t, 1.0) for t, c in cnt.items()}
            return _cosine_similarity(q_vec, d_vec)

        # Expert name detection
        EXPERT_NAME_PARTS = {
            "lin": "Lin", "sarah": "Lin",
            "rostova": "Rostova", "elena": "Rostova",
            "vance": "Vance", "marcus": "Vance",
            "morgan": "Morgan", "alex": "Morgan",
        }
        bonus_surname = None
        for name_part, surname in EXPERT_NAME_PARTS.items():
            if name_part in query_lower:
                bonus_surname = surname
                break
        if not bonus_surname and context_expert:
            for surname in ["Lin", "Rostova", "Vance", "Morgan"]:
                if surname in context_expert:
                    bonus_surname = surname
                    break

        def _score_entity(text_lower: str, kind: Optional[str] = None, oid: Optional[int] = None, expert_name: str = "") -> float:
            text_word_set = set(_tokenize(text_lower))
            lex_base = sum(1.8 for t in base_tokens if (t in text_word_set or (len(t) >= 5 and t in text_lower)))
            lex_syn = sum(0.8 for t in expanded_tokens if t not in base_tokens and (t in text_word_set or (len(t) >= 5 and t in text_lower)))
            sem = _tfidf_sim(kind, oid) * 8.0 if (kind and oid) else 0.0
            exp_bonus = 10.0 if (bonus_surname and bonus_surname in (expert_name or "")) else 0.0
            total = lex_base + lex_syn + sem
            if total > 0 and exp_bonus > 0:
                total += exp_bonus
            return total

        matched_experts: List[Tuple[Expert, float]] = []
        matched_docs: List[Tuple[Document, float, str]] = []
        matched_experiences: List[Tuple[Experience, float]] = []
        matched_records: List[Tuple[KnowledgeRecord, float]] = []
        matched_decisions: List[Tuple[Decision, float]] = []
        matched_alts: List[Tuple[DecisionAlternative, float]] = []
        matched_evidence: List[Tuple[Evidence, float]] = []
        matched_lessons: List[Tuple[Lesson, float]] = []

        for exp in experts:
            if not _expert_allowed(exp.id):
                continue
            txt = f"{exp.name} {exp.title} {exp.domain} {exp.bio}".lower()
            s = _score_entity(txt, expert_name=exp.name)
            if any(np.lower() in query_lower for np in exp.name.split() if len(np) > 2):
                s += 5.0
            if s > 0:
                matched_experts.append((exp, s))

        for doc in documents:
            if not _expert_allowed(doc.expert_id):
                continue
            txt = f"{doc.title} {doc.extracted_text or ''}".lower()
            ename = doc.expert.name if doc.expert else ""
            s = _score_entity(txt, "document", doc.id, ename)
            snippet = ""
            if doc.extracted_text:
                for line in doc.extracted_text.split("\n"):
                    if any(t in line.lower() for t in expanded_tokens):
                        snippet = line.strip()
                        break
                if not snippet:
                    snippet = doc.extracted_text[:220]
            if s > 0:
                matched_docs.append((doc, s, snippet))

        for ex in experiences:
            if not _expert_allowed(ex.expert_id):
                continue
            txt = f"{ex.title} {ex.context} {ex.situation} {ex.challenge} {ex.actions_taken} {ex.results} {ex.key_learnings}".lower()
            ename = ex.expert.name if ex.expert else ""
            s = _score_entity(txt, "experience", ex.id, ename)
            if s > 0:
                matched_experiences.append((ex, s))

        for rec in records:
            if not _expert_allowed(rec.expert_id):
                continue
            txt = f"{rec.title} {rec.content} {rec.key_takeaways or ''}".lower()
            ename = rec.expert.name if rec.expert else ""
            s = _score_entity(txt, "record", rec.id, ename)
            if s > 0:
                matched_records.append((rec, s))

        for dec in decisions:
            if not _expert_allowed(dec.expert_id):
                continue
            txt = f"{dec.title} {dec.problem_definition} {dec.context} {dec.selected_decision} {dec.reasoning} {dec.outcome} {dec.lessons_learned}".lower()
            ename = dec.expert.name if dec.expert else ""
            s = _score_entity(txt, "decision", dec.id, ename)
            if s > 0:
                matched_decisions.append((dec, s))

        for alt in alternatives:
            txt = f"{alt.title} {alt.description} {alt.why_rejected}".lower()
            s = _score_entity(txt)
            if s > 0:
                matched_alts.append((alt, s))

        for ev in evidence_list:
            txt = f"{ev.title} {ev.content}".lower()
            s = _score_entity(txt)
            if s > 0:
                matched_evidence.append((ev, s))

        for lsn in lessons:
            if not _expert_allowed(lsn.expert_id):
                continue
            txt = f"{lsn.title} {lsn.insight} {lsn.anti_pattern_to_avoid} {lsn.recommended_practice}".lower()
            ename = lsn.expert.name if lsn.expert else ""
            s = _score_entity(txt, "lesson", lsn.id, ename)
            if s > 0:
                matched_lessons.append((lsn, s))

        matched_experts.sort(key=lambda x: x[1], reverse=True)
        matched_docs.sort(key=lambda x: x[1], reverse=True)
        matched_experiences.sort(key=lambda x: x[1], reverse=True)
        matched_records.sort(key=lambda x: x[1], reverse=True)
        matched_decisions.sort(key=lambda x: x[1], reverse=True)
        matched_alts.sort(key=lambda x: x[1], reverse=True)
        matched_evidence.sort(key=lambda x: x[1], reverse=True)
        matched_lessons.sort(key=lambda x: x[1], reverse=True)

        top_score = max(
            ([m[1] for m in matched_decisions] or [0]) +
            ([m[1] for m in matched_records] or [0]) +
            ([m[1] for m in matched_docs] or [0]) +
            ([m[1] for m in matched_experiences] or [0]) +
            ([m[1] for m in matched_experts] or [0])
        )
        total_matches = (
            len(matched_experts) + len(matched_docs) + len(matched_experiences) +
            len(matched_records) + len(matched_decisions) + len(matched_alts) +
            len(matched_evidence) + len(matched_lessons)
        )

        # Require a meaningful domain/semantic match (score >= 3.2)
        has_matches = total_matches > 0 and top_score >= 3.2

        return {
            "has_matches": has_matches,
            "top_score": round(top_score, 3),
            "base_tokens": base_tokens,
            "expanded_tokens": expanded_tokens,
            "context_expert": context_expert,
            "experts": [m[0] for m in matched_experts],
            "documents": matched_docs,
            "experiences": [m[0] for m in matched_experiences],
            "records": [m[0] for m in matched_records],
            "decisions": [m[0] for m in matched_decisions],
            "alternatives": [m[0] for m in matched_alts],
            "evidence": [m[0] for m in matched_evidence],
            "lessons": [m[0] for m in matched_lessons],
            "all_experts": experts,
        }
