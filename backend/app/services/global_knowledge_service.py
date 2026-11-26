import hashlib
import json
import math
import re
from collections import Counter
from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy.orm import Session
from app.models.entities import AuditLog, GlobalKnowledgeItem, IngestionJob


VALID_CATEGORIES = {"human", "scientific", "published", "real_world", "ai_generated"}


def _compute_sparse_embedding(text: str) -> Dict[str, float]:
    tokens = re.findall(r"\b[a-z0-9\-\.\/]{3,}\b", (text or "").lower())
    if not tokens:
        return {}
    counts = Counter(tokens)
    norm = math.sqrt(sum(v * v for v in counts.values())) or 1.0
    return {k: round(v / norm, 4) for k, v in counts.most_common(64)}


def _cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
    if not a or not b:
        return 0.0
    common = set(a.keys()) & set(b.keys())
    return sum(a[k] * b[k] for k in common)


def _chunk_text(text: str, chunk_size: int = 700, overlap: int = 100) -> List[str]:
    clean = (text or "").strip()
    if not clean:
        return []
    if len(clean) <= chunk_size:
        return [clean]
    chunks: List[str] = []
    start = 0
    while start < len(clean):
        end = min(len(clean), start + chunk_size)
        chunks.append(clean[start:end].strip())
        if end >= len(clean):
            break
        start = max(start + 1, end - overlap)
    return chunks


class GlobalKnowledgeService:
    """
    ENGINE 1: Global Knowledge Engine
    Supports categorized, provenance-tracked, deduplicated, chunked, and
    permission-governed knowledge ingestion and paginated semantic search.
    """

    @staticmethod
    def create_ingestion_job(
        db: Session,
        source_type: str,
        source_name: str,
        category: str,
    ) -> IngestionJob:
        cat = category if category in VALID_CATEGORIES else "scientific"
        job = IngestionJob(
            source_type=source_type,
            source_name=source_name,
            category=cat,
            status="queued",
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    @staticmethod
    def process_ingestion_job(
        db: Session,
        job_id: int,
        title: str,
        raw_content: str,
        category: str,
        domain: str,
        source_name: str,
        author_or_contributor: Optional[str] = None,
        publication_date: Optional[str] = None,
        source_location: Optional[str] = None,
        license_str: str = "CC-BY-4.0 / Authorized",
        access_permission: str = "public_platform",
        verification_status: str = "unverified",
        limitations: Optional[str] = None,
        expert_id: Optional[int] = None,
    ) -> IngestionJob:
        job = db.query(IngestionJob).filter(IngestionJob.id == job_id).first()
        if not job:
            raise ValueError(f"IngestionJob {job_id} not found")

        job.status = "processing"
        db.commit()

        try:
            cat = category if category in VALID_CATEGORIES else "scientific"
            # Rule: AI-generated knowledge can NEVER be auto-verified as human/scientific fact
            if cat == "ai_generated":
                ver_status = "ai_generated_unverified"
                conf = 0.70
            else:
                ver_status = verification_status if verification_status in ("verified", "unverified") else "unverified"
                conf = 0.92 if ver_status == "verified" else 0.80

            chunks = _chunk_text(raw_content)
            job.total_chunks = len(chunks)
            added = 0
            skipped = 0

            for idx, chunk in enumerate(chunks):
                c_hash = hashlib.sha256(f"{cat}:{domain}:{chunk}".encode("utf-8")).hexdigest()
                exists = db.query(GlobalKnowledgeItem.id).filter(
                    GlobalKnowledgeItem.content_hash == c_hash
                ).first()
                if exists:
                    skipped += 1
                    continue

                emb = _compute_sparse_embedding(f"{title} {domain} {chunk}")
                history = json.dumps([
                    {
                        "event": "ingested",
                        "timestamp": datetime.utcnow().isoformat(),
                        "job_id": job.id,
                        "source_type": job.source_type,
                    }
                ])
                item = GlobalKnowledgeItem(
                    title=title if len(chunks) == 1 else f"{title} [Part {idx + 1}/{len(chunks)}]",
                    category=cat,
                    domain=domain,
                    content=chunk,
                    chunk_index=idx,
                    content_hash=c_hash,
                    embedding_json=json.dumps(emb),
                    source_name=source_name,
                    author_or_contributor=author_or_contributor,
                    publication_date=publication_date,
                    source_location=source_location,
                    license=license_str,
                    access_permission=access_permission,
                    verification_status=ver_status,
                    confidence_score=conf,
                    limitations=limitations or ("AI-generated hypothesis; requires empirical validation." if cat == "ai_generated" else None),
                    processing_history=history,
                    expert_id=expert_id,
                )
                db.add(item)
                added += 1

            job.new_chunks_added = added
            job.duplicates_skipped = skipped
            job.status = "skipped_duplicate" if (added == 0 and skipped > 0) else "completed"
            job.completed_at = datetime.utcnow()

            db.add(AuditLog(
                actor=author_or_contributor or "ingestion_pipeline",
                action="global_knowledge_ingested",
                resource_type="IngestionJob",
                resource_id=str(job.id),
                details=f"category={cat}, added={added}, skipped_duplicates={skipped}",
            ))
            db.commit()
            db.refresh(job)
            return job
        except Exception as exc:
            job.status = "failed"
            job.error_message = str(exc)
            job.completed_at = datetime.utcnow()
            db.commit()
            db.refresh(job)
            return job

    @staticmethod
    def search(
        db: Session,
        query: str,
        category: Optional[str] = None,
        domain: Optional[str] = None,
        include_restricted: bool = False,
        limit: int = 20,
        offset: int = 0,
    ) -> Dict[str, Any]:
        q_emb = _compute_sparse_embedding(query)
        q_tokens = set(q_emb.keys())

        sql_q = db.query(GlobalKnowledgeItem)
        if category and category in VALID_CATEGORIES:
            sql_q = sql_q.filter(GlobalKnowledgeItem.category == category)
        if domain and domain.lower() != "all":
            sql_q = sql_q.filter(GlobalKnowledgeItem.domain.ilike(f"%{domain}%"))
        if not include_restricted:
            sql_q = sql_q.filter(GlobalKnowledgeItem.access_permission != "restricted")

        items = sql_q.all()
        scored: List[tuple] = []
        for item in items:
            try:
                emb = json.loads(item.embedding_json or "{}")
            except Exception:
                emb = {}
            sem = _cosine(q_emb, emb)
            txt_lower = f"{item.title} {item.domain} {item.content}".lower()
            lex = sum(0.25 for t in q_tokens if t in txt_lower)
            score = sem * 2.0 + lex
            if not query.strip() or score > 0:
                scored.append((item, round(score, 4)))

        scored.sort(key=lambda x: x[1], reverse=True)
        total = len(scored)
        page = scored[offset : offset + limit]

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "results": [
                {
                    "id": it.id,
                    "title": it.title,
                    "category": it.category,
                    "domain": it.domain,
                    "content": it.content,
                    "score": sc,
                    "provenance": {
                        "source_name": it.source_name,
                        "author_or_contributor": it.author_or_contributor,
                        "publication_date": it.publication_date,
                        "source_location": it.source_location,
                        "license": it.license,
                        "access_permission": it.access_permission,
                        "verification_status": it.verification_status,
                        "confidence_score": it.confidence_score,
                        "limitations": it.limitations,
                        "ingested_at": it.ingested_at.isoformat() if it.ingested_at else None,
                    },
                }
                for it, sc in page
            ],
        }
