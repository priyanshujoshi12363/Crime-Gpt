
# 🚔 CrimeGPT — AI-Powered Crime Documentation & Legal Intelligence

> **India's first completely offline AI assistant for police documentation.**  
> No internet. No server. No data leak. Just results.

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Status](https://img.shields.io/badge/status-prototype-orange)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-lightgrey)
![Offline](https://img.shields.io/badge/mode-100%25%20Offline-success)

---

## 📸 UI Prototype

🔗 **[View Interactive Prototype on Google Stitch](https://stitch.withgoogle.com/projects/17500915415542174361)**

---

## 🎯 What is CrimeGPT?

CrimeGPT eliminates the paperwork burden on Indian police officers. Instead of manually filling out 7+ documents per case — re-entering the same names, addresses, sections, and dates — officers enter case data **once**. CrimeGPT auto-generates every required document, suggests applicable BNS/BNSS/BSA legal sections, and maintains a chronological case diary.

### Why It's Different

| Every Other Solution | CrimeGPT |
|---|---|
| Cloud-based — crime data leaves the station | **100% Offline** — data never leaves the device |
| Requires internet | Works in basements, remote areas, network blackouts |
| Server approval, IT dependency | **Plug-and-play executable** |
| AI runs on expensive cloud GPUs | **Quantized Qwen 4B/8B runs locally on a laptop** |
| English-only interfaces | **Gujarati + Hindi + English** |

---

## 🧠 Tech Stack

┌─────────────────────────────────────────────┐
│              ELECTRON SHELL                   │
│  ┌─────────────────────────────────────────┐ │
│  │     React + Vite (Renderer)              │ │
│  │     • Material Design 3 UI               │ │
│  │     • React Router (Hash Router)         │ │
│  │     • Zustand (State Management)         │ │
│  └─────────────────────────────────────────┘ │
│                    ↕ IPC                      │
│  ┌─────────────────────────────────────────┐ │
│  │     Electron Main Process                │ │
│  │     • better-sqlite3 (Local Database)    │ │
│  │     • Ollama Child Process Manager       │ │
│  │     • Python Sidecar (Doc Generation)    │ │
│  └─────────────────────────────────────────┘ │
│                    ↕                          │
│  ┌─────────────────────────────────────────┐ │
│  │     Local AI Layer                       │ │
│  │     • Ollama Runtime                     │ │
│  │     • Qwen 2.5 4B/8B (Q4_K_M Quantized) │ │
│  │     • IndicTrans2 (Offline Translation)  │ │
│  └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘


| Layer | Technology | Why |
|---|---|---|
| **Desktop Shell** | Electron 33+ | Cross-platform, offline-first, native file system |
| **Frontend** | React 18 + Vite 6 | Fast HMR, TypeScript |
| **Styling** | Tailwind CSS + Material 3 | Google Material Design |
| **Database** | better-sqlite3 | Zero-config, embedded, fast |
| **AI Runtime** | Ollama | Local quantized models via REST API |
| **LLM** | Qwen 2.5 (4B/8B Q4_K_M) | Multilingual — Gujarati, Hindi, English |
| **Doc Generation** | python-docx / docxtpl | Template-based .docx output |
| **OCR** | Tesseract.js (wasm) | Offline text extraction |
| **Translation** | IndicTrans2 | Indic language translation |

---

## 📋 Features

### ✅ Implemented

- [x] Electron shell with React + Vite integration
- [x] SQLite database schema (cases, parties, documents, case diary)
- [x] Basic case creation form
- [x] Ollama process lifecycle management from Electron

### 🚧 In Progress

- [ ] Document template engine (Chargesheet, Remand Letter, Medical Letter, Seizure Receipt)
- [ ] Legal section suggestion via Qwen (prompt-engineered for BNS/BNSS/BSA)
- [ ] Case diary timeline view
- [ ] Multilingual input (Gujarati/Hindi/English)
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

## 🚀 Setup & Installation

### Prerequisites

| Software | Version | Required For |
|---|---|---|
| **Node.js** | 20.x or later | Electron + React runtime |
| **npm** | 9.x+ | Package management |
| **Ollama** | 0.5.0+ | Local LLM runtime |
| **Python** | 3.11+ | Document generation + translation |
| **Git** | 2.x+ | Version control |

### Step 1: Clone & Install Dependencies

```bash
# Clone the repository
git clone https://github.com/your-org/crimegpt.git
cd crimegpt

# Install Node dependencies
npm install

# Install Python dependencies
pip install -r requirements.txt
```

### Step 2: Install & Configure Ollama

```bash
# Install Ollama (Linux)
curl -fsSL https://ollama.com/install.sh | sh

# For Windows/Mac: download from ollama.com

# Pull the quantized Qwen model (4B recommended for 8GB RAM)
ollama pull qwen2.5:4b-instruct-q4_K_M

# Optional: 8B model for better accuracy (16GB+ RAM)
ollama pull qwen2.5:8b-instruct-q4_K_M

# Verify installation
ollama list
```

### Step 3: Start Ollama Service

```bash
# Start Ollama in background
ollama serve

# Verify it's running (default port 11434)
curl http://localhost:11434/api/tags
```

### Step 4: Launch the App

```bash
# Development mode (with HMR)
npm run dev

# Build for production
npm run build

# Package as standalone executable
npm run package
```

---

## 📦 Building for Production

```bash
npm run build:win    # Windows (.exe)
npm run build:linux  # Linux (.AppImage, .deb)
npm run build:mac    # macOS (.dmg)
```

---


## 🧪 How the AI Legal Engine Works

The app sends the FIR narrative to Qwen running locally via Ollama with a structured prompt:

```typescript
const LEGAL_PROMPT = `
You are an expert Indian criminal law AI trained on BNS, BNSS, and BSA.
Given the incident description, suggest applicable legal sections.

Incident: {incident_description}

Output as JSON:
{
  "bns_sections": [
    {
      "section": "302",
      "title": "Murder",
      "reasoning": "Victim died due to intentional act",
      "confidence": 95
    }
  ],
  "bnss_sections": [...]
}
`;

async function suggestSections(description: string) {
  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    body: JSON.stringify({
      model: 'qwen2.5:4b-instruct-q4_K_M',
      prompt: LEGAL_PROMPT.replace('{incident_description}', description),
      stream: false,
      format: 'json'
    })
  });
  return response.json();
}
```

---

## 🗄️ Database Schema

```sql
CREATE TABLE cases (
  id TEXT PRIMARY KEY,
  fir_number TEXT UNIQUE,
  police_station_code TEXT,
  incident_date DATETIME,
  incident_location TEXT,
  description TEXT,
  description_lang TEXT DEFAULT 'en',
  status TEXT DEFAULT 'ACTIVE',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE parties (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id),
  party_type TEXT,
  full_name TEXT,
  address TEXT,
  contact TEXT,
  id_proof_type TEXT,
  id_proof_number TEXT
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id),
  doc_type TEXT,
  doc_path TEXT,
  version INTEGER DEFAULT 1,
  generated_at DATETIME,
  data_snapshot TEXT
);

CREATE TABLE case_diary (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id),
  event_type TEXT,
  event_date DATETIME,
  description TEXT,
  officer_name TEXT,
  officer_badge TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applied_sections (
  id TEXT PRIMARY KEY,
  case_id TEXT REFERENCES cases(id),
  law_code TEXT,
  section_number TEXT,
  section_title TEXT,
  ai_suggested BOOLEAN DEFAULT 0,
  officer_approved BOOLEAN DEFAULT 0,
  confidence_score INTEGER
);
```

---

## 🔒 Security

| Layer | Protection |
|---|---|
| **Data at Rest** | AES-256-GCM via Electron safeStorage API |
| **Network** | No outbound connections — fully air-gapped |
| **AI Processing** | All inference local — zero data to cloud |
| **Document Output** | Encrypted .docx by default |
| **Access Control** | Optional PIN/password on app launch |

---

## 🌐 Multilingual Support

| Feature | Supported |
|---|---|
| UI Language | English, Gujarati, Hindi |
| FIR Input | Any of the 3 languages |
| Document Output | Generated in input language |
| AI Understanding | Qwen natively understands Gujarati & Hindi |
| Translation | IndicTrans2 for cross-language conversion |

---

## 🐛 Known Issues

- **Ollama cold start:** First model load takes 15-30 seconds
- **Memory:** Qwen 4B Q4 uses ~3.5GB RAM (8GB+ system recommended)
- **Windows Defender:** May flag unpackaged Electron builds
- **Gujarati fonts:** Install Noto Sans Gujarati if text doesn't render

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Qwen Team (Alibaba)** — multilingual LLM enabling offline Hindi/Gujarati AI
- **Ollama** — local LLM deployment made simple
- **Indian Kanoon** — legal data structure inspiration
- **BPR&D** — documentation standards
- **Google Stitch** — rapid prototyping platform

---

**Built for Smart India Hackathon 2026**  
**Problem Statement:** PS-69EEFDFB90B99 | **Category:** 2 (Software)

**Made with ❤️ for Indian Law Enforcement**
