import sys
sys.path.insert(0, r'C:\Users\Kiran Revappa Billur\Desktop\echo\backend')

from app.database.session import SessionLocal
from app.services.echo_mirror_service import EchoMirrorService

db = SessionLocal()
questions = [
    "Who are you?",
    "Why do you exist?",
    "What is your ultimate purpose?",
    "Why was ECHO Mirror created?",
    "How are you different from Ask ECHO?",
    "Explain the complete PROJECT ECHO architecture.",
    "How do the five engines work together?",
    "What are your current limitations?",
    "Do you have consciousness?",
    "What is your future vision?",
]

print("=== ECHO MIRROR — 10-QUESTION TEST SUITE ===\n")
all_pass = True
for i, q in enumerate(questions, 1):
    result = EchoMirrorService.query_self(db, q)
    intent  = result["intent_classified"]
    chars   = len(result["answer"])
    n_facts = len(result["grounded_facts"])
    first   = result["answer"].split("\n")[0][:90]

    ok = intent != "general" and chars > 200 and n_facts >= 3
    if not ok:
        all_pass = False

    status = "PASS" if ok else "FAIL"
    print(f"  [{status}] Q{i}: {q}")
    print(f"         Intent : {intent}")
    print(f"         Length : {chars} chars | Facts: {n_facts}")
    print(f"         Lead   : {first}")
    print()

db.close()
print("=" * 50)
print("RESULT:", "ALL 10 PASSED" if all_pass else "SOME FAILED")
