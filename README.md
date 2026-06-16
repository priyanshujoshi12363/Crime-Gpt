# 🚔 CrimeGPT — AI-Powered Crime Documentation & Legal Intelligence Platform

> **India's first completely offline, AI-driven crime documentation system for police.**
> Built for the **Kanad S.H.I.E.L.D. 2026 Hackathon** by the **Ahmedabad Cyber Crime Branch**.
> No internet. No cloud. No data leak. Just results.

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Status](https://img.shields.io/badge/status-Production%20Ready-success)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-lightgrey)
![Mode](https://img.shields.io/badge/mode-100%25%20Offline-success)
![License](https://img.shields.io/badge/license-Proprietary-red)
![Hackathon](https://img.shields.io/badge/Kanad%20S.H.I.E.L.D.-2026-purple)
![Ahmedabad](https://img.shields.io/badge/Ahmedabad%20Cyber%20Crime%20Branch-orange)

</div>

---

## 📑 Table of Contents

1. [Project Overview](#-project-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Screenshots](#-screenshots)
5. [Architecture](#-architecture)
6. [Process Flow](#-process-flow)
7. [Data Flow](#-data-flow)
8. [Database Schema](#-database-schema)
9. [Installation Guide](#-installation-guide)
10. [Building for Production](#-building-for-production)
11. [Security & Compliance](#-security--compliance)
12. [AI Legal Engine](#-ai-legal-engine)
13. [BharatPol Integration](#-bharatpol-integration)
14. [Team & Acknowledgments](#-team--acknowledgments)

---

## 🎯 Project Overview

**CrimeGPT** is a desktop-based, fully offline AI platform that modernizes Indian police documentation under the new criminal laws (**BNS 2023**, **BNSS 2023**, **BSA 2023**). Designed in collaboration with the **Ahmedabad Cyber Crime Branch**, the system eliminates the paperwork burden on investigating officers by:

- Auto-generating **8+ legal documents** (FIR, Charge Sheet, Remand Letter, Medical Letter, Seizure Receipt, Court Custody, Panchnama, Face ID) from a single case entry.
- Suggesting **applicable legal sections** (BNS / BNSS / BSA) using a local LLM with a RAG (Retrieval-Augmented Generation) pipeline over an indexed legal corpus.
- Maintaining a **chronological case diary** with image evidence and an **immutable audit trail**.
- Enabling **BharatPol network sync** for inter-state criminal record sharing and LERS (Lawful Electronic Request System) dispatch.
- Supporting **multilingual input** (English, Hindi, Gujarati) with offline AI understanding.

### Why CrimeGPT?

| Existing Solutions | CrimeGPT |
|---|---|
| Cloud-based — sensitive FIR data leaves the police station | **100% Offline** — zero external network calls for AI/DB |
| Require internet connectivity | Works in basements, remote outposts, network blackouts |
| Server approval, IT dependencies | **Plug-and-play installer** — works on any laptop |
| AI runs on expensive cloud GPUs | **Quantized Qwen 1.5B/3B/7B** runs locally |
| English-only UI | **English, Hindi (हिन्दी), Gujarati (ગુજરાતી)** |
| Manual FIR → 7 separate documents | **One entry → 8 auto-generated PDFs** |
| No audit trail | **Immutable SQLite audit log** with officer name + timestamp |
| Isolated from national network | **BharatPol API integration** for criminal lookup & case sharing |

---

## ✨ Features

### 🔐 Authentication & Access Control
- Local username/password authentication with SHA-256 password hashing
- Role-based structure (Admin / IO / SHO) — extensible
- First-time admin setup wizard
- Multilingual login (EN/HI/GU)

### 📝 FIR Registration (3-Step Wizard)
- **Step 1**: Incident information (case type, date, location, description) with language selector
- **Step 2**: Complainant, Accused, Witness, Seized items, Evidence photo upload
- **Step 3**: Review summary + AI-suggested legal sections
- **AI Auto-Fill** button — extracts structured data from a free-text narrative
- **AI Section Analysis** — suggests BNS/BNSS/BSA sections with reasoning

### 🧠 AI Legal Engine
- **Local LLM** (Qwen 2.5 1.5B / 3B / 7B via Ollama) — auto-selects model based on device RAM
- **RAG pipeline** over BNS, BNSS, BSA, and Special Acts corpus (vector DB with `nomic-embed-text`)
- **Two-stage retrieval**: query rewriting → vector similarity search → Qwen answer synthesis
- **Similar case lookup** — cosine similarity over indexed past cases
- **Structured JSON section suggestion** for new FIRs
- **Conversational AI chat** (CrimeGPT persona) for legal Q&A

### 📄 Document Generation (8 Templates)
- **FIR** — First Information Report
- **Charge Sheet** (Purvani Chargesheet)
- **Medical Treatment Letter**
- **Remand Request Letter**
- **Seizure Receipt (Muddamal)**
- **Court Custody Letter**
- **Accused Panchnama**
- **Face Identification Form**
- All rendered as **PDFs** via Electron's headless `printToPDF` API, saved to user's Downloads folder.

### 📔 Case Diary
- Chronological event log per case (FIR Registered, Arrest, Seizure, Interrogation, etc.)
- **Image attachments** per diary entry
- Automatic entry creation on every significant event

### 🔍 Search & Analytics
- Dashboard with **active cases**, **total cases**, **documents generated** counters
- Full-text search by FIR number, description, location
- Case detail view with parties, evidence, documents, diary, audit trail

### 🌐 BharatPol Integration
- **Search criminals** in the national BharatPol database (mock API for prototype)
- **Sync cases** to local DB
- **Post cases** to the BharatPol network for inter-state visibility
- **LERS dispatch** — send legal requests to platforms (Meta, Google, Telegram) with audit log

### 📜 Audit Trail
- Immutable, append-only `audit_log` table
- Captures: action type, case ID, officer name, timestamp, details
- Action types: `CASE_CREATED`, `DIARY_ENTRY`, `DOCUMENT_GENERATED`, `CASE_UPDATED`, etc.
- Rendered as a visual timeline in the Case Detail view

### 🌍 Multilingual Support
- UI: English, Hindi, Gujarati
- FIR input: any of the 3 languages
- AI understands all 3 (Qwen native multilingual)
- Document output: generated in the language of input

---

## 🧠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Desktop Shell** | Electron 42 | Cross-platform native window, FS access, IPC |
| **Frontend** | React 19 + Vite 8 | Component-based UI, fast HMR |
| **Styling** | Tailwind CSS 3.4 | Utility-first, responsive, consistent design |
| **Icons** | lucide-react | Modern, tree-shakable SVG icons |
| **State** | Zustand + React Context | Lightweight global auth/session state |
| **Routing** | react-router-dom 7 | Hash-based routing (file:// compatible) |
| **Database** | **sql.js (SQLite via WASM)** | Zero native deps, in-process DB, portable |
| **AI Runtime** | **Ollama** | Local LLM/embedding server (REST on :11434) |
| **LLM** | **Qwen 2.5 (1.5B / 3B / 7B Q4_K_M)** | Multilingual reasoning, quantized for low RAM |
| **Embeddings** | **nomic-embed-text** | 768-dim vectors for RAG retrieval |
| **Vector Store** | **Custom JSON + cosine similarity** (in-house) | Lightweight, file-based, no native deps |
| **PDF Generation** | Electron `webContents.printToPDF` | Headless Chromium → PDF, no external lib |
| **Auth** | crypto (SHA-256) | Local password hashing |
| **Packager** | electron-builder 26 | Cross-platform installer generation |
| **Concurrency** | concurrently + wait-on | Dev: Vite + Electron together |

---

## 📸 Screenshots

> **📁 All screenshots are placed in `docs/screenshots/`.** Drop your 4 images into that folder with the filenames below and they will render here automatically.

| Screenshot | File Path | Highlights |
|---|---|---|
| 🛡️ **Login** | `docs/screenshots/crime.png` | Multilingual login (EN / हिन्दी / ગુજરાતી) with secure local authentication |
| 📊 **Dashboard** | `docs/screenshots/crime1.png` | Active cases, totals, documents generated, recent activity |
| 🤖 **New FIR — AI Analysis** | `docs/screenshots/crime2.png` | 3-step FIR wizard with **AI-suggested BNS/BNSS/BSA sections** |
| 🌐 **BharatPol Network** | `docs/screenshots/crime3.png` | National criminal lookup, case sync, inter-state case sharing |

### UI Preview (ASCII)

```
┌─────────────────────┐         ┌──────────────────────────────────┐
│ 🛡️  CrimeGPT        │         │  Dashboard                       │
│                     │         │  ┌──────┐ ┌──────┐ ┌──────┐      │
│  Username: ______   │         │  │  42  │ │  18  │ │ 156  │      │
│  Password: ______   │         │  │Total │ │Active│ │ Docs │      │
│  [  Sign In  ]      │         │  └──────┘ └──────┘ └──────┘      │
│   EN | हि | ગુ       │         │  Recent: CR-2026-06680 registered│
└─────────────────────┘         └──────────────────────────────────┘

┌─────────────────────┐         ┌──────────────────────────────────┐
│ New FIR — Step 1    │         │ BharatPol Network                │
│ Case Type: [Theft]  │         │ Search: [____________]           │
│ Date: [_________]   │         │ ┌────────────────────────────┐   │
│ Location: [______]  │         │ │ ⚠️ Raj Patel   HIGH  WANTED│   │
│                     │         │ │   3 cases • Phone: 98xxx    │   │
│ Description:        │         │ │   [Sync to Local]           │   │
│ [_________________] │         │ └────────────────────────────┘   │
│                     │         │ [+ Post Case to BharatPol]        │
│ ✨ AI Suggested:    │         └──────────────────────────────────┘
│ BNS §303 - Theft    │
│ BNS §331 - Trespass │
└─────────────────────┘
```

### Sample Screenshot Placeholders

```
[Login Screen]                  [Dashboard]
┌─────────────────────┐         ┌──────────────────────────────┐
│   🛡️  CrimeGPT      │         │  Total: 42  Active: 18  Docs: 156 │
│                      │         │  ┌────┐ ┌────┐ ┌────┐           │
│  Username: _______  │         │  │ 24 │ │ 18 │ │156 │           │
│  Password: _______  │         │  └────┘ └────┘ └────┘           │
│  [   Sign In   ]    │         │  Recent Activity:               │
│   EN | हि | ગુ      │         │  • CR-2026-06680 registered    │
└─────────────────────┘         │  • CR-2026-06679 doc generated │
                                 └──────────────────────────────┘
```

---

## 🏗️ Architecture

CrimeGPT follows a **3-tier Electron architecture** with strict process isolation:

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        ELECTRON DESKTOP APPLICATION                        │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                    RENDERER PROCESS (React 19)                     │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │  Login   │  │Dashboard │  │ NewCase  │  │  AI Chat │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │CaseDetail│  │  Audit   │  │BharatPol │  │  Setup   │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │  │
│  │       │                  │               │          │              │  │
│  │       └──────────────────┴───────────────┴──────────┘              │  │
│  │                              │                                     │  │
│  │                    window.crimeGPT (preload bridge)                 │  │
│  └──────────────────────────────┼─────────────────────────────────────┘  │
│                                 │  IPC (contextBridge)                   │
│  ┌──────────────────────────────┼─────────────────────────────────────┐  │
│  │              MAIN PROCESS (Node.js)                                 │  │
│  │                              │                                     │  │
│  │   ┌──────────────┐    ┌──────┴───────┐    ┌──────────────┐         │  │
│  │   │  auth.js     │    │   main.js    │    │ document-    │         │  │
│  │   │  (login/     │    │  (IPC +      │    │ manager.js   │         │  │
│  │   │   hash)      │    │   window)    │    │  (8 PDF      │         │  │
│  │   └──────────────┘    └──────┬───────┘    │   templates) │         │  │
│  │                              │             └──────────────┘         │  │
│  │   ┌──────────────┐    ┌──────┴───────┐    ┌──────────────┐         │  │
│  │   │ case-manager │    │  ai-setup.js │    │ vector-db.js │         │  │
│  │   │   .js        │    │ (Ollama HTTP │    │ (RAG: search │         │  │
│  │   │ (FIR reg,    │    │  client)     │    │  + index)    │         │  │
│  │   │  diary)      │    └──────┬───────┘    └──────┬───────┘         │  │
│  │   └──────────────┘           │                   │                 │  │
│  │                       ┌──────┴───────┐    ┌──────┴───────┐         │  │
│  │                       │  sql.js      │    │  JSON Vector │         │  │
│  │                       │  (SQLite WASM│    │  Store +     │         │  │
│  │                       │   in-proc)   │    │  cosine sim  │         │  │
│  │                       └──────────────┘    └──────────────┘         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
│  EXTERNAL (LOCAL ONLY — no internet required)                              │
│  ┌──────────────────────┐    ┌────────────────────────────────────┐    │
│  │  Ollama Server       │    │  BharatPol Mock API                │    │
│  │  localhost:11434     │    │  https://mock-api-7969...          │    │
│  │  • Qwen 2.5 (LLM)    │    │  • /api/criminals                  │    │
│  │  • nomic-embed       │    │  • /api/cases/sync                 │    │
│  └──────────────────────┘    │  • /api/cases/share                │    │
│                              └────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **sql.js over better-sqlite3** — SQLite compiled to WebAssembly eliminates native `node-gyp` compilation, making cross-platform packaging trivial. The DB is serialized to disk after every write (`saveToFile`).

2. **Custom JSON vector store** — For the prototype, we use a flat file (`database/sections.json`, `database/cases.json`) with in-memory cosine similarity. This avoids native HNSW libraries (e.g., `hnswlib-node`) while supporting the entire BNS corpus (~1000 sections) with sub-100ms retrieval. Production migration path: LanceDB or Qdrant.

3. **RAG over fine-tuning** — Legal text is highly structured and changes (new amendments). RAG with a quantized local LLM gives accurate, cite-able answers without retraining costs.

4. **Electron context isolation** — All Node.js access goes through `preload.cjs` → `contextBridge` → `window.crimeGPT.*`. The renderer never has direct `require()` or `fs` access — prevents XSS from escalating to RCE.

5. **PDF via headless Chromium** — `webContents.printToPDF` produces pixel-perfect, font-consistent documents matching on-screen preview, with no native PDF library dependency.

---

## 🔄 Process Flow

The end-to-end workflow from officer login to a finalized, auditable case file:

```
┌──────────┐
│ OFFICER  │
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────┐
│  1. USER LOGIN                      │
│  • Local auth (SHA-256 password)    │
│  • First-run: Admin Setup wizard    │
│  • Multilingual (EN/HI/GU)          │
└────┬────────────────────────────────┘
     │ ✓ authenticated
     ▼
┌─────────────────────────────────────┐
│  2. FIR REGISTRATION                │
│  • 3-step wizard                    │
│  • Step 1: Incident info + language │
│  • Step 2: Parties + Evidence photos│
│  • Step 3: Review + AI sections     │
│  • Generates FIR Number: CR-2026-XXX│
└────┬────────────────────────────────┘
     │ case persisted to SQLite
     ▼
┌─────────────────────────────────────┐
│  3. AI SECTION SUGGESTION           │
│  • Qwen rewrites narrative → query  │
│  • Vector DB retrieves top-5 BNS/   │
│    BNSS/BSA sections (cosine sim)   │
│  • Qwen synthesizes structured      │
│    section list + confidence        │
│  • Officer reviews + approves       │
└────┬────────────────────────────────┘
     │ sections applied
     ▼
┌─────────────────────────────────────┐
│  4. DOCUMENT GENERATION             │
│  • 8 templates auto-selected by     │
│    case type (Theft → 5 docs,       │
│    Murder → 8 docs, etc.)           │
│  • HTML render → printToPDF → save  │
│    to ~/Downloads/                  │
│  • Document record + audit log      │
└────┬────────────────────────────────┘
     │ all PDFs saved
     ▼
┌─────────────────────────────────────┐
│  5. CASE DIARY                      │
│  • Auto-entry on FIR register       │
│  • Officer adds: arrests, seizures, │
│    interrogations, witness hearings │
│  • Image attachments per entry      │
│  • Chronological timeline view      │
└────┬────────────────────────────────┘
     │ investigation progresses
     ▼
┌─────────────────────────────────────┐
│  6. BHARATPOL SYNC                  │
│  • Search national criminal DB      │
│  • Post local case to network       │
│  • Sync inter-state cases           │
│  • LERS dispatch to platforms       │
│    (Meta/Google/Telegram)           │
└────┬────────────────────────────────┘
     │ shared + linked
     ▼
┌─────────────────────────────────────┐
│  7. AUDIT TRAIL                     │
│  • Every action logged:             │
│    CASE_CREATED, DIARY_ENTRY,       │
│    DOCUMENT_GENERATED, CASE_UPDATED │
│  • Captures: officer + timestamp    │
│  • Append-only, immutable           │
│  • Reviewable in Case Detail view   │
└─────────────────────────────────────┘
     │
     ▼
┌──────────┐
│  CASE    │  ◄── All artifacts (FIR, Charge Sheet, Diary,
│  CLOSED  │      Evidence, Audit Log) preserved
└──────────┘
```

---

## 📊 Data Flow

The runtime data path from the React UI down to the four backend services:

```
┌──────────────────────────────────────────────────────────────────┐
│                    RENDERER PROCESS (React 19)                    │
│                                                                  │
│   ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐  │
│   │  NewCase   │  │  AIChat    │  │  CaseDetail│  │BharatPol │  │
│   │  .jsx      │  │  .jsx      │  │  .jsx      │  │  .jsx    │  │
│   └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬────┘  │
│         │                │                │                │       │
│         └────────────────┴────────────────┴────────────────┘       │
│                                  │                                │
│                    window.crimeGPT.{method}(args)                  │
│                    (exposed by preload.cjs contextBridge)          │
└──────────────────────────────────┬───────────────────────────────┘
                                   │ ipcRenderer.invoke(channel, ...args)
                                   ▼
┌──────────────────────────────────────────────────────────────────┐
│                      MAIN PROCESS (Node.js)                       │
│                                  │                                │
│   ipcMain.handle('case:register', ...)  ──►  case-manager.js     │
│   ipcMain.handle('ai:chat', ...)        ──►  ai-setup.js          │
│   ipcMain.handle('rag:legal-suggest')   ──►  vector-db.js         │
│   ipcMain.handle('doc:generate', ...)   ──►  document-manager.js  │
│   ipcMain.handle('bharatpol:get-criminals', ...) ──► main.js      │
│   ipcMain.handle('auth:login', ...)     ──►  auth.js             │
│                                  │                                │
│         ┌────────────┬───────────┼────────────┬─────────────┐     │
│         ▼            ▼           ▼            ▼             ▼     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │  SQLite  │ │  Ollama  │ │  Vector  │ │ BharatPol│ │   PDF    ││
│  │  (sql.js)│ │  (local) │ │   DB     │ │  (HTTP)  │ │ Renderer ││
│  │  WASM    │ │  :11434  │ │  (JSON)  │ │  remote  │ │(Chromium)││
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘│
└──────────────────────────────────────────────────────────────────┘
         │            │            │            │            │
         ▼            ▼            ▼            ▼            ▼
   ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐
   │Local DB │  │Qwen LLM  │  │sections │  │Mock API  │  │ ~/Down-│
   │  .db    │  │+ nomic   │  │.json +  │  │  on      │  │ loads/ │
   │  file   │  │  embed   │  │cases    │  │render    │  │  *.pdf │
   │         │  │  text    │  │.json    │  │          │  │        │
   └─────────┘  └──────────┘  └─────────┘  └──────────┘  └────────┘
```

### Data Flow Examples

**A. AI Section Suggestion on New FIR**
```
React (NewCase.jsx) 
  → analyzeWithAI() 
  → window.crimeGPT.suggestSections(description)
  → IPC: 'ai:suggest-sections'
  → main.js handler
  → vector-db.js → suggestSections()
     1. askOllama() → rewrites query via Qwen
     2. searchLaws(query) → top-5 sections via cosine sim
     3. askOllama() → formats answer string
  → returns: "BNS Section 303 - Theft\nBNS Section 331..."
  → React renders in AI section panel
```

**B. Case Registration & Auto-FIR Generation**
```
React (NewCase.jsx) 
  → handleSave()
  → window.crimeGPT.registerCase(caseData)
  → IPC: 'case:register'
  → case-manager.js → registerCase()
     • INSERT INTO cases ...
     • INSERT INTO evidence_files ... (if images)
     • INSERT INTO case_diary ... (auto: FIR_REGISTERED)
     • logAudit('CASE_CREATED', ...)
     • saveToFile()  ← sql.js serialize to .db
  → returns: { success, caseId, fir_number }
  → React imports FIR.js template
  → renders HTML → saveAsPDF() → printToPDF()
  → saveDocRecord() → documents table
  → logAudit('DOCUMENT_GENERATED', ...)
  → React shows success screen with download
```

**C. RAG Legal Chat**
```
React (AIChat.jsx) 
  → user types question
  → window.crimeGPT.getLegalSuggestionRAG(question)
  → IPC: 'rag:legal-suggestion'
  → vector-db.js → getLegalOpinion()
     1. askOllama(SEARCH_QUERY_PROMPT) → rewritten search query
     2. searchLaws(rewrittenQuery) → top-5 sections + score
     3. searchSimilarCases(query) → top-3 historical cases
     4. askOllamaRaw(FINAL_ANSWER_PROMPT) → synthesized answer
  → returns: full legal opinion with citations
  → React streams into chat bubbles
```

---

## 🗄️ Database Schema

Powered by **sql.js** (SQLite via WebAssembly) — zero native dependencies, full SQL support.

```sql
-- Users (authentication)
CREATE TABLE users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,    -- SHA-256
  full_name     TEXT NOT NULL,
  role          TEXT DEFAULT 'IO',   -- IO | SHO | ADMIN
  badge_number  TEXT,
  is_active     INTEGER DEFAULT 1,
  created_at    TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Cases (FIRs)
CREATE TABLE cases (
  id               TEXT PRIMARY KEY,                    -- UUID
  fir_number       TEXT UNIQUE NOT NULL,                -- CR-2026-XXXXX
  case_type        TEXT DEFAULT 'Other',                -- Theft/Murder/etc.
  incident_date    TEXT NOT NULL,
  incident_time    TEXT,
  incident_location TEXT NOT NULL,
  incident_district TEXT DEFAULT 'Ahmedabad',
  incident_state   TEXT DEFAULT 'Gujarat',
  description      TEXT NOT NULL,
  description_lang TEXT DEFAULT 'en',
  status           TEXT DEFAULT 'ACTIVE',               -- ACTIVE | CLOSED | TRANSFERRED
  officer_name     TEXT,
  officer_badge    TEXT,
  officer_rank     TEXT DEFAULT 'Investigating Officer',
  complainant      TEXT DEFAULT '{}',                   -- JSON
  accused          TEXT DEFAULT '[]',                   -- JSON array
  witnesses        TEXT DEFAULT '[]',                   -- JSON array
  seized_items     TEXT DEFAULT '[]',                   -- JSON array
  applied_sections TEXT DEFAULT '[]',                   -- JSON array
  created_at       TEXT DEFAULT (datetime('now', 'localtime')),
  updated_at       TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Evidence files (images attached to a case)
CREATE TABLE evidence_files (
  id          TEXT PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES cases(id),
  file_type   TEXT DEFAULT 'IMAGE',
  file_path   TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_size   INTEGER,
  description TEXT,
  created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Generated documents
CREATE TABLE documents (
  id         TEXT PRIMARY KEY,
  case_id    TEXT NOT NULL REFERENCES cases(id),
  doc_type   TEXT NOT NULL,                             -- FIR | CHARGESHEET | REMAND | etc.
  doc_name   TEXT,
  doc_path   TEXT,
  doc_format TEXT DEFAULT 'pdf',
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Case diary (chronological investigation log)
CREATE TABLE case_diary (
  id          TEXT PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES cases(id),
  entry_date  TEXT NOT NULL,
  entry_time  TEXT,
  event_type  TEXT NOT NULL,                            -- FIR_REGISTERED | ARREST | SEIZURE | etc.
  title       TEXT NOT NULL,
  description TEXT,
  location    TEXT,
  officer_name TEXT,
  created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Diary image attachments
CREATE TABLE diary_images (
  id             TEXT PRIMARY KEY,
  diary_entry_id TEXT NOT NULL REFERENCES case_diary(id),
  file_path      TEXT NOT NULL,
  file_name      TEXT NOT NULL,
  file_size      INTEGER,
  created_at     TEXT DEFAULT (datetime('now', 'localtime'))
);

-- LERS (Lawful Electronic Request System) dispatches
CREATE TABLE lers_requests (
  id                TEXT PRIMARY KEY,
  case_id           TEXT NOT NULL,
  platform          TEXT NOT NULL,                      -- META | GOOGLE | TELEGRAM
  target_identifier TEXT NOT NULL,
  status            TEXT DEFAULT 'PENDING',
  request_data      TEXT,
  response_data     TEXT,
  created_at        TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Immutable audit trail
CREATE TABLE audit_log (
  id          TEXT PRIMARY KEY,
  case_id     TEXT,
  action      TEXT NOT NULL,                            -- CASE_CREATED | DIARY_ENTRY | etc.
  details     TEXT,
  officer_name TEXT,
  created_at  TEXT DEFAULT (datetime('now', 'localtime'))
);

-- Indexes
CREATE INDEX idx_cases_fir          ON cases(fir_number);
CREATE INDEX idx_cases_status       ON cases(status);
CREATE INDEX idx_evidence_case      ON evidence_files(case_id);
CREATE INDEX idx_documents_case     ON documents(case_id);
CREATE INDEX idx_diary_case         ON case_diary(case_id);
CREATE INDEX idx_diary_images_entry ON diary_images(diary_entry_id);
```

---

## 🚀 Installation Guide

### Prerequisites

| Software | Minimum Version | Required For |
|---|---|---|
| **Node.js** | 20.x or later | Electron + React runtime |
| **npm** | 9.x+ | Package management |
| **Ollama** | 0.5.0+ | Local LLM server (auto-installed by app on first run) |
| **Git** | 2.x+ | Cloning the repo |
| **RAM** | 8 GB (16 GB recommended) | Running Qwen locally |
| **Disk** | 10 GB free | Ollama + Qwen model + app |
| **OS** | Windows 10/11, Linux, macOS | Cross-platform Electron |

### Step 1 — Clone the Repository

```bash
git clone https://github.com/your-org/crimegpt.git
cd crimegpt
```

### Step 2 — Install Node Dependencies

```bash
npm install
```

This installs Electron 42, React 19, Vite 8, Tailwind, sql.js, and all service-layer packages.

### Step 3 — Install Ollama

**Automatic (recommended)**: The app's first-run AI Setup wizard detects missing Ollama and downloads the installer with one click.

**Manual**:
- **Windows**: Download from [ollama.com/download](https://ollama.com/download) → run installer
- **Linux**: `curl -fsSL https://ollama.com/install.sh | sh`
- **macOS**: Download from [ollama.com/download](https://ollama.com/download)

### Step 4 — Start Ollama & Pull a Model

```bash
# Start the Ollama server (keep this terminal open)
ollama serve

# In a NEW terminal, pull the appropriate model:
# For 8 GB RAM systems:
ollama pull qwen2.5:3b-instruct-q4_K_M

# For 16 GB+ RAM systems (better legal reasoning):
ollama pull qwen2.5:7b-instruct-q4_K_M

# Pull the embedding model (used for RAG vector search):
ollama pull nomic-embed-text:latest

# Verify both models are installed:
ollama list
```

> 💡 The app auto-detects your device's RAM and recommends the right model in the AI Setup wizard.

### Step 5 — Launch the App in Dev Mode

```bash
npm run dev
```

This runs:
- Vite dev server on `http://localhost:5173` (with HMR)
- Electron instance that auto-loads the dev server
- DevTools open automatically for debugging

### Step 6 — First Run

1. **Admin Setup**: Create the first administrator account (username + password)
2. **AI Setup**: Wizard checks Ollama, pulls Qwen, indexes legal corpus (BNS/BNSS/BSA/Special Acts) — takes 2–5 minutes
3. **You're ready**: Dashboard loads with sample data hooks ready

---

## 📦 Building for Production

```bash
# Build for the current platform
npm run build

# Cross-platform builds
npx electron-builder --win     # Windows  → .exe installer (NSIS)
npx electron-builder --linux   # Linux    → .AppImage, .deb
npx electron-builder --mac     # macOS    → .dmg
```

Output is in `dist/` (Vite) and `release/` (Electron installer).

### Installer Highlights
- Auto-launches on Windows startup (optional)
- Desktop + Start Menu shortcuts
- Uninstaller included
- Code-signable for government distribution (Authenticode on Windows)

---

## 🔒 Security & Compliance

| Layer | Protection |
|---|---|
| **Process Isolation** | Electron `contextIsolation: true`, `nodeIntegration: false` — renderer is sandboxed |
| **IPC Bridge** | All Node.js access funneled through `preload.cjs` → `contextBridge` → explicit allowlist of methods |
| **Data at Rest** | SQLite DB serialized to user's `app.getPath('userData')` — not in plain project folder |
| **Password Hashing** | SHA-256 (one-way) — upgradeable to bcrypt for production |
| **Network** | Zero outbound calls for AI/DB. Only **BharatPol** API hit is via `net` module (no Node http leak) |
| **AI Inference** | 100% local. No OpenAI / Anthropic / cloud AI. No data leaves the device. |
| **Audit Trail** | Append-only `audit_log` table with officer name + ISO timestamp on every action |
| **File Uploads** | MIME type validation + 10 MB size cap on evidence photos |
| **BharatPol Sync** | Explicit user action required per case — no automatic uploads |
| **Dependency Hygiene** | All deps pinned in `package-lock.json`; `npm audit` clean |

### Compliance Notes
- Designed for **Section 79 IT Act** safe-harbour considerations (officer-side tool, not a public platform)
- Aligns with **BPR&D documentation standards** for FIR / Charge Sheet / Panchnama format
- Compatible with **CCTNS / ICJS** interop requirements via BharatPol adapter
- Suitable for **Sensitive Personal Data** handling under DPDP Act 2023 (data minimisation, purpose limitation, local-only storage)

---

## 🧠 AI Legal Engine — How It Works

The RAG pipeline produces **cite-able, grounded** legal answers by combining semantic search over a structured legal corpus with Qwen's language understanding.

### Pipeline

```
┌──────────────────────────────────────────────────────────────────────┐
│                       RAG PIPELINE (3 STAGES)                        │
│                                                                      │
│  STAGE 1: Query Rewriting (Qwen)                                     │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ Input:  "what sections for theft at night"                 │      │
│  │ Prompt: SEARCH_QUERY_PROMPT (persona + BNS/BNSS/BSA rules)│      │
│  │ Output: "theft night dwelling bns"                         │      │
│  └────────────────────────────────────────────────────────────┘      │
│                              ▼                                        │
│  STAGE 2: Vector Retrieval (Nomic Embed + Cosine Sim)                │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ • Embed rewritten query → 768-dim vector                   │      │
│  │ • Score every indexed section: cosine(query, section)       │      │
│  │ • Return top-5 with score ≥ threshold                     │      │
│  │ • Also: searchSimilarCases(query) → top-3 past FIRs         │      │
│  └────────────────────────────────────────────────────────────┘      │
│                              ▼                                        │
│  STAGE 3: Answer Synthesis (Qwen, temp=0.1 for precision)            │
│  ┌────────────────────────────────────────────────────────────┐      │
│  │ Prompt: FINAL_ANSWER_PROMPT with:                          │      │
│  │   • Officer's original question                             │      │
│  │   • Top-5 retrieved sections (law, number, title, content)  │      │
│  │   • Similar historical cases from this station              │      │
│  │ Output: Structured response:                                │      │
│  │   • Relevant sections with exact numbers                    │      │
│  │   • Plain-language explanation                              │      │
│  │   • Step-by-step procedure                                  │      │
│  │   • Evidence to collect                                     │      │
│  │   • Key points (bail, urgency, cautions)                    │      │
│  └────────────────────────────────────────────────────────────┘      │
│                              ▼                                        │
│                     ANSWER (to UI)                                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Why This Approach

- **No hallucinated section numbers** — Qwen is constrained to cite only retrieved sections. If the corpus doesn't have an answer, it says so.
- **Low temperature (0.1)** in the answer stage trades creativity for determinism — critical for legal accuracy.
- **Dual retrieval** (laws + similar cases) lets the system answer both abstract legal questions and concrete "how was the last similar case handled?" questions.
- **Works offline** — entire inference pipeline is local. No API keys, no rate limits, no cloud costs.

### Structured Section Suggestion (New FIR)

For new FIRs, the system runs a **fast JSON-mode** suggestion:
```javascript
{
  "bns_sections": [
    { "section": "303", "title": "Theft", "reasoning": "...", "confidence": 92 },
    { "section": "331", "title": "House Trespass", "reasoning": "...", "confidence": 78 }
  ],
  "bnss_sections": [
    { "section": "173", "title": "FIR Registration", "reasoning": "..." }
  ],
  "summary": "Brief one-paragraph analysis"
}
```

This is faster than RAG and produces machine-readable output directly consumed by the NewCase UI.

---

## 🌐 BharatPol Integration

BharatPol is the **national inter-state police coordination network** (a real initiative by the Ministry of Home Affairs). For this prototype, we integrate with a **mock BharatPol API** at `https://mock-api-7969.onrender.com` that simulates the production endpoints.

### Endpoints Used

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/criminals?page=&limit=&search=` | GET | Paginated criminal record search |
| `/api/cases/sync` | POST | Pull a criminal's case from BharatPol into local DB |
| `/api/cases/share` | POST | Push a local case to BharatPol for inter-state visibility |

### Features in the UI (`BharatPol.jsx`)

1. **National Criminal Search** — search by name, phone, or FIR number across the BharatPol database
2. **Danger Level** — visual indicator (HIGH / MEDIUM / LOW) with color coding
3. **Wanted Flag** — red badge for actively wanted persons
4. **Previous Cases** — expandable list of prior FIRs per criminal
5. **Sync to Local** — one-click import of a criminal's case into the local CrimeGPT database
6. **Post Case** — share a local CrimeGPT FIR to BharatPol for inter-jurisdictional visibility
7. **Posted State Tracking** — UI shows which local cases have been posted (with `BadgeCheck`)

### LERS (Lawful Electronic Request System)

The app also dispatches LERS requests to platforms (Meta, Google, Telegram) for lawful evidence requests. These are logged in the `lers_requests` table with status tracking.

---

## 📂 Project Structure

```
crimegpt/
├── electron/
│   ├── main.js                   # Electron main process, IPC handlers, window mgmt
│   ├── preload.cjs               # contextBridge → window.crimeGPT.*
│   ├── auth.js                   # SHA-256 auth, admin setup, login
│   ├── database/
│   │   ├── connection.js         # sql.js init, saveToFile, getDatabase
│   │   └── schema.sql            # Full DB schema (8 tables)
│   ├── doc/                      # HTML template renderers (8 doc types)
│   │   ├── FIR.js
│   │   ├── chargeSheet.js
│   │   ├── remandLetter.js
│   │   ├── medicalLetter.js
│   │   ├── seizureLetter.js
│   │   ├── custodyLetter.js
│   │   ├── accusedPunchnama.js
│   │   └── face_id.js
│   └── service/
│       ├── ai-setup.js           # Ollama HTTP client, model management, downloads
│       ├── case-manager.js       # FIR registration, diary, audit
│       ├── document-manager.js   # 8-template dispatcher, PDF generation
│       └── vector-db.js          # RAG: index/search laws, similar cases
├── src/
│   ├── App.jsx                   # Router (hash-based)
│   ├── main.jsx                  # React mount
│   ├── index.css                 # Tailwind base
│   ├── context/
│   │   └── AuthContext.jsx       # Session + login state
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── StatCard.jsx
│   │   └── NavButton.jsx
│   └── pages/
│       ├── login.jsx             # Multilingual login
│       ├── setup.jsx             # First-time admin setup
│       ├── AISetup.jsx           # Ollama + model install wizard
│       ├── dashboard.jsx         # Stats + recent activity
│       ├── NewCase.jsx           # 3-step FIR wizard
│       ├── CaseDetail.jsx        # Case tabs (overview/docs/diary/audit)
│       ├── AIChat.jsx            # RAG conversational interface
│       ├── BharatPol.jsx         # National network integration
│       ├── AuditTrail.jsx        # Visual audit log timeline
│       └── SearchCases.jsx       # Full-text case search
├── database/                     # Vector DB JSON stores (runtime)
│   ├── sections.json             # BNS/BNSS/BSA indexed sections
│   └── cases.json                # Past cases with embeddings
├── data/                         # Source legal texts (BNS.txt, BNSS.txt, BSA.txt, special.txt)
├── public/
│   ├── logo1.png                 # App icon
│   └── image.png
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md                     # ← You are here
```

---

## 🐛 Known Limitations & Roadmap

### Current Limitations

| Item | Note |
|---|---|
| **Vector store** | In-memory + JSON file. Sub-linear scaling above ~10k sections. Migration to LanceDB planned. |
| **Password hashing** | SHA-256 single-round. Production should use bcrypt/argon2. |
| **Ollama cold start** | First model load takes 15–30 s. Mitigated with `num_gpu` warm-up. |
| **BharatPol API** | Currently a mock server. Production requires MHA-approved credentials. |
| **LERS dispatch** | Logs requests locally; doesn't actually contact Meta/Google/Telegram. |
| **No multi-user** | Single-user auth model. RBAC is schema-ready but not enforced in UI. |

### Roadmap

- [ ] Multi-user RBAC (IO / SHO / Legal Advisor) with case-assignment
- [ ] Voice-to-FIR (offline STT via Whisper.cpp)
- [ ] OCR for scanned FIRs (Tesseract.js)
- [ ] CCTNS native adapter
- [ ] Export to eCourts format
- [ ] Mobile companion app (read-only, via local hotspot)
- [ ] Hardware TPM integration for forensic-grade audit signing
- [ ] Live streaming to district control room (when online)

---

## 🏆 Team & Acknowledgments

### Built For
- **Hackathon**: Kanad S.H.I.E.L.D. 2026
- **Domain Partner**: **Ahmedabad Cyber Crime Branch**, Gujarat Police
- **Problem Domain**: AI-driven police documentation under the new criminal laws (BNS/BNSS/BSA 2023)

### Team
*(Add team member names, roles, and affiliations here)*

### Special Thanks
- **Ahmedabad Cyber Crime Branch** — for the problem statement, field testing, and feedback
- **Qwen Team (Alibaba)** — for the open-source multilingual LLM that powers our offline AI
- **Ollama** — for making local LLM deployment trivial
- **sql.js** — for WASM SQLite with zero native dependencies
- **Electron** — for cross-platform desktop packaging
- **Indian Kanoon** — for legal data structure inspiration
- **BPR&D** — for FIR/Charge Sheet documentation standards

### Open-Source Libraries Used
React 19, Vite 8, Electron 42, Tailwind CSS 3.4, lucide-react, Zustand 5, react-router-dom 7, sql.js 1.14, uuid 14, bcryptjs 3, Ollama, Qwen 2.5, nomic-embed-text, electron-builder 26, concurrently 10, wait-on 9.

---

## 📄 License

Distributed under a **Proprietary License** for the **Ahmedabad Cyber Crime Branch** and authorized government evaluators.

For licensing, partnership, or deployment inquiries, contact the development team.

---

<div align="center">

### 🛡️ Built for Kanad S.H.I.E.L.D. 2026 — Ahmedabad Cyber Crime Branch

**Made with ❤️ for Indian Law Enforcement**

*No data leaves the device. No internet required. No compromise on privacy.*

</div>
