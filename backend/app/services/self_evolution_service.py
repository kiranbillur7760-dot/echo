import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.entities import SelfEvolutionProposal

class SelfEvolutionService:
    @staticmethod
    def list_proposals(db: Session) -> List[SelfEvolutionProposal]:
        proposals = db.query(SelfEvolutionProposal).order_by(SelfEvolutionProposal.created_at.desc()).all()
        if not proposals:
            SelfEvolutionService.seed_samples(db)
            proposals = db.query(SelfEvolutionProposal).order_by(SelfEvolutionProposal.created_at.desc()).all()
        return proposals

    @staticmethod
    def get_proposal(db: Session, proposal_id: int) -> Optional[SelfEvolutionProposal]:
        return db.query(SelfEvolutionProposal).filter(SelfEvolutionProposal.id == proposal_id).first()

    @staticmethod
    def create_proposal(
        db: Session,
        title: str,
        subsystem: str,
        identified_weakness: str,
        evidence_rationale: str,
        proposed_change: str,
        baseline_benchmark: Optional[Dict[str, Any]] = None,
        projected_benchmark: Optional[Dict[str, Any]] = None,
        test_suite_description: Optional[str] = None
    ) -> SelfEvolutionProposal:
        proposal = SelfEvolutionProposal(
            title=title,
            subsystem=subsystem,
            identified_weakness=identified_weakness,
            evidence_rationale=evidence_rationale,
            proposed_change=proposed_change,
            baseline_benchmark=json.dumps(baseline_benchmark or {}),
            projected_benchmark=json.dumps(projected_benchmark or {}),
            test_suite_description=test_suite_description or "Automated deterministic benchmark test suite.",
            status="pending_approval"
        )
        db.add(proposal)
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def review_proposal(
        db: Session,
        proposal_id: int,
        approved: bool,
        reviewer_name: str,
        review_notes: str
    ) -> SelfEvolutionProposal:
        proposal = db.query(SelfEvolutionProposal).filter(SelfEvolutionProposal.id == proposal_id).first()
        if not proposal:
            raise ValueError(f"Proposal #{proposal_id} not found.")

        if approved:
            proposal.status = "approved"
            proposal.applied_at = datetime.utcnow()
        else:
            proposal.status = "rejected"

        proposal.reviewed_by = reviewer_name
        proposal.review_notes = review_notes
        db.commit()
        db.refresh(proposal)
        return proposal

    @staticmethod
    def seed_samples(db: Session):
        samples = [
            SelfEvolutionProposal(
                title="Integrate Automated Cryogenic Fuel Slosh Boundary Validator",
                subsystem="Experience Simulation Engine",
                identified_weakness="Simulation engine currently evaluates aerodynamic surface heating without verifying whether interior cryo-tank wall temperature exceeds liquid hydrogen boil-off limits (-253°C).",
                evidence_rationale="Self-Reflection audit #2 flagged moderate uncertainty when cadet submitted cryogenic tank shielding challenge. Grounding was derived from generic thermodynamic equations rather than verified tank flight limits.",
                proposed_change="Introduce a strict multiphase boundary validation check in `simulation_engine.py` that verifies internal wall thermal conduction gradient before synthesizing leading edge recommendations.",
                baseline_benchmark=json.dumps({
                    "cryo_eval_accuracy": "78.4%",
                    "epistemic_honesty": "92.0%",
                    "automated_test_pass_rate": "84.0%"
                }),
                projected_benchmark=json.dumps({
                    "cryo_eval_accuracy": "96.5%",
                    "epistemic_honesty": "99.0%",
                    "automated_test_pass_rate": "98.0%"
                }),
                test_suite_description="Benchmark suite simulating 10 cryogenic ascent profiles under Mach 3-6 transonic buffeting with boil-off constraint checking.",
                status="pending_approval"
            ),
            SelfEvolutionProposal(
                title="Enforce 1/3-Octave Acoustic Spectrum Damping Checks for Monolithic Ceramics",
                subsystem="Decision DNA & Epistemic Classifier",
                identified_weakness="When evaluating monolithic UHTCs (HfB2, ZrB2), the system currently evaluates overall sound pressure level (OASPL dB) but does not account for low-frequency structural resonance spikes between 120 Hz and 400 Hz.",
                evidence_rationale="NASA TM-82455 and Arc-Jet Run AJ-882 evidence logs establish that monolithic ceramic failure occurs primarily at modal resonant frequencies, not uniform white noise.",
                proposed_change="Expand the alternative comparison matrix in `decision_dna_service.py` to include spectral modal resonance checks whenever monolithic ceramic candidates are proposed.",
                baseline_benchmark=json.dumps({
                    "modal_risk_detection": "62.0%",
                    "alternative_comparison_fidelity": "88.0%"
                }),
                projected_benchmark=json.dumps({
                    "modal_risk_detection": "95.0%",
                    "alternative_comparison_fidelity": "97.5%"
                }),
                test_suite_description="Vibration test suite testing modal frequency resonance against C/SiC vs monolithic HfB2 under 160 dB buffet.",
                status="applied",
                reviewed_by="Dr. Alex Morgan (Principal Investigator)",
                review_notes="Approved and verified. Spectral modal check prevents catastrophic brittle ceramic selection.",
                applied_at=datetime.utcnow()
            )
        ]
        for s in samples:
            db.add(s)
        db.commit()
