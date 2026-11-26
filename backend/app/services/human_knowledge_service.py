import re
import math
from collections import Counter
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.entities import (
    Expert, ExpertConsent, Document, KnowledgeRecord, KnowledgeUnit,
    Experience, Decision, DecisionAlternative, Evidence, Lesson
)
from app.schemas.common import ConversationTurn


STOP_WORDS = {
    "the", "and", "for", "are", "was", "has", "had", "have", "not", "that",
    "this", "with", "did", "how", "why", "what", "when", "who", "which",
    "from", "into", "can", "its", "our", "their", "his", "her", "she", "him",
    "they", "them", "you", "your", "would", "could", "should", "been",
    "will", "does", "about", "over", "also", "than", "then", "some",
    "any", "all", "but", "out", "one", "two", "use", "used", "using", "uses", "get", "per", "via",
    "improve", "make", "best", "ways", "explain", "tell", "compare", "between",
    "system", "systems", "human", "learn", "train", "design", "build", "topic",
    "stored", "causes", "differences", "modern", "short", "write", "work",
}

CONCEPT_SYNONYMS: Dict[str, List[str]] = {
    "aircraft": ["aerospace", "flight", "airframe", "hypersonic", "glider", "propulsion", "scramjet", "turbine", "engine"],
    "engine": ["propulsion", "scramjet", "aerothermal", "thermal", "turbine", "combustion", "cowl", "exhaust", "nozzle"],
    "safety": ["failure", "fracture", "mitigate", "reliability", "risk", "margin", "resilience", "catastrophic", "inspection", "redundancy"],
    "hypersonic": ["mach", "re-entry", "aerothermal", "hyperion", "glider", "stagnation", "shock", "bow shock"],
    "thermal protection": ["tps", "heat shield", "heat", "temperature", "leading edge", "nose cone", "ablation", "ablative", "c/sic", "composite", "grafoil"],
    "fastener": ["bolt", "flange", "collet", "attachment", "mounting", "bracket", "cte", "thermal expansion", "shear"],
    "c/sic": ["ceramic matrix", "cmc", "carbon silicon carbide", "cvi", "chemical vapor infiltration", "oxidation barrier"],
    "pica": ["pica-x", "ablator", "phenolic", "recession", "expendable"],
    "refractory": ["tantalum", "ta-10w", "tungsten", "hfc", "hafnium", "uhtc"],
    "life support": ["eclss", "celss", "bioregenerative", "closed loop", "ares", "bio-dome", "habitat", "autotrophy"],
    "algae": ["microalgae", "chlorella", "spirulina", "photobioreactor", "tubular", "biomass", "protein", "food"],
    "biofilm": ["piezoelectric", "ultrasonic", "42 khz", "transducer", "fouling", "adhesion"],
    "water": ["graywater", "distillation", "osmosis", "recycling", "wastewater", "scwo", "catalytic", "uv oxidation"],
    "carbon dioxide": ["co2", "oxygen", "o2", "scrubbing", "respiration", "sabatier", "solid amine", "savd"],
    "radiation": ["gcr", "cosmic ray", "galactic", "spe", "solar particle", "dose", "msv", "titan shield", "attenuation"],
    "shielding": ["bnnt", "boron nitride", "nanotube", "uhmwpe", "polyethylene", "hydrogen", "low-z", "high-z", "lead", "aluminum"],
    "neutron": ["spallation", "secondary neutron", "boron-10", "capture cross-section", "fragmentation", "recoil"],
    "regolith": ["sintering", "microwave", "basaltic", "soil", "brick", "additive", "berm", "in-situ"],
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
    Central Human Intelligence Retrieval Engine for PROJECT ECHO.
    Searches structured KnowledgeUnits, Decisions, KnowledgeRecords, Documents,
    Experiences, Evidence, and Lessons using TF-IDF semantic + keyword matching,
    strictly respecting ExpertConsent and Expert Verification status.
    """

    @staticmethod
    def resolve_conversation_context(
        query_lower: str,
        history: Optional[List[ConversationTurn]],
        experts: Optional[List[Expert]] = None,
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
            "decision", "the other", "compare", "follow up", "more about", "their", "elaborate", "explain more"
        ]
        is_follow_up = any(t in query_lower for t in follow_up_triggers) or len(query_lower.split()) <= 6

        if is_follow_up:
            combined_prev = f"{last_q} {last_a} {last_exp}"
            if experts:
                TITLE_PREFIXES = {"dr", "prof", "director", "chief", "mr", "ms", "mrs"}
                for exp in experts:
                    parts = [
                        p.strip(".,").lower()
                        for p in exp.name.split()
                        if len(p.strip(".,")) > 2 and p.strip(".,").lower() not in TITLE_PREFIXES
                    ]
                    if any(re.search(rf"\b{re.escape(p)}\b", combined_prev) for p in parts):
                        active_expert = exp.name
                        context_tokens.extend(parts)
                        context_tokens.extend(_tokenize(exp.domain)[:4])
                        break

            if not active_expert:
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
        expert_ids_filter: Optional[List[int]] = None,
        category_filter: Optional[str] = None,
        topic_filter: Optional[str] = None,
        verification_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        query_lower = query.strip().lower()
        experts = db.query(Expert).all()

        # Check active consent for every expert (enforce revocation/suspension ethics rule)
        consents = {c.expert_id: c for c in db.query(ExpertConsent).all()}
        consented_expert_ids = set()
        revoked_experts: List[str] = []
        for e in experts:
            c = consents.get(e.id)
            if c is None or (c.status == "active" and c.consent_knowledge):
                consented_expert_ids.add(e.id)
            else:
                revoked_experts.append(f"{e.name} ({c.status})")

        context_tokens, context_expert = HumanKnowledgeService.resolve_conversation_context(
            query_lower, conversation_history, experts
        )
        base_tokens, expanded_tokens = HumanKnowledgeService.expand_query_tokens(
            query_lower, context_tokens
        )

        documents = db.query(Document).all()
        experiences = db.query(Experience).all()
        records = db.query(KnowledgeRecord).all()
        knowledge_units = db.query(KnowledgeUnit).all()
        decisions = db.query(Decision).all()
        alternatives = db.query(DecisionAlternative).all()
        evidence_list = db.query(Evidence).all()
        lessons = db.query(Lesson).all()

        domain_expert_ids: Optional[set] = None
        if focus_domain and focus_domain.lower() != "all":
            fd_lower = focus_domain.lower()
            domain_expert_ids = {
                e.id for e in experts if fd_lower in (e.domain or "").lower()
            }

        def _expert_allowed(eid: Optional[int]) -> bool:
            if eid is not None and eid not in consented_expert_ids:
                return False
            if expert_id_filter and eid != expert_id_filter:
                return False
            if expert_ids_filter and eid not in expert_ids_filter:
                return False
            if domain_expert_ids is not None and eid not in domain_expert_ids:
                return False
            return True

        # Build corpus for TF-IDF semantic similarity
        corpus_docs: List[Tuple[str, int, str]] = []
        for ku in knowledge_units:
            if not _expert_allowed(ku.expert_id):
                continue
            if ku.verification_status in ("rejected", "ai_extracted") or ku.access_permissions == "suspended":
                continue
            if verification_filter == "approved_only" and ku.verification_status != "approved_by_expert":
                continue
            if category_filter and category_filter != "all" and ku.category != category_filter:
                continue
            if topic_filter and topic_filter != "all" and topic_filter.lower() not in (ku.topic or "").lower():
                continue
            corpus_docs.append((
                "knowledge_unit",
                ku.id,
                f"{ku.title} {ku.topic} {ku.description} {ku.problem_or_situation or ''} "
                f"{ku.context_and_experience or ''} {ku.reasoning_and_method or ''} "
                f"{ku.decisions_and_alternatives or ''} {ku.failures_and_lessons or ''}",
            ))
        for d in decisions:
            if _expert_allowed(d.expert_id):
                corpus_docs.append((
                    "decision",
                    d.id,
                    f"{d.title} {d.problem_definition} {d.context} {d.selected_decision} {d.reasoning} {d.outcome} {d.lessons_learned}",
                ))
        for r in records:
            if _expert_allowed(r.expert_id) and r.verification_status not in ("rejected", "draft"):
                corpus_docs.append((
                    "record",
                    r.id,
                    f"{r.title} {r.category} {r.content} {r.key_takeaways or ''}",
                ))
        for doc in documents:
            if not _expert_allowed(doc.expert_id):
                continue
            if not doc.is_synthetic_demo and not any(
                ku.source_reference and (doc.filename in ku.source_reference or doc.title in ku.source_reference) and ku.verification_status == "approved_by_expert"
                for ku in knowledge_units
            ):
                continue
            corpus_docs.append((
                "document",
                doc.id,
                f"{doc.title} {doc.extracted_text or ''}",
            ))
        for exp_item in experiences:
            if _expert_allowed(exp_item.expert_id):
                corpus_docs.append((
                    "experience",
                    exp_item.id,
                    f"{exp_item.title} {exp_item.context} {exp_item.situation} {exp_item.challenge} {exp_item.actions_taken} {exp_item.results} {exp_item.key_learnings}",
                ))
        for lsn in lessons:
            if _expert_allowed(lsn.expert_id):
                corpus_docs.append((
                    "lesson",
                    lsn.id,
                    f"{lsn.title} {lsn.insight} {lsn.anti_pattern_to_avoid} {lsn.recommended_practice}",
                ))

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

        bonus_expert_name = None
        for exp in experts:
            parts = [p.lower() for p in exp.name.split() if len(p) > 2 and p.lower() not in ("dr.", "prof.", "director")]
            if any(p in query_lower for p in parts):
                bonus_expert_name = exp.name
                break
        if not bonus_expert_name and context_expert:
            bonus_expert_name = context_expert

        def _score_entity(
            text_lower: str,
            kind: Optional[str] = None,
            oid: Optional[int] = None,
            expert_name: str = "",
            is_approved: bool = False,
        ) -> float:
            text_word_set = set(_tokenize(text_lower))
            matched_base = [t for t in base_tokens if (t in text_word_set or (len(t) >= 5 and t in text_lower))]
            matched_syn = [t for t in expanded_tokens if t not in base_tokens and (t in text_word_set or (len(t) >= 5 and t in text_lower))]
            match_count = len(matched_base) + len(matched_syn)
            lex_base = sum(1.8 for _ in matched_base)
            lex_syn = sum(0.8 for _ in matched_syn)
            sem = _tfidf_sim(kind, oid) * 8.0 if (kind and oid) else 0.0
            exp_bonus = 10.0 if (bonus_expert_name and bonus_expert_name == expert_name) else 0.0

            # Substantive match requires >= 2 terms for multi-term queries, or named expert bonus, or high semantic resonance
            has_substantive_match = (
                (match_count >= 2)
                or (match_count >= 1 and len(base_tokens) <= 1)
                or (exp_bonus > 0.0)
                or (sem >= 2.5)
            )
            approval_bonus = 1.2 if (is_approved and has_substantive_match) else 0.0

            total = lex_base + lex_syn + sem
            if total > 0 and has_substantive_match:
                total += exp_bonus + approval_bonus
            elif total > 0 and not has_substantive_match:
                total = min(total, 2.2)
            return total

        matched_experts: List[Tuple[Expert, float]] = []
        matched_units: List[Tuple[KnowledgeUnit, float]] = []
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

        for ku in knowledge_units:
            if ("knowledge_unit", ku.id) not in doc_token_lists:
                continue
            txt = (
                f"{ku.title} {ku.topic} {ku.description} {ku.problem_or_situation or ''} "
                f"{ku.context_and_experience or ''} {ku.reasoning_and_method or ''} "
                f"{ku.decisions_and_alternatives or ''} {ku.failures_and_lessons or ''}"
            ).lower()
            ename = ku.expert.name if ku.expert else ""
            s = _score_entity(
                txt,
                "knowledge_unit",
                ku.id,
                ename,
                is_approved=(ku.verification_status == "approved_by_expert"),
            )
            if s > 0:
                matched_units.append((ku, s))

        for doc in documents:
            if not _expert_allowed(doc.expert_id):
                continue
            if not doc.is_synthetic_demo and not any(
                ku.source_reference and (doc.filename in ku.source_reference or doc.title in ku.source_reference) and ku.verification_status == "approved_by_expert"
                for ku in knowledge_units
            ):
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
            s = _score_entity(txt, "experience", ex.id, ename, is_approved=bool(ex.verified))
            if s > 0:
                matched_experiences.append((ex, s))

        for rec in records:
            if not _expert_allowed(rec.expert_id) or rec.verification_status == "rejected":
                continue
            if verification_filter == "approved_only" and rec.verification_status not in ("verified", "approved_by_expert"):
                continue
            txt = f"{rec.title} {rec.content} {rec.key_takeaways or ''}".lower()
            ename = rec.expert.name if rec.expert else ""
            s = _score_entity(
                txt, "record", rec.id, ename,
                is_approved=(rec.verification_status in ("verified", "approved_by_expert")),
            )
            if s > 0:
                matched_records.append((rec, s))

        for dec in decisions:
            if not _expert_allowed(dec.expert_id):
                continue
            txt = f"{dec.title} {dec.problem_definition} {dec.context} {dec.selected_decision} {dec.reasoning} {dec.outcome} {dec.lessons_learned}".lower()
            ename = dec.expert.name if dec.expert else ""
            s = _score_entity(txt, "decision", dec.id, ename, is_approved=(dec.status == "verified"))
            if s > 0:
                matched_decisions.append((dec, s))

        for alt in alternatives:
            if alt.decision and not _expert_allowed(alt.decision.expert_id):
                continue
            txt = f"{alt.title} {alt.description} {alt.why_rejected}".lower()
            s = _score_entity(txt)
            if s > 0:
                matched_alts.append((alt, s))

        for ev in evidence_list:
            ev_expert_id = None
            if ev.decision:
                ev_expert_id = ev.decision.expert_id
            elif ev.knowledge_record:
                ev_expert_id = ev.knowledge_record.expert_id
            if ev_expert_id is not None and not _expert_allowed(ev_expert_id):
                continue
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

        # If talking directly to a selected expert and asking about their background/projects/decisions
        SELF_INTRO_TRIGGERS = (
            "work on", "yourself", "your project", "your background", "your experience",
            "your decision", "your expertise", "who are you", "what do you do", "tell me about you"
        )
        if expert_id_filter and any(t in query_lower for t in SELF_INTRO_TRIGGERS):
            if not matched_experts:
                matched_experts = [(e, 10.0) for e in experts if e.id == expert_id_filter and _expert_allowed(e.id)]
            if not matched_decisions:
                matched_decisions = [(d, 8.0) for d in decisions if d.expert_id == expert_id_filter and _expert_allowed(d.expert_id)]
            if not matched_records:
                matched_records = [(r, 6.0) for r in records if r.expert_id == expert_id_filter and _expert_allowed(r.expert_id)]
            if not matched_docs:
                matched_docs = [
                    (doc, 6.0, (doc.extracted_text or "")[:220])
                    for doc in documents
                    if doc.expert_id == expert_id_filter and _expert_allowed(doc.expert_id)
                ]

        for lst in (
            matched_experts, matched_units, matched_docs, matched_experiences,
            matched_records, matched_decisions, matched_alts, matched_evidence, matched_lessons
        ):
            lst.sort(key=lambda x: x[1], reverse=True)

        top_score = max(
            ([m[1] for m in matched_units] or [0])
            + ([m[1] for m in matched_decisions] or [0])
            + ([m[1] for m in matched_records] or [0])
            + ([m[1] for m in matched_docs] or [0])
            + ([m[1] for m in matched_experiences] or [0])
            + ([m[1] for m in matched_experts] or [0])
        )
        total_matches = (
            len(matched_experts) + len(matched_units) + len(matched_docs) + len(matched_experiences)
            + len(matched_records) + len(matched_decisions) + len(matched_alts)
            + len(matched_evidence) + len(matched_lessons)
        )

        # If an expert was explicitly selected and we didn't match strong terms, still allow lower threshold for general expert questions
        threshold = 2.0 if (expert_id_filter and total_matches > 0 and len(query_lower.split()) <= 8) else 3.2
        has_matches = total_matches > 0 and top_score >= threshold

        return {
            "has_matches": has_matches,
            "top_score": round(top_score, 3),
            "base_tokens": base_tokens,
            "expanded_tokens": expanded_tokens,
            "context_expert": context_expert,
            "revoked_experts": revoked_experts,
            "experts": [m[0] for m in matched_experts],
            "knowledge_units": [m[0] for m in matched_units],
            "documents": matched_docs,
            "experiences": [m[0] for m in matched_experiences],
            "records": [m[0] for m in matched_records],
            "decisions": [m[0] for m in matched_decisions],
            "alternatives": [m[0] for m in matched_alts],
            "evidence": [m[0] for m in matched_evidence],
            "lessons": [m[0] for m in matched_lessons],
            "all_experts": [e for e in experts if e.id in consented_expert_ids],
        }
