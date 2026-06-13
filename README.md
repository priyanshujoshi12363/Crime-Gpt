# 🚔 CrimeGPT — AI-Powered Crime Documentation & Legal Intelligence

> **India's first completely offline AI assistant for police documentation.**  
> No internet. No server. No data leak. Just results.

<div align="center">

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey)
![Offline](https://img.shields.io/badge/mode-100%25%20Offline-success)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)
![SIH](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-purple)

</div>

---

## 📸 UI Prototype

🔗 **[View Interactive Prototype on Google Stitch](https://stitch.withgoogle.com/projects/17500915415542174361)**

---

## 📖 Table of Contents

- [What is CrimeGPT?](#-what-is-crimegpt)
- [Why It's Different](#-why-its-different)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Features](#-features)
- [Database Schema](#️-database-schema)
- [AI Legal Engine](#-how-the-ai-legal-engine-works)
- [Setup & Installation](#-setup--installation)
- [Building for Production](#-building-for-production)
- [Security](#-security)
- [Multilingual Support](#-multilingual-support)
- [Known Issues](#-known-issues)
- [License](#-license)

---

## 🎯 What is CrimeGPT?

CrimeGPT eliminates the paperwork burden on Indian police officers. Instead of manually filling out 7+ documents per case — re-entering the same names, addresses, sections, and dates — officers enter case data **once**. CrimeGPT auto-generates every required document, suggests applicable **BNS / BNSS / BSA** legal sections, and maintains a chronological case diary.

---

## ⚔️ Why It's Different

| Every Other Solution | CrimeGPT |
|---|---|
| Cloud-based — crime data leaves the station | **100% Offline** — data never leaves the device |
| Requires internet | Works in basements, remote areas, network blackouts |
| Server approval, IT dependency | **Plug-and-play executable** |
| AI runs on expensive cloud GPUs | **Quantized Qwen 4B/8B runs locally on a laptop** |
| English-only interfaces | **Gujarati + Hindi + English** |

---

## 🧠 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Desktop Shell** | Electron 33+ | Cross-platform, offline-first, native file system |
| **Frontend** | React 18 + Vite 6 | Fast HMR, modern component model |
| **Language** | JavaScript (ES2022) | No compilation overhead, rapid iteration |
| **Styling** | Tailwind CSS + Material 3 | Google Material Design, utility-first |
| **Database** | sql.js (SQLite via WASM) | Zero native deps, runs entirely in-process |
| **AI Runtime** | Ollama | Local quantized model management via REST |
| **LLM** | Qwen 2.5 (4B/8B Q4_K_M) | Multilingual — Gujarati, Hindi, English |
| **Doc Generation** | python-docx / docxtpl | Template-based `.docx` output |
| **OCR** | Tesseract.js (WASM) | Offline text extraction from scanned docs |
| **Translation** | IndicTrans2 | Indic language offline translation |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│                  ELECTRON SHELL                   │
│  ┌────────────────────────────────────────────┐  │
│  │          React + Vite (Renderer)            │  │
│  │          • Material Design 3 UI             │  │
│  │          • React Router (Hash Router)       │  │
│  │          • Zustand (State Management)       │  │
│  └────────────────────────────────────────────┘  │
│                       ↕ IPC                       │
│  ┌────────────────────────────────────────────┐  │
│  │          Electron Main Process              │  │
│  │          • sql.js (SQLite via WASM)         │  │
│  │          • Ollama Child Process Manager     │  │
│  │          • Python Sidecar (Doc Generation)  │  │
│  └────────────────────────────────────────────┘  │
│                       ↕                           │
│  ┌────────────────────────────────────────────┐  │
│  │          Local AI Layer                     │  │
│  │          • Ollama Runtime                   │  │
│  │          • Qwen 2.5 4B/8B (Q4_K_M)         │  │
│  │          • IndicTrans2 (Offline Translation)│  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
```

> **Why sql.js over better-sqlite3?**  
> sql.js compiles SQLite to WebAssembly — no native Node.js bindings, no `node-gyp`, no platform-specific build headaches. The entire database runs in-process without any native addon compilation, making packaging with Electron straightforward across Windows and Linux.

---

## 📋 Features

### ✅ Implemented

- [x] Electron shell with React + Vite integration
- [x] SQLite database via sql.js (zero native dependencies)
- [x] Full database schema — cases, parties, documents, case diary, applied sections
- [x] Basic case creation form
- [x] Ollama process lifecycle management from Electron main process

### 🚧 In Progress

- [ ] Document template engine (Chargesheet, Remand Letter, Medical Letter, Seizure Receipt)
- [ ] Legal section suggestion via Qwen (prompt-engineered for BNS/BNSS/BSA)
- [ ] Case diary timeline view
- [ ] Multilingual input (Gujarati / Hindi / English)
- [ ] Offline sync status indicator

### 🗺️ Roadmap

- [ ] Full 7-document auto-generation
- [ ] Landmark judgment cross-referencing
- [ ] Voice-to-text FIR narration (offline STT)
- [ ] Evidence image upload + OCR tagging
- [ ] Dark mode
- [ ] CCTNS / BharatPol mock API integration
- [ ] Role-based access (IO / SHO / Legal Advisor)

---

## 🗄️ Database Schema

> Powered by **sql.js** — SQLite compiled to WASM, runs 100% in-process with no native bindings.

```sql
CREATE TABLE cases (
  id          TEXT PRIMARY KEY,
  fir_number  TEXT UNIQUE,
  police_station_code TEXT,
  incident_date       DATETIME,
  incident_location   TEXT,
  description         TEXT,
  description_lang    TEXT DEFAULT 'en',
  status              TEXT DEFAULT 'ACTIVE',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parties (
  id            TEXT PRIMARY KEY,
  case_id       TEXT REFERENCES cases(id),
  party_type    TEXT,     -- 'ACCUSED' | 'VICTIM' | 'WITNESS'
  full_name     TEXT,
  address       TEXT,
  contact       TEXT,
  id_proof_type   TEXT,
  id_proof_number TEXT
);

CREATE TABLE documents (
  id           TEXT PRIMARY KEY,
  case_id      TEXT REFERENCES cases(id),
  doc_type     TEXT,     -- 'CHARGESHEET' | 'REMAND' | 'MEDICAL' | 'SEIZURE'
  doc_path     TEXT,
  version      INTEGER DEFAULT 1,
  generated_at DATETIME,
  data_snapshot TEXT     -- JSON snapshot of form data at generation time
);

CREATE TABLE case_diary (
  id           TEXT PRIMARY KEY,
  case_id      TEXT REFERENCES cases(id),
  event_type   TEXT,
  event_date   DATETIME,
  description  TEXT,
  officer_name  TEXT,
  officer_badge TEXT,
  created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applied_sections (
  id             TEXT PRIMARY KEY,
  case_id        TEXT REFERENCES cases(id),
  law_code       TEXT,     -- 'BNS' | 'BNSS' | 'BSA'
  section_number TEXT,
  section_title  TEXT,
  ai_suggested   INTEGER DEFAULT 0,   -- boolean
  officer_approved INTEGER DEFAULT 0, -- boolean
  confidence_score INTEGER
);
```

---

## 🧪 How the AI Legal Engine Works

The FIR narrative is sent to Qwen running locally via Ollama. The model responds with structured JSON containing applicable BNS/BNSS/BSA sections and confidence scores — entirely offline, no cloud call.

```javascript
const LEGAL_PROMPT = `
You are an expert Indian criminal law AI trained on BNS, BNSS, and BSA.
Given the incident description below, suggest all applicable legal sections.

Incident: {incident_description}

Respond ONLY with a valid JSON object in this exact format:
{
  "bns_sections": [
    {
      "section": "302",
      "title": "Murder",
      "reasoning": "Victim died due to intentional act by accused",
      "confidence": 95
    }
  ],
  "bnss_sections": [],
  "bsa_sections": []
}
`;

async function suggestSections(description) {
  const prompt = LEGAL_PROMPT.replace('{incident_description}', description);

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen2.5:4b-instruct-q4_K_M',
      prompt,
      stream: false,
      format: 'json'
    })
  });

  const data = await response.json();
  return JSON.parse(data.response);
}
```

---

## 🚀 Setup & Installation

### Prerequisites

| Software | Version | Required For |
|---|---|---|
| **Node.js** | 20.x or later | Electron + React runtime |
| **npm** | 9.x+ | Package management |
| **Ollama** | 0.5.0+ | Local LLM runtime |
| **Python** | 3.11+ | Document generation + IndicTrans2 translation |
| **Git** | 2.x+ | Version control |

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/your-org/crimegpt.git
cd crimegpt

# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

---

### Step 2: Install & Configure Ollama

```bash
# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows / macOS: download installer from https://ollama.com

# Pull the quantized Qwen model
# 4B recommended for 8GB RAM systems
ollama pull qwen2.5:4b-instruct-q4_K_M

# 8B for better accuracy (requires 16GB+ RAM)
ollama pull qwen2.5:8b-instruct-q4_K_M

# Verify
ollama list
```

---

### Step 3: Start Ollama Service

```bash
ollama serve

# Verify it's running on default port 11434
curl http://localhost:11434/api/tags
```

---

### Step 4: Launch the App

```bash
# Development mode (with HMR)
npm run dev

# Production build
npm run build

# Package as standalone executable
npm run package
```

---

## 📦 Building for Production

```bash
npm run build:win    # Windows  → .exe installer
npm run build:linux  # Linux    → .AppImage / .deb
npm run build:mac    # macOS    → .dmg
```

---

## 🔒 Security

| Layer | Protection |
|---|---|
| **Data at Rest** | AES-256-GCM via Electron `safeStorage` API |
| **Network** | No outbound connections — fully air-gapped |
| **AI Inference** | All processing local — zero data sent to cloud |
| **Document Output** | Encrypted `.docx` by default |
| **Access Control** | Optional PIN / password on app launch |

---

## 🌐 Multilingual Support

| Feature | Languages |
|---|---|
| UI Language | English, Gujarati, Hindi |
| FIR Input | Any of the 3 languages |
| Document Output | Generated in input language |
| AI Understanding | Qwen natively understands Gujarati & Hindi |
| Cross-language Translation | IndicTrans2 (fully offline) |

---

## 🐛 Known Issues

| Issue | Notes |
|---|---|
| **Ollama cold start** | First model load takes 15–30 seconds |
| **Memory usage** | Qwen 4B Q4 uses ~3.5 GB RAM — 8 GB+ system recommended |
| **Windows Defender** | May flag unpackaged Electron builds; sign the binary for production |
| **Gujarati fonts** | Install **Noto Sans Gujarati** if text doesn't render correctly |
| **sql.js persistence** | DB must be serialized and written to disk manually on each write — see `src/db/persist.js` |

---

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

## 🙏 Acknowledgments

- **Qwen Team (Alibaba)** — multilingual LLM enabling offline Hindi/Gujarati AI
- **Ollama** — local LLM deployment made simple
- **sql.js** — SQLite compiled to WASM with zero native dependencies
- **Indian Kanoon** — legal data structure inspiration
- **BPR&D** — documentation standards reference
- **Google Stitch** — rapid UI prototyping

---

<div align="center">

**Built for Smart India Hackathon 2026**  
Problem Statement: `PS-69EEFDFB90B99` | Category: 2 (Software)

**Made with ❤️ for Indian Law Enforcement**

</div>