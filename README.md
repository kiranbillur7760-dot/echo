# PROJECT ECHO — HUMAN INTELLIGENCE PLATFORM
> **"Preserve human expertise. Reconstruct decisions. Transform knowledge into the intelligence of tomorrow."**
> Category: Human Intelligence Platform | Core Architecture: 5 Integrated Intelligence Engines

---

## 1. Executive Summary

PROJECT ECHO is a next-generation Human Intelligence Platform built from scratch. Unlike ordinary AI chatbots or basic document search engines, PROJECT ECHO is designed to:
1. **Preserve Human Knowledge**: Capture tacit expertise, heuristics, operational context, and real-world failure modes.
2. **Reconstruct Expert Decisions**: Unpack why choices were made via a 9-point Decision DNA model (Problem, Context, Constraints, Alternatives, Reasoning, Supporting Evidence, Selected Choice, Outcomes, Lessons Learned).
3. **Transfer Human Intelligence**: Convert historical precedents into case studies, practical engineering challenges, multi-criteria reasoning-based assessments, and verifiable skill portfolios.

---

## 2. System Architecture

```
                                      +------------------------------------+
                                      |          USER INTERFACE            |
                                      |  Futuristic Command Center (Vite)  |
                                      |   Holographic Core • DNA Explorer  |
                                      +-----------------+------------------+
                                                        |
                                                        v (REST JSON /api)
+---------------------------------------------------------------------------------------------------------------+
|                                            PROJECT ECHO BACKEND (FastAPI)                                     |
+--------------------------+----------------------------+-----------------------------+-------------------------+
| A. KNOWLEDGE EXTRACTION  | B. DECISION DNA ENGINE     | C. SIMULATION ENGINE        | D. ASK ECHO & LEARNING  |
| - PyMuPDF & python-docx  | - 9-Point Decision Model   | - Similarity Vector Match   | - Epistemic Truth Engine|
| - Heuristic parsing      | - Alternative Matrix       | - Constraint Divergence     | - Rubric-Based Scoring  |
| - Provenance audit       | - Outcome & Lesson Links   | - Explicit [INFERENCE] Tags | - Skill Profile Updates |
+--------------------------+----------------------------+-----------------------------+-------------------------+
                                                        |
                                                        v (SQLAlchemy ORM)
+---------------------------------------------------------------------------------------------------------------+
|                                    NORMALIZED PERSISTENCE LAYER (SQLite / PostgreSQL)                         |
| Users • Experts • Profiles • Projects • Documents • KnowledgeRecords • Experiences • Decisions • Alternatives |
| Evidence • Outcomes • Lessons • Relationships • CaseStudies • Challenges • Submissions • Assessments • Skills |
+---------------------------------------------------------------------------------------------------------------+
```

---

## 3. The 5 Core Engines

### Engine A — Knowledge Extraction Engine
- **File Ingestion**: Ingests and parses technical PDF, DOCX, and text records using `PyMuPDF` (`pymupdf`) and `python-docx`.
- **Entity Extraction**: Automatically detects engineering constraints, decisions, trade-offs, and lessons learned.
- **Provenance & Review**: Maintains cryptographic and source document references with expert verification controls (`verified`, `rejected`, `draft`).

### Engine B — Expert Intelligence Graph
- **Topological Graph**: Connects all 9 entity types (Experts, Projects, Experiences, Decisions, Alternatives, Evidence, Outcomes, Lessons, Skills).
- **Interactive Force Simulation**: Real-time HTML5 Canvas force-directed rendering with zoom, pan, category filter chips, and an inspector drawer.

### Engine C — Decision DNA Engine
- **9-Point Decision Representation**:
  1. Problem Definition
  2. Operating Context
  3. Hard Constraints
  4. Evaluated Alternatives (Pros, Cons, Why Rejected, Risk Rating)
  5. Expert Reasoning Rationale
  6. Supporting Empirical Evidence
  7. Selected Decision Architecture
  8. Measurable Outcomes & Validation Methods
  9. Retrospective Lessons Learned
- **Comparison Engine**: Side-by-side trade-off matrix contrasting selected architectures against rejected alternatives.

### Engine D — Experience Simulation Engine
- **New Dilemma Ingestion**: Users define custom problem statements and operating constraints.
- **Precedent Matching**: Retrieves relevant historical decisions and scores similarities vs. points of divergence.
- **Dual Approach Synthesis**: Proposes conservative precedent-aligned vs. hybrid graded architectures.
- **Strict Epistemic Guardrails**: Flags AI-generated extrapolations with `[INFERENCE]` and explicitly details missing information to verify before committing.

### Engine E — Intelligence Transfer Engine
- **Interactive Case Studies**: E.g., *"The Hypersonic Thermal Dilemma: Mach 7+ Leading Edge Material Architecture"*.
- **Practical Challenges**: Multi-field submission for proposed solution, causal reasoning, rejected alternatives, and empirical evidence.
- **Automated Rubric Assessment**: Evaluates logic, technical depth, evidence, and problem-solving without penalizing valid alternative paths.
- **Skill Portfolios**: Awards competency points and updates mastery levels (`Novice`, `Competent`, `Proficient`, `Expert`).

---

## 4. Fictional Demonstration Scenario: Dr. Alex Morgan

To illustrate the complete end-to-end journey without using private proprietary data, PROJECT ECHO includes a complete synthetic aerospace scenario:
- **Expert**: Dr. Alex Morgan, Distinguished Fellow of Hypersonic Structures & High-Temperature Materials (22 Years Experience).
- **Project**: *Project Hyperion — Mach 7+ Atmospheric Transition Demonstrator*.
- **Decision DNA**: *Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider*.
  - **Evaluated & Rejected**: Ta-10W Refractory Alloy (Mass Budget Failure: +98% overweight), Reinforced Carbon-Carbon (Oxidation Burn-through Risk from acoustic micro-cracking), PICA-X Ablator (Single-flight consumable).
  - **Selected**: 3D-Woven Graded C/SiC Ceramic Matrix Composite with internal titanium silicate aerogel and Grafoil slotted collets.
  - **Evidence**: Arc-Jet Facility Run AJ-882 (45-cycle 1720°C plasma exposure) & FEA Anisotropic Stress Simulation.
  - **Outcome**: 128.4 kg total mass (-11.4% mass margin under budget) and 0.11 mm surface shape change after 12.4 minutes of Mach 7.4 glide.
- **Challenge & Assessment**: Elena Chen submitted a compliant C/SiC proposal; scored **94.5/100** with verified skills in *High-Temperature Materials Architecture* and *CTE Mitigation*.
- **Labeling**: All synthetic demonstration records are strictly labeled with `SYNTHETIC DEMONSTRATION DATA`.

---

## 5. Directory Structure

```
c:\Users\Kiran Revappa Billur\Desktop\echo\
|-- backend\
|   |-- app\
|   |   |-- core\
|   |   |   |-- config.py                 # Platform settings, CORS, DB & AI keys
|   |   |-- database\
|   |   |   |-- session.py                # SQLAlchemy engine, session maker, get_db
|   |   |-- models\
|   |   |   |-- __init__.py
|   |   |   |-- entities.py               # 19 normalized database models
|   |   |-- schemas\
|   |   |   |-- __init__.py
|   |   |   |-- common.py                 # Pydantic validation schemas
|   |   |-- services\
|   |   |   |-- document_service.py       # PyMuPDF/docx parsing & extraction
|   |   |   |-- decision_dna_service.py   # Decision DNA builder & comparison
|   |   |   |-- simulation_engine.py      # Experience simulation & inference tags
|   |   |   |-- ask_echo_engine.py        # Epistemic truth classification & citations
|   |   |   |-- learning_engine.py        # Multi-factor assessment & skill engine
|   |   |   |-- graph_service.py          # Topological knowledge graph builder
|   |   |   |-- seed_data.py              # Dr. Alex Morgan synthetic seed generator
|   |   |-- routers\
|   |   |   |-- auth.py                   # User authentication & tokens
|   |   |   |-- experts.py                # Expert profiles & project history
|   |   |   |-- documents.py              # File upload & text extraction
|   |   |   |-- knowledge.py              # Knowledge records, heuristics & review
|   |   |   |-- decisions.py              # Decision DNA & trade-offs
|   |   |   |-- simulation.py             # Experience simulation endpoints
|   |   |   |-- ask_echo.py               # Grounded Q&A queries
|   |   |   |-- learning.py               # Case studies, challenges & evaluations
|   |   |   |-- graph.py                  # Knowledge graph topology
|   |   |   |-- overview.py               # Dashboard metrics & insights
|   |   |-- main.py                       # FastAPI application & startup hook
|   |-- tests\
|   |   |-- test_direct_suite.py          # 8-suite direct integration test runner
|   |   |-- test_api.py                   # Pytest/TestClient test suite
|   |-- seed.py                           # CLI database seed script
|   |-- echo_intelligence.db              # SQLite persistence database
|   |-- uploads\                          # Uploaded document repository
|-- frontend\
|   |-- src\
|   |   |-- components\
|   |   |   |-- HolographicCore.tsx       # 3D interactive holographic canvas core
|   |   |   |-- InteractiveKnowledgeGraph.tsx # Canvas force-directed graph
|   |   |   |-- Sidebar.tsx               # Collapsible sci-fi navigation sidebar
|   |   |   |-- TopBar.tsx                # Breadcrumbs, global search & backend status
|   |   |   |-- Layout.tsx                # Top-level application shell
|   |   |-- pages\
|   |   |   |-- OverviewPage.tsx          # Hero, Core, Principles, Metrics & Insights
|   |   |   |-- ExpertsPage.tsx           # Expert catalog & onboarding modal
|   |   |   |-- ExpertDetailPage.tsx      # Comprehensive expert DNA & milestones
|   |   |   |-- KnowledgePage.tsx         # Document upload & knowledge records
|   |   |   |-- DecisionIntelligencePage.tsx # 9-Point Decision DNA & Comparison
|   |   |   |-- KnowledgeGraphPage.tsx    # Fullscreen topology explorer
|   |   |   |-- ExperienceSimulationPage.tsx # Problem simulation & inference badges
|   |   |   |-- AskEchoPage.tsx           # Epistemic Q&A & verifiable citations
|   |   |   |-- LearningPlatformPage.tsx  # Case studies, submission & rubric grading
|   |   |   |-- ProfilePage.tsx           # Cadet profile & skill portfolio
|   |   |   |-- SettingsPage.tsx          # Engine parameters & DB migration settings
|   |   |-- services\
|   |   |   |-- api.ts                    # Typed client API service
|   |   |-- types\
|   |   |   |-- index.ts                  # TypeScript interface definitions
|   |   |-- styles\
|   |   |   |-- index.css                 # Cyber styling, glassmorphism & glows
|   |   |-- App.tsx                       # React Router configuration
|   |   |-- main.tsx                      # Vite React entry point
|   |-- package.json
|   |-- vite.config.ts
|   |-- tailwind.config.js
|   |-- tsconfig.json
|   |-- index.html
|-- run_backend.bat                       # Windows one-click backend launcher
|-- run_frontend.bat                      # Windows one-click frontend launcher
|-- run_backend.ps1                       # PowerShell backend launcher
|-- run_frontend.ps1                      # PowerShell frontend launcher
|-- README.md                             # Comprehensive technical documentation
```

---

## 6. Technologies and Dependencies

### Frontend
- **Framework**: React 18.3.1 with TypeScript 5.6.3
- **Build Tool**: Vite 6.0.1
- **Styling**: Tailwind CSS 3.4.15 (Custom `#020713` palette, glassmorphism, neon borders, and cyber glow shadows)
- **Icons**: Lucide React
- **Routing**: React Router DOM 6.28.0
- **Visualization**: Optimized HTML5 Canvas 3D spherical projection & force-directed topology rendering (native high-DPI, zero heavy 3D engine overhead)

### Backend
- **Framework**: Python 3.11 with FastAPI (0.165.0)
- **Data Layer**: SQLAlchemy (2.1.9) with SQLite (PostgreSQL migration ready)
- **Validation**: Pydantic v2 (2.13.5) & Pydantic Settings
- **Document Processing**: `PyMuPDF` (`pymupdf 2.1`) & `python-docx` (1.2.0)
- **AI Integration**: Google GenAI SDK ready (`google-genai 2.24.0` / `google-generativeai 0.8.6`), with self-contained high-fidelity epistemic simulation mode
- **Server**: Uvicorn ASGI server

---

## 7. Database Entities & Relationships

| Entity | Table Name | Purpose | Key Foreign Keys & Relationships |
|---|---|---|---|
| `User` | `users` | Accounts & roles (Admin, Expert, Student) | Has one `Expert`, many `StudentSubmissions`, many `SkillProfiles` |
| `Expert` | `experts` | Preserved human expert entity | Links to `User`, `ExpertProfile`, `Projects`, `Decisions`, `Documents` |
| `ExpertProfile` | `expert_profiles` | Competencies, awards, milestones, papers | 1-to-1 with `Expert` |
| `Project` | `projects` | Engineering programs & flight tests | Foreign key: `expert_id` |
| `Document` | `documents` | Uploaded PDF/DOCX source files | Foreign key: `expert_id` |
| `KnowledgeRecord` | `knowledge_records` | Tacit heuristics, principles, patterns | Foreign keys: `expert_id`, `project_id`, `document_id` |
| `Experience` | `experiences` | Structured historical situation/challenge | Foreign keys: `expert_id`, `project_id` |
| `Decision` | `decisions` | 9-point Decision DNA | Links to `Expert`, `Alternatives`, `Evidence`, `Outcomes`, `Lessons` |
| `DecisionAlternative` | `decision_alternatives` | Rejected options with pros/cons/why | Foreign key: `decision_id` |
| `Evidence` | `evidence` | Empirical tests, arc-jet runs, FEA models | Foreign keys: `decision_id`, `knowledge_record_id` |
| `Outcome` | `outcomes` | Measurable flight metrics & validation | Foreign key: `decision_id` |
| `Lesson` | `lessons` | Anti-patterns and recommended practices | Foreign keys: `decision_id`, `expert_id` |
| `KnowledgeRelationship`| `knowledge_relationships`| Typed directed edges for knowledge graph | Generic source/target typed link table |
| `CaseStudy` | `case_studies` | Curated teaching scenarios | Foreign keys: `expert_id`, `decision_id` |
| `LearningChallenge` | `learning_challenges` | Practical engineering problem prompts | Foreign key: `case_study_id` |
| `StudentSubmission` | `student_submissions` | Student solution, reasoning, evidence | Foreign key: `challenge_id`, `user_id` |
| `Assessment` | `assessments` | 4-factor rubric score & expert feedback | 1-to-1 with `StudentSubmission` |
| `SkillProfile` | `skill_profiles` | Demonstrated student competencies | Foreign key: `user_id` |
| `ActivityLog` | `activity_logs` | Platform audit trail & recent events | Generic entity logging |

---

## 8. Complete API Endpoint Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Backend status, DB status, and AI engine mode |
| `GET` | `/api/overview/dashboard` | Aggregated analytics, recent activity, featured insight & research |
| `GET` | `/api/experts` | List all verified expert profiles |
| `GET` | `/api/experts/{id}` | Detailed expert profile with career trajectory & projects |
| `POST` | `/api/experts` | Onboard a new expert intelligence repository |
| `GET` | `/api/experts/{id}/projects` | List projects directed by expert |
| `POST` | `/api/documents/upload` | Upload PDF/DOCX; extract text and generate candidate records |
| `GET` | `/api/documents` | List uploaded technical documents |
| `GET` | `/api/knowledge/records` | Filter and search structured heuristics and principles |
| `POST` | `/api/knowledge/records` | Record a new tacit heuristic or rule of thumb |
| `PUT` | `/api/knowledge/records/{id}/verify` | Approve or reject candidate knowledge records |
| `GET` | `/api/decisions` | List all reconstructed decisions |
| `GET` | `/api/decisions/{id}/dna` | Retrieve full 9-point Decision DNA |
| `GET` | `/api/decisions/{id}/compare` | Retrieve side-by-side alternative comparison matrix |
| `POST` | `/api/decisions` | Reconstruct and store a new Decision DNA |
| `POST` | `/api/simulation/run` | Execute Experience Simulation against new engineering dilemmas |
| `POST` | `/api/ask-echo/query` | Epistemic truth query with 4-tier claim classification & citations |
| `GET` | `/api/learning/case-studies` | List practical engineering case studies |
| `GET` | `/api/learning/case-studies/{id}` | Case study detail with challenges and rubric |
| `POST` | `/api/learning/submissions` | Submit student solution; executes automated multi-factor evaluation |
| `GET` | `/api/learning/skills` | Retrieve student skill portfolio and verified competencies |
| `GET` | `/api/graph/data` | Topological node and edge data for interactive graph |

---

## 9. Exact Windows Execution Commands

### Prerequisites
- Python 3.11 installed
- Node.js v20+ and npm installed

### Option A: Using One-Click Batch Files (Recommended)
1. **Start Backend**: Double-click `run_backend.bat` (or run `./run_backend.ps1` in PowerShell).
   - Starts FastAPI on `http://localhost:8000`.
   - Automatically initializes and seeds the SQLite database (`echo_intelligence.db`).
2. **Start Frontend**: Double-click `run_frontend.bat` (or run `./run_frontend.ps1` in PowerShell).
   - Starts Vite React development server on `http://localhost:5173`.
   - Open your browser to `http://localhost:5173`.

### Option B: Manual Command Line
In PowerShell or CMD:

**Terminal 1 — Backend:**
```powershell
cd "c:\Users\Kiran Revappa Billur\Desktop\echo\backend"
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 — Frontend:**
```powershell
cd "c:\Users\Kiran Revappa Billur\Desktop\echo\frontend"
npm run dev
```

### Option C: Re-running the Automated Backend Test Suite
```powershell
cd "c:\Users\Kiran Revappa Billur\Desktop\echo"
python -u backend/tests/test_direct_suite.py
```

### Option D: Building Production Frontend Bundle
```powershell
cd "c:\Users\Kiran Revappa Billur\Desktop\echo\frontend"
npm run build
```

---

## 10. Automated Test Results and Verification

```
=======================================================
    PROJECT ECHO INTELLIGENCE PLATFORM TEST SUITE     
=======================================================

[1/8] Testing Overview Dashboard...
  -> SUCCESS: 1 Expert(s), 2 Records, 1 Decisions

[2/8] Testing Expert Management...
  -> SUCCESS: Verified 'Dr. Alex Morgan' (Distinguished Fellow of Hypersonic Structures & High-Temperature Materials) with 2 projects

[3/8] Testing Knowledge Records & Heuristics...
  -> SUCCESS: Retrieved record 'Heuristic for Aerothermal Fastener Attachment Flanges' [Status: verified, Conf: 0.98]

[4/8] Testing Decision DNA Engine...
  -> SUCCESS: Decision DNA 'Leading Edge Material Architecture Selection for Reusable Mach 7+ Glider' loaded with 3 alternatives & 2 evidence items
  -> SUCCESS: Alternative comparison matrix generated across 3 candidates

[5/8] Testing Experience Simulation Engine...
  -> SUCCESS: Simulation matched 1 historical cases and synthesized 2 approaches with strict epistemic boundaries

[6/8] Testing Ask ECHO Epistemic Grounded Q&A...
  -> SUCCESS: Query answered with 9 classified claims and 4 verifiable citations

[7/8] Testing Intelligence Transfer & Skill Assessment...
  -> SUCCESS: Evaluated Cadet submission [Score: 85.0/100, Mastery: Proficient]
  -> SUCCESS: Updated student skill portfolio (4 verified competencies)

[8/8] Testing Interactive Knowledge Graph Engine...
  -> SUCCESS: Knowledge graph generated with 16 nodes and 16 relationships across entity types: {'skill', 'project', 'evidence', 'alternative', 'lesson', 'decision', 'case_study', 'expert'}

=======================================================
>>> ALL 8 BACKEND ENGINE & API SUITES PASSED (100%) <<<
=======================================================
```

---

## 11. Features Implemented vs. Future Scope

### Features Fully Implemented
- [x] Complete project structure built from scratch with zero template bloat.
- [x] Sci-Fi Command Center Design System with `#020713` palette, glassmorphism, glowing borders, and responsive shell.
- [x] Signature Holographic Intelligence Core rendered via real interactive 3D spherical HTML5 canvas with orbital rings and mouse hover tracking.
- [x] 19-table normalized database model with foreign keys, relationships, and SQLite auto-seeding.
- [x] Knowledge Extraction Engine parsing PDF, DOCX, and text records using PyMuPDF and python-docx.
- [x] Decision DNA Engine assembling 9 distinct decision facets and trade-off matrices.
- [x] Experience Simulation Engine matching new dilemmas against historical records, projecting trade-offs, and explicitly labeling `[INFERENCE]` tags.
- [x] Ask ECHO AI Q&A segregating Documented Fact, Expert-Verified Information, AI-Generated Inference, and Insufficient Evidence with clickable provenance citations.
- [x] Intelligence Transfer Platform evaluating student submissions across 4 dimensions and awarding verified skill badges.
- [x] Interactive Knowledge Graph with force-directed simulation, zoom, pan, and category filters.
- [x] Complete synthetic aerospace scenario featuring Dr. Alex Morgan (Project Hyperion).
- [x] Windows launch scripts and comprehensive documentation.

### Future Scope / Startup Roadmap
- **pgvector Vector Database**: Introduce embeddings for million-record scale semantic retrieval.
- **Multi-Tenant Expert Guilds**: Enterprise team permissions and private expert circles.
- **Live Voice Interview Capture**: Transcribing verbal expert retrospectives directly into Decision DNA records.
