# 📊 CrimeGPT — Detailed Data Flow Documentation

> **Purpose:** This document is the single source of truth for the runtime data flow of CrimeGPT. It is written as a structured, machine-readable specification so that a proper system-architecture diagram can be generated from it (manually, or via an LLM/agent) without ambiguity.
>
> **Scope:** Every data path from a user click in the React renderer down to the four backend services (SQLite DB, Ollama AI, BharatPol API, Vector DB) and back to the UI, including payload shapes, IPC channel names, and timing.

---

## 📑 Table of Contents

1. [System Topology](#1-system-topology)
2. [Process & Trust Boundaries](#2-process--trust-boundaries)
3. [External Services Inventory](#3-external-services-inventory)
4. [IPC Channel Catalog](#4-ipc-channel-catalog)
5. [End-to-End Data Flows](#5-end-to-end-data-flows)
   - [5.1 Authentication](#51-flow--authentication-user-login--admin-setup)
   - [5.2 FIR Registration + Auto-Document Generation](#52-flow--fir-registration--auto-document-generation)
   - [5.3 AI Section Suggestion (Fast JSON Path)](#53-flow--ai-section-suggestion-fast-json-path)
   - [5.4 RAG Legal Chat (3-Stage Pipeline)](#54-flow--rag-legal-chat-3-stage-pipeline)
   - [5.5 Case Diary Entry with Image Attachments](#55-flow--case-diary-entry-with-image-attachments)
   - [5.6 Document Generation (Per-Type)](#56-flow--document-generation-per-type)
   - [5.7 BharatPol Criminal Lookup](#57-flow--bharatpol-criminal-lookup)
   - [5.8 BharatPol Case Sync & Share](#58-flow--bharatpol-case-sync--share)
   - [5.9 LERS Request Dispatch](#59-flow--lers-request-dispatch)
   - [5.10 Audit Trail Read](#510-flow--audit-trail-read)
   - [5.11 Dashboard Stats](#511-flow--dashboard-stats)
   - [5.12 Vector DB Indexing (Startup)](#512-flow--vector-db-indexing-startup)
6. [Payload Schemas](#6-payload-schemas)
7. [Storage Locations](#7-storage-locations)
8. [Diagram Generation Prompt](#8-diagram-generation-prompt)

---

## 1. System Topology

The application is a **3-tier desktop system** with strict process isolation. There are exactly **two OS processes** (Electron main + renderer) and **two local/remote services** (Ollama, BharatPol) plus **two local data stores** (SQLite file, JSON vector store).

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         USER'S LAPTOP / DESKTOP                            │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  PROCESS A: ELECTRON RENDERER (Chromium Tab, sandboxed)              │  │
│  │  ─ React 19 UI, Tailwind, lucide-react                              │  │
│  │  ─ contextIsolation = true, nodeIntegration = false                  │  │
│  │  ─ No direct fs / require / process access                           │  │
│  │  ─ Communicates only via window.crimeGPT.* (preload bridge)          │  │
│  └──────────────────────────────┬───────────────────────────────────────┘  │
│                                 │                                          │
│                          IPC channel (async)                               │
│                                 │                                          │
│  ┌──────────────────────────────▼───────────────────────────────────────┐  │
│  │  PROCESS B: ELECTRON MAIN (Node.js, full privileges)                │  │
│  │  ─ Service layer: ai-setup, case-manager, document-manager,         │  │
│  │                   vector-db, auth                                    │  │
│  │  ─ Database layer: sql.js (SQLite compiled to WASM)                  │  │
│  │  ─ HTTP clients: node:http (Ollama), electron.net (BharatPol)        │  │
│  │  ─ File I/O: evidence images, diary images, PDF outputs              │  │
│  └─────────────┬────────────────────┬──────────────────────┬────────────┘  │
│                │                    │                      │               │
└────────────────┼────────────────────┼──────────────────────┼───────────────┘
                 │                    │                      │
       ┌─────────▼────────┐  ┌────────▼────────┐   ┌─────────▼────────┐
       │ LOCAL FILE       │  │ LOCAL HTTP      │   │ REMOTE HTTPS     │
       │ SQLite WASM      │  │ Ollama          │   │ BharatPol        │
       │ + JSON vectors   │  │ :11434          │   │ mock-api-7969    │
       │ (in userData)    │  │ (LLM + embed)   │   │ .onrender.com    │
       └──────────────────┘  └─────────────────┘   └──────────────────┘
```

---

## 2. Process & Trust Boundaries

| Boundary | What crosses it | Mechanism | Trust model |
|---|---|---|---|
| **Renderer ↔ Main** | Function calls (not raw messages) | `ipcRenderer.invoke` ↔ `ipcMain.handle` | Renderer is **untrusted**; main validates every payload |
| **Main ↔ Ollama** | JSON over HTTP | `node:http.request` to `localhost:11434` | Loopback only; no network egress |
| **Main ↔ BharatPol** | JSON over HTTPS | `electron.net.request` | Only outbound call; explicit user action required per case |
| **Main ↔ Filesystem** | `Buffer` + `fs.writeFileSync` | Direct (Node.js) | Sandboxed to `app.getPath('userData')` |
| **Main ↔ SQLite** | SQL statements + bound params | sql.js (in-process WASM) | Same-process; no IPC, no network |
| **Vector DB** | In-memory arrays of 768-dim Float32 | Plain JS objects in main process | Rebuilt on startup from `database/*.json` |

**Critical security invariants:**
- The renderer **cannot** read or write the filesystem directly.
- The renderer **cannot** make arbitrary HTTP requests (only via the explicit allowlist in `preload.cjs`).
- Passwords are **never** sent in clear text to the renderer (only `{ success, user: { id, username, fullName, role, badgeNumber } }`).
- The BharatPol payload is constructed in main, not renderer (renderer sends only `firNumber`).

---

## 3. External Services Inventory

| Service | Type | Endpoint | Auth | Direction | Trigger |
|---|---|---|---|---|---|
| **Ollama LLM** | Local HTTP | `http://localhost:11434/api/generate` | None (loopback) | Main → Ollama | User AI actions |
| **Ollama Embeddings** | Local HTTP | `http://localhost:11434/api/embeddings` | None (loopback) | Main → Ollama | Indexing, RAG search |
| **Ollama List Models** | Local HTTP | `http://localhost:11434/api/tags` | None (loopback) | Main → Ollama | AI Setup check |
| **Ollama Pull Model** | Local HTTP | `http://localhost:11434/api/pull` (streamed) | None (loopback) | Main → Ollama | First-time install |
| **BharatPol (Mock)** | Remote HTTPS | `GET https://mock-api-7969.onrender.com/api/criminals?page=&limit=&search=` | None (mock) | Main → BharatPol | User search |
| **BharatPol (Mock)** | Remote HTTPS | `POST https://mock-api-7969.onrender.com/api/cases/sync` | None (mock) | Main → BharatPol | User "Sync to Local" |
| **BharatPol (Mock)** | Remote HTTPS | `POST https://mock-api-7969.onrender.com/api/cases/share` | None (mock) | Main → BharatPol | User "Post Case" |

**Note on "offline":** The Ollama service is the only **required** external dependency for AI features. The BharatPol endpoints are **optional** and degrade gracefully — the app works fully without internet for all features except BharatPol sync.

---

## 4. IPC Channel Catalog

This is the complete allowlist of method calls exposed by `preload.cjs` to the renderer as `window.crimeGPT.*`. Every channel listed below is an `ipcMain.handle` in `electron/main.js`.

### Auth (3 channels)
| Channel | Renderer method | Args | Returns |
|---|---|---|---|
| `auth:check-setup` | `checkSetup()` | — | `{ needsSetup: boolean }` |
| `auth:setup-admin` | `setupAdmin(u, p)` | `username, password` | `{ success, error? }` |
| `auth:login` | `login(u, p)` | `username, password` | `{ success, user?, error? }` |

### AI Setup (8 channels)
| Channel | Renderer method | Returns |
|---|---|---|
| `ai:check-setup` | `checkAISetup()` | `{ ready, installed, running, device, qwenModel, models, qwenReady, embedReady, diskSpace }` |
| `ai:install-ollama` | `installOllama()` | `{ success }` (streams progress to `ai:download-progress`) |
| `ai:download-model` | `downloadModel()` | `{ success, modelName }` (streams `ai:download-progress`) |
| `ai:download-embed-model` | `downloadEmbedModel()` | `{ success, modelName }` |
| `ai:start-ollama` | `startOllama()` | `boolean` |
| `ai:download-progress` (event) | `onAIProgress(cb)` | `{ step, percent, modelName? }` (main → renderer push) |
| `ai:chat` | `aiChat(message)` | `string` (LLM response text) |
| `ai:legal-suggestion` | `getLegalSuggestion(fir)` | `{ bns_sections, bnss_sections, summary, error? }` |

### RAG (5 channels)
| Channel | Renderer method | Returns |
|---|---|---|
| `rag:search-laws` | `searchLaws(query)` | `[{ law, section, title, coreContent, procedure, illustration, score }]` |
| `rag:legal-suggestion` | `getLegalSuggestionRAG(query)` | `string` (full synthesized legal opinion) |
| `rag:search-similar-cases` | `searchSimilarCases(query)` | `[{ fir_number, description, score, ... }]` |
| `ai:suggest-sections` | `suggestSections(query)` | `string` (formatted section list) |
| `ai:embedding` | `getEmbedding(text)` | `Float32Array(768)` |
| `rag:index-status` | (internal) | `{ ready: boolean }` |

### Cases (5 channels)
| Channel | Renderer method | Args | Returns |
|---|---|---|---|
| `case:register` | `registerCase(data)` | `CaseData` (see §6) | `{ success, caseId, fir_number }` |
| `case:get-full` | `getFullCase(caseId)` | `caseId: string` | `FullCase` (with parsed JSON fields) |
| `case:generate-fir-number` | `generateFIRNumber()` | — | `{ fir_number: string }` |
| `case:get-all` | `getAllCases()` | — | `Case[]` |
| `case:search` | `searchCases(query)` | `query: string` | `Case[]` |
| `case:update-accused` | `updateCaseAccused(caseId, accused)` | `caseId, accused[]` | `{ success }` |

### Diary (2 channels)
| Channel | Renderer method | Args | Returns |
|---|---|---|---|
| `diary:add` | `addDiaryEntry(data)` | `{ case_id, entry_date, entry_time, event_type, title, description, location, officer_name, images[] }` | `{ success, entryId }` |
| `diary:get` | `getCaseDiary(caseId)` | `caseId` | `DiaryEntry[]` (with parsed `images[]`) |

### Documents (4 channels)
| Channel | Renderer method | Args | Returns |
|---|---|---|---|
| `doc:get-for-case` | `getDocsForCase(caseId)` | `caseId` | `[{ key, name, required, generated, path, date }]` |
| `doc:get-required` | `getRequiredDocuments(caseType)` | `caseType` | `[{ key, name, required }]` |
| `doc:save-record` | `saveDocRecord(caseId, docType, docName, docPath)` | `...` | `{ success, docId }` |
| `doc:generate` | `generateDocument(caseId, docKey, caseData)` | `...` | `{ success, path, error? }` |
| `doc:save-as-pdf` | `saveAsPDF(html, filename)` | `html, filename` | `{ success, path }` (also fires `download-complete` event) |

### Dashboard (1 channel)
| Channel | Renderer method | Returns |
|---|---|---|
| `dashboard:stats` | `getStats()` | `{ activeCases, totalCases, documentsGenerated }` |

### BharatPol (3 channels)
| Channel | Renderer method | Args | Returns |
|---|---|---|---|
| `bharatpol:get-criminals` | `getBharatPolCriminals(params)` | `{ page, limit, search? }` | `{ success, data[], total, totalPages }` |
| `bharatpol:sync-case` | `syncBharatPolCase(data)` | `{ firNumber, accusedName, accusedPhone }` | `{ success, ... }` |
| `bharatpol:share-case` | `shareBharatPolCase(data)` | full case payload (see §6) | `{ success, ... }` |

### LERS (2 channels)
| Channel | Renderer method | Returns |
|---|---|---|
| `lers:send` | `sendLERS(data)` | `{ success, requestId, status, message }` |
| `lers:get-for-case` | `getLERSForCase(caseId)` | `LERSRequest[]` |

### Audit (1 channel)
| Channel | Renderer method | Returns |
|---|---|---|
| `audit:get-for-case` | `getAuditLog(caseId)` | `AuditEntry[]` |

### Events (main → renderer, push)
| Event | Payload | When |
|---|---|---|
| `ai:download-progress` | `{ step: 'ollama' \| 'model', percent, modelName? }` | Streaming model install |
| `download-complete` | `{ filename, path }` | PDF saved to disk |

---

## 5. End-to-End Data Flows

Each flow below is documented as a numbered step-by-step sequence. **Use this section directly as the prompt for diagram generation.**

---

### 5.1 Flow — Authentication (User Login / Admin Setup)

**Trigger:** User opens app → `Login.jsx` or `setup.jsx` page loads.
**Outcome:** Session is set in `AuthContext`; user lands on Dashboard.

```
STEP 1. App boot
   main.js: app.whenReady() → initDatabase() → initVectorStore() → indexAllLegalData() → createWindow()

STEP 2. Renderer mounts, AuthContext useEffect fires
   React: useEffect → window.crimeGPT.checkSetup()
   IPC:  auth:check-setup
   Main:  hasUsers() → SELECT COUNT(*) FROM users → returns boolean
   Renderer: if needsSetup, navigate to /setup, else /login

STEP 3A. First-time setup path (no users exist)
   User fills username + password, clicks Create Admin
   React: setupAdmin(username, password)
   IPC:  auth:setup-admin
   Main:  setupAdmin() → crypto.createHash('sha256').update(password).digest('hex')
          → INSERT INTO users (username, password_hash, full_name, role, badge_number)
          → saveToFile() (sql.js export to .db file)
   Returns: { success: true }
   Renderer: navigate to /login

STEP 3B. Login path
   User fills username + password, clicks Sign In
   React: login(username, password)
   IPC:  auth:login
   Main:  authenticateUser() → SELECT * FROM users WHERE username=? AND is_active=1
          → verifyPassword(inputHash, storedHash) — SHA-256 compare
          → returns { success, user: { id, username, fullName, role, badgeNumber } }
   Renderer: AuthContext.login() → setUser(result.user) → navigate to /dashboard
```

**Data shapes:**

```ts
// Renderer → Main
{ username: string, password: string }

// Main → Renderer (success)
{
  success: true,
  user: {
    id: number,
    username: string,
    fullName: string,
    role: 'IO' | 'SHO' | 'ADMIN',
    badgeNumber: string
  }
}
```

**Storage touched:** `users` table in `crimegpt.db`.

---

### 5.2 Flow — FIR Registration + Auto-Document Generation

**Trigger:** User completes the 3-step `NewCase.jsx` wizard and clicks "Save Case & Generate FIR".
**Outcome:** Case row in DB, FIR PDF in `~/Downloads/`, audit log entry, case indexed in vector store.

```
STEP 1. User clicks "Save" in NewCase.jsx step 3
   React: handleSave()
          • Converts evidenceFiles (FileList) to base64 via FileReader
          • Parses AI-suggested sections (regex extracts "BNS/BNSS/BSA Section N - Title")
          • Builds CaseData object (see §6)

STEP 2. IPC call: case:register
   window.crimeGPT.registerCase(caseData)
   IPC:  case:register
   Main:  registerCase() in case-manager.js

STEP 3. Main: insert case row
   db.run(`
     INSERT INTO cases (
       id, fir_number, case_type, incident_date, incident_time,
       incident_location, incident_district, description, description_lang,
       officer_name, officer_badge, officer_rank,
       complainant, accused, witnesses, seized_items, applied_sections
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
   `, [uuid, firNumber, ...jsonStrings])
   • firNumber = caseData.fir_number || generateFIRNumber() → "CR-2026-XXXXX"

STEP 4. Main: write evidence images to disk
   For each img in caseData.evidence_images:
     • Resolve path: app.getPath('userData')/evidence/{caseId}/{uuid}.{ext}
     • fs.writeFileSync(path, Buffer.from(base64, 'base64'))
     • db.run('INSERT INTO evidence_files ...')

STEP 5. Main: create diary auto-entry
   db.run(`INSERT INTO case_diary (
     id, case_id, entry_date, entry_time,
     event_type, title, description, officer_name
   ) VALUES (?, ?, ?, ?, 'FIR_REGISTERED', 'FIR Registered', ?, ?)`,
     [uuid, caseId, today, nowTime, "FIR CR-... registered for <type> at <location>", officerName])

STEP 6. Main: log audit
   logAudit(caseId, 'CASE_CREATED', "FIR <num> registered for <type>", officerName)
   db.run('INSERT INTO audit_log (id, case_id, action, details, officer_name) VALUES (?, ?, ?, ?, ?)')

STEP 7. Main: persist DB
   saveToFile() → db.export() → Buffer → fs.writeFileSync(crimegpt.db)

STEP 8. Main: index case in vector store
   indexCaseData({
     id, fir_number, description, incident_location, incident_date, case_type,
     sections_applied: (data.sections || []).map(s => `${s.law} ${s.section}`)
   })
   → text = `FIR ${fir}: ${desc}. Location: ... Date: ... Type: ... Sections: ...`
   → getEmbedding(text) via Ollama nomic-embed-text → 768-dim Float32
   → push { id, fir_number, ..., embedding } to in-memory casesStore
   → fs.writeFileSync(database/cases.json, JSON.stringify(casesStore))

STEP 9. Return to renderer
   { success: true, caseId, fir_number: "CR-2026-XXXXX" }

STEP 10. Renderer: import FIR template and render
   const { renderFIR } = await import('../../electron/doc/FIR.js')
   const html = renderFIR({
     fir_number, fir_year, incident_date, incident_time,
     incident_location, description,
     complainant: { full_name, phone, address, id_proof_type, id_proof_number },
     accused: [{ full_name, alias, father_name, age, physical_description }],
     witnesses: [...], seized_items: [...], sections_applied: [...],
     officer_name, officer_rank, officer_badge,
   })

STEP 11. Renderer: save HTML as PDF
   window.crimeGPT.saveAsPDF(html, `FIR_${fir_number}.pdf`)
   IPC: doc:save-as-pdf
   Main: generateAndSavePDF(html, filename)
     • Spawns hidden BrowserWindow, loads HTML via data: URL
     • webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
     • Writes to app.getPath('downloads')/<filename>
     • Fires 'download-complete' event to renderer
   Returns: { success: true, path: "/Users/.../Downloads/FIR_CR-2026-XXXXX.pdf" }

STEP 12. Renderer: record document
   window.crimeGPT.saveDocRecord(caseId, 'FIR', 'First Information Report', pdfPath)
   IPC: doc:save-record
   Main: db.run('INSERT INTO documents (id, case_id, doc_type, doc_name, doc_path, doc_format) VALUES (?, ?, ?, ?, ?, "pdf")')

STEP 13. Main: log document audit
   logAudit(caseId, 'DOCUMENT_GENERATED', 'First Information Report', officerName)

STEP 14. Renderer: show success screen
   Case registered confirmation with FIR number + PDF path
```

**Data shapes:** See §6.A.

**Storage touched:**
- `cases`, `evidence_files`, `case_diary`, `audit_log`, `documents` (SQLite)
- `evidence/{caseId}/*.{ext}` (filesystem)
- `~/Downloads/FIR_*.pdf` (filesystem)
- `database/cases.json` (vector store)

---

### 5.3 Flow — AI Section Suggestion (Fast JSON Path)

**Trigger:** User clicks "Analyze Now" in NewCase.jsx step 1.
**Outcome:** Inline panel shows BNS/BNSS/BSA section numbers + reasoning.

```
STEP 1. React: analyzeWithAI()
   window.crimeGPT.suggestSections(form.description)

STEP 2. IPC: ai:suggest-sections
   Main: suggestSections(description) in vector-db.js

STEP 3. Stage 1 — Query rewriting (Qwen)
   const searchPrompt = SEARCH_QUERY_PROMPT.replace('{{QUERY}}', description)
   const searchQuery = (await askOllama(searchPrompt)).trim().substring(0, 300)
   Example: "theft at night" → "theft night dwelling bns"

STEP 4. Stage 2 — Vector retrieval
   results = await searchLaws(searchQuery, 5)
   if (results.length === 0) results = await searchLaws(description, 5)  // fallback
   // For each indexed section:
   //   score = round(cosine(queryEmbedding, sectionEmbedding) * 100)
   //   sort desc, take top 5
   Returns: [{ law, section, title, coreContent, procedure, illustration, score }, ...]

STEP 5. Stage 3 — Format answer (Qwen, temp=0.1)
   context = results.map(r => `${r.law.toUpperCase()} Section ${r.section} - ${r.title}`).join('\n')
   const finalPrompt = SECTION_SUGGESTION_PROMPT
     .replace('{{CONTEXT}}', context)
     .replace('{{QUERY}}', description)
   answer = (await askOllama(finalPrompt)).trim()
   Returns: "BNS Section 303 - Theft\nBNS Section 331 - House Trespass\n..."

STEP 6. Returns to renderer
   String answer rendered as <pre> in the AI Section panel
```

**External calls:**
- `Ollama POST /api/generate` × 2 (rewrite + format)
- `Ollama POST /api/embeddings` × 1 (query embedding)
- In-memory cosine similarity over `sectionsStore`

---

### 5.4 Flow — RAG Legal Chat (3-Stage Pipeline)

**Trigger:** User types question in `AIChat.jsx`.
**Outcome:** Full legal opinion with section citations + similar past cases.

```
STEP 1. React: user submits message
   window.crimeGPT.getLegalSuggestionRAG(question)

STEP 2. IPC: rag:legal-suggestion
   Main: getLegalOpinion(query) in vector-db.js

STEP 3. Stage 1 — Query rewriting (Qwen, askOllama with persona)
   const response = await askOllama(SEARCH_QUERY_PROMPT)
   searchQuery = response.trim().substring(0, 300)
   Example: "how was the last theft case handled?" → "theft case details sections bns"

STEP 4. Stage 2a — FIR detection
   const firMatch = query.match(/CR-\d{4}-\d{5}/i)
   if (firMatch):
     // User is asking about a specific case
     similarCases = await searchSimilarCases(firMatch[0], 3)
     results = []
   else:
     // General legal question
     results = await searchLaws(searchQuery, 5)
     if (results.length === 0) results = await searchLaws(query, 5)  // fallback
     similarCases = await searchSimilarCases(query, 3)

STEP 5. Stage 2b — Vector similarity (in-memory)
   queryEmbedding = await getEmbedding(searchQuery)  // Ollama /api/embeddings
   For each s in sectionsStore:
     score = cosine(queryEmbedding, s.embedding) * 100
   Sort desc, take top 5
   For each c in casesStore: same procedure, take top 3

STEP 6. Stage 3 — Synthesis (Qwen, askOllamaRaw, temp=0.1)
   Build context blocks: REFERENCE 1..5 with LAW, SECTION, TITLE, SCORE, CONTENT, PROCEDURE, EXAMPLE
   Build similar cases block: CASE 1..3 with fir_number, description, location, date, sections
   finalPrompt = FINAL_ANSWER_PROMPT
     .replace('{{CONTEXT}}', context)
     .replace('{{SIMILAR_CASES}}', similarCasesText)
     .replace('{{QUERY}}', query)
   answer = await askOllamaRaw(finalPrompt)
   // askOllamaRaw does NOT wrap in CrimeGPT persona — preserves structured output

STEP 7. Return synthesized answer
   Multi-paragraph legal opinion with section numbers, procedure, evidence recommendations
```

**External calls:**
- `Ollama POST /api/generate` × 2 (rewrite + synthesis)
- `Ollama POST /api/embeddings` × 1 (query embedding for laws) + × 1 (query embedding for cases) = 2 embeddings
- In-memory cosine similarity × 2 (sections + cases stores)

---

### 5.5 Flow — Case Diary Entry with Image Attachments

**Trigger:** User adds a diary entry in `CaseDetail.jsx` (e.g., "Witness statement recorded", "Suspect arrested").
**Outcome:** New diary row + images saved to disk + audit entry + indexed in vector store.

```
STEP 1. React: user fills diary form with images, clicks Save
   addDiaryEntry({
     case_id, entry_date, entry_time, event_type, title, description,
     location, officer_name,
     images: [{ originalName, base64, size }, ...]
   })

STEP 2. IPC: diary:add
   Main: addDiaryEntry(caseId, entryData) in case-manager.js

STEP 3. Main: log audit FIRST (for data integrity trail)
   logAudit(caseId, 'DIARY_ENTRY', entryData.title, officerName)

STEP 4. Main: insert diary row
   db.run(`INSERT INTO case_diary (
     id, case_id, entry_date, entry_time, event_type, title, description, location, officer_name
   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
     [uuid, caseId, entry_date, entry_time, event_type, title, description, location, officerName])

STEP 5. Main: write image files
   For each img in entryData.images:
     • path = app.getPath('userData')/diary_images/{caseId}/{entryId}/{uuid}.{ext}
     • fs.writeFileSync(path, Buffer.from(img.base64, 'base64'))
     • db.run(`INSERT INTO diary_images (id, diary_entry_id, file_path, file_name, file_size) VALUES (?, ?, ?, ?, ?)`)

STEP 6. Main: persist
   saveToFile()

STEP 7. Main: index entry in vector store (for similar case search)
   Lookup case via SELECT * FROM cases WHERE id = ?
   indexCaseData({
     id: entryId, fir_number: caseRow.fir_number,
     description: entryData.description, incident_location: caseRow.incident_location,
     incident_date: entryData.entry_date, case_type: 'DIARY_ENTRY',
     sections_applied: []
   })
   → getEmbedding() → push to casesStore → write cases.json

STEP 8. Return
   { success: true, entryId: uuid }
```

**Storage touched:**
- `case_diary`, `diary_images`, `audit_log` (SQLite)
- `diary_images/{caseId}/{entryId}/*.{ext}` (filesystem)
- `database/cases.json` (vector store)

---

### 5.6 Flow — Document Generation (Per-Type)

**Trigger:** User opens Case Detail → Documents tab → clicks "Generate" on a document.
**Outcome:** PDF saved to `~/Downloads/`, document row in `documents` table, audit entry.

```
STEP 1. React: getDocsForCase(caseId)
   IPC: doc:get-for-case
   Main: getDocumentsForCase(caseId)
     • SELECT case_type FROM cases WHERE id = ?
     • getRequiredDocuments(caseType) → 5–8 doc keys (e.g., ['FIR', 'CHARGESHEET', 'REMAND', ...])
     • getGeneratedDocuments(caseId) → already-generated docs
     • Merge: for each required, mark generated/path/date
   Returns: [{ key, name, required, generated, path, date }, ...]

STEP 2. Renderer shows list with "Generate" / "Re-generate" / "Open PDF" buttons

STEP 3. User clicks Generate on e.g. "CHARGESHEET"
   React: generateDocument(caseId, 'CHARGESHEET', caseData)
   IPC: doc:generate

STEP 4. Main: generateDocumentForCase(caseId, 'CHARGESHEET', caseData)
   4a. templateData = mapCaseDataToTemplate(caseData)
       — Normalizes all JSON fields (complainant, accused, witnesses, seized_items)
       — Maps to nested blocks: fir{}, court{}, panchnama{}, hospital{}, victim{},
         identification_marks{}, clothes_worn{}, articles_found{}, panch_witnesses[],
         investigating_officer{}, offence_details{}, investigation_details{},
         remand{}, custody{}, escort_officer{}, fir_details{}, seizure{}, seal{},
         muddamal{}, property{}, physical{}, arrest{}, certification{}, court_status{}

   4b. Document-type dispatch:
       switch (docKey):
         case 'FIR':             renderFIR(templateData)              // imports from electron/doc/FIR.js
         case 'CHARGESHEET':     renderChargesheet(templateData)      // chargeSheet.js
         case 'MEDICAL_LETTER':  renderMedicalLetter(templateData)    // medicalLetter.js
         case 'REMAND_LETTER':   renderRemandLetter(singleAccusedData) // remandLetter.js (uses single accused object)
         case 'SEIZURE_RECEIPT': renderSeizurePanchanama(templateData) // seizureLetter.js
         case 'COURT_CUSTODY':   renderCustodyLetter(singleAccusedData) // custodyLetter.js (single accused)
         case 'PANCHNAMA':       renderAccusedPanchanama(singleAccusedData) // accusedPunchnama.js (single accused)
         case 'FACE_ID':         renderFaceIDForm({ ...singleAccusedData, photo_path }) // face_id.js

   4c. Each renderer is a pure JS function returning an HTML string.
       No file I/O, no DB access — deterministic, side-effect-free.

STEP 5. Main: convert HTML to PDF
   filename = `${docName.replace(/\s/g, '_')}_${fir_number || 'Doc'}.pdf`
   generateAndSavePDF(html, filename)
     • Hidden BrowserWindow, data: URL load
     • webContents.printToPDF({ printBackground: true, preferCSSPageSize: true })
     • fs.writeFileSync(app.getPath('downloads')/<filename>, pdfBuffer)
   Returns: { success: true, path }

STEP 6. Main: save document record
   saveDocumentRecord(caseId, docKey, docName, pdfPath)
   db.run('INSERT INTO documents (id, case_id, doc_type, doc_name, doc_path, doc_format) VALUES (?, ?, ?, ?, ?, "pdf")')

STEP 7. Main: log audit
   logAudit(caseId, 'DOCUMENT_GENERATED', docName, caseData.officer_name)

STEP 8. Main: persist
   saveToFile()

STEP 9. Return + fire download-complete event
   Returns: { success: true, path: "/path/to/Charge_Sheet_CR-2026-XXXXX.pdf" }
   Event 'download-complete' pushed to renderer: { filename, path }
```

**Document-type → required-sections matrix (from `document-manager.js`):**
| Case Type | Required Documents |
|---|---|
| Theft | FIR, CHARGESHEET, SEIZURE_RECEIPT, PANCHNAMA, FACE_ID |
| Murder | FIR, CHARGESHEET, MEDICAL_LETTER, REMAND_LETTER, SEIZURE_RECEIPT, COURT_CUSTODY, PANCHNAMA, FACE_ID |
| Assault | FIR, CHARGESHEET, MEDICAL_LETTER, PANCHNAMA, FACE_ID |
| Robbery | FIR, CHARGESHEET, SEIZURE_RECEIPT, PANCHNAMA, FACE_ID, REMAND_LETTER, COURT_CUSTODY |
| Rape | FIR, CHARGESHEET, MEDICAL_LETTER, REMAND_LETTER, COURT_CUSTODY, PANCHNAMA, FACE_ID |
| Fraud | FIR, CHARGESHEET, SEIZURE_RECEIPT, PANCHNAMA |
| Kidnapping | FIR, CHARGESHEET, REMAND_LETTER, COURT_CUSTODY, PANCHNAMA, FACE_ID |
| Domestic Violence | FIR, CHARGESHEET, MEDICAL_LETTER, PANCHNAMA |
| Cyber Crime | FIR, CHARGESHEET, SEIZURE_RECEIPT, PANCHNAMA |
| Dowry | FIR, CHARGESHEET, MEDICAL_LETTER, REMAND_LETTER, COURT_CUSTODY, PANCHNAMA |
| Other | FIR, CHARGESHEET, PANCHNAMA, FACE_ID |

---

### 5.7 Flow — BharatPol Criminal Lookup

**Trigger:** User opens `BharatPol.jsx` page or types in the search box.
**Outcome:** Paginated list of criminals from the national DB.

```
STEP 1. React mounts, useEffect fires
   fetchCriminals() → window.crimeGPT.getBharatPolCriminals({ page: 1, limit: 5 })
   IPC: bharatpol:get-criminals

STEP 2. Main constructs URL
   const query = new URLSearchParams({ page: '1', limit: '5' }).toString()
   const url = `https://mock-api-7969.onrender.com/api/criminals?${query}`

STEP 3. Main: HTTP GET via electron.net (NOT node:http — bypasses CORS)
   httpGet(url)
     • electron.net.request(url)
     • On response: collect data chunks → JSON.parse
   Returns: { success: true, data: [...criminals], total: 142, totalPages: 29 }

STEP 4. React renders list
   Each criminal: { id, name, fatherName, phone, lastKnownLocation,
                    dangerLevel: 'HIGH' | 'MEDIUM' | 'LOW',
                    isWanted: boolean,
                    previousCases: [{ firNumber, description }, ...] }

STEP 5. User types in search → debounced re-fetch with search param
   window.crimeGPT.getBharatPolCriminals({ page: 1, limit: 5, search: 'Raj' })
   → URL becomes: ?page=1&limit=5&search=Raj
```

**External call:** `GET https://mock-api-7969.onrender.com/api/criminals?...`

---

### 5.8 Flow — BharatPol Case Sync & Share

**Trigger:** User clicks "Sync to Local" on a criminal's previous case, or "Post Case" on a local case.
**Outcome:** Case shared to BharatPol network (or pulled into local DB).

```
═══ SYNC (pull from BharatPol) ═══

STEP 1. React: handleSyncCase(criminal, caseData)
   window.crimeGPT.syncBharatPolCase({
     firNumber: caseData.firNumber,
     accusedName: criminal.name,
     accusedPhone: criminal.phone
   })
   IPC: bharatpol:sync-case

STEP 2. Main: httpPost(BHARATPOL_API + '/api/cases/sync', payload)
   Returns: { success: true, ... }

STEP 3. Renderer shows success notification
   Note: For prototype, this does NOT actually write to local SQLite.
         A production version would INSERT a new cases row.


═══ SHARE (push to BharatPol) ═══

STEP 1. React: user clicks "Post Case to BharatPol" → selects a local case → clicks Post
   handlePostCase(caseData) where caseData = full row from local SQLite

STEP 2. React: build payload
   payload = {
     firNumber:    caseData.fir_number,
     caseType:     caseData.case_type,
     description:  caseData.description,
     incidentDate: caseData.incident_date,
     incidentLocation: caseData.incident_location,
     officerName:  caseData.officer_name || user.fullName,
     station:      'CrimeGPT Police Station, Ahmedabad',
     sections:     parsed from caseData.applied_sections (JSON.stringify then map),
     accusedName:  caseData.accused?.[0]?.full_name,
     accusedPhone: caseData.accused?.[0]?.phone
   }
   console.log(payload) ← full payload logged for debugging

STEP 3. window.crimeGPT.shareBharatPolCase(payload)
   IPC: bharatpol:share-case

STEP 4. Main: httpPost(BHARATPOL_API + '/api/cases/share', payload)
   Returns: { success: true } or { success: false, message }

STEP 5. Renderer marks case as posted
   setPostedCases(prev => new Set([...prev, caseData.id]))
   Toast notification: "Case Posted — CR-2026-XXXXX shared to BharatPol network"
```

**External calls:**
- `POST https://mock-api-7969.onrender.com/api/cases/sync`
- `POST https://mock-api-7969.onrender.com/api/cases/share`

---

### 5.9 Flow — LERS Request Dispatch

**Trigger:** User dispatches a Lawful Electronic Request to a platform (Meta, Google, Telegram) for evidence.
**Outcome:** Request logged in `lers_requests` table with status SENT.

```
STEP 1. React: user fills LERS form, clicks Send
   sendLERS({ caseId, platform: 'META', targetIdentifier: '+919876543210' })

STEP 2. IPC: lers:send
   Main: db.run(`INSERT INTO lers_requests (
     id, case_id, platform, target_identifier, status, request_data
   ) VALUES (?, ?, ?, ?, 'SENT', ?)`,
     [uuid, caseId, platform, targetIdentifier, JSON.stringify(data)])
   saveToFile()
   Returns: { success: true, requestId: uuid, status: 'SENT', message: '...' }

STEP 3. Note: This is a mock — no actual HTTP call to the platform.
   The request is persisted for audit; a production version would POST to
   the platform's LERS endpoint and poll for response.
```

**Storage touched:** `lers_requests` table.

---

### 5.10 Flow — Audit Trail Read

**Trigger:** User opens Case Detail → Audit Trail tab.
**Outcome:** Timeline of all actions for that case, newest first.

```
STEP 1. React: AuditTrail component mounts
   useEffect → window.crimeGPT.getAuditLog(caseId)

STEP 2. IPC: audit:get-for-case
   Main: db.prepare(`SELECT * FROM audit_log WHERE case_id = ? ORDER BY created_at DESC`)
   Returns: [{ id, case_id, action, details, officer_name, created_at }, ...]

STEP 3. Renderer renders timeline
   Each entry icon-coded by action type:
     • CASE_CREATED         → green Plus icon
     • DIARY_ENTRY          → blue Clock icon
     • DOCUMENT_GENERATED   → purple FileText icon
     • EVIDENCE_ADDED       → orange Download icon
     • CASE_UPDATED         → indigo Shield icon
   Timestamp formatted as toLocaleString('en-IN')
```

---

### 5.11 Flow — Dashboard Stats

**Trigger:** Dashboard page mount.
**Outcome:** Three counters: activeCases, totalCases, documentsGenerated.

```
STEP 1. React: useEffect → getStats()
   IPC: dashboard:stats

STEP 2. Main: 3 parallel COUNT(*) queries
   activeCases       = COUNT(*) FROM cases WHERE status = 'ACTIVE'
   totalCases        = COUNT(*) FROM cases
   documentsGenerated = COUNT(*) FROM documents

STEP 3. Returns { activeCases, totalCases, documentsGenerated }
   Renderer shows 3 stat cards.
```

---

### 5.12 Flow — Vector DB Indexing (Startup)

**Trigger:** `app.whenReady()` on first launch (or when `database/sections.json` is < 100 KB).
**Outcome:** All BNS/BNSS/BSA/Special Act sections embedded and stored.

```
STEP 1. Main: indexAllLegalData()
   storePath = database/sections.json
   if (exists && size > 100KB): skip — already indexed
   else: continue

STEP 2. For each law file in data/:
   • data/BNS1.txt
   • data/BNSS.txt
   • data/BSA.txt
   • data/special.txt
   await indexLawFile(filePath, lawName)

STEP 3. indexLawFile:
   3a. Read file content: fs.readFileSync(filePath, 'utf-8')
   3b. parseSections(content, lawName):
       - Regex match section headers
       - Extract: sectionNumber, title, coreContent, procedure, illustration
       - Returns array of section objects
   3c. For each section:
       text = `${law} section ${num} ${title} ${coreContent.substring(0, 2000)}`
       embedding = await getEmbedding(text)  // Ollama nomic-embed-text
       if embedding.length === 768:
         section.embedding = embedding
         sectionsStore.push(section)
   3d. fs.writeFileSync(database/sections.json, JSON.stringify(sectionsStore))

STEP 4. Log: "[VectorDB] BNS done. Indexed: 354, Skipped: 0, Total: 354"
   (then BNSS, BSA, SPECIAL — totals 1000+ sections)

STEP 5. rebuildCache() — reload from disk to in-memory store
   dataIndexed = true  // unlocks rag:search-* handlers
```

**External calls:** `Ollama POST /api/embeddings` × 1000+ (one per section). Takes 2–5 minutes total.

---

## 6. Payload Schemas

### 6.A CaseData (renderer → main on `case:register`)

```ts
{
  // Required
  case_type: 'Theft' | 'Murder' | 'Assault' | 'Robbery' | 'Fraud' | 'Kidnapping'
            | 'Domestic Violence' | 'Cyber Crime' | 'Rape' | 'Dowry' | 'Other',
  incident_date: string,         // ISO 'YYYY-MM-DD'
  incident_location: string,     // free text
  description: string,           // free text, ≥ 20 chars

  // Optional case metadata
  incident_time?: string,        // 'HH:MM'
  description_lang?: 'en' | 'hi' | 'gu',
  officer_name?: string,
  officer_badge?: string,
  officer_rank?: string,
  fir_number?: string,           // auto-generated if missing

  // Parties
  complainant?: {
    full_name: string,
    phone?: string,
    address?: string,
    id_proof_type?: 'Aadhaar' | 'Voter ID' | 'Passport' | 'Driving License',
    id_proof_number?: string,
    age?: string,
    gender?: string
  },
  accused?: Array<{
    full_name: string,
    alias?: string,
    father_name?: string,
    age?: string,
    physical_description?: string,
    address?: string,
    phone?: string
  }>,
  witnesses?: Array<{
    full_name: string,
    phone?: string,
    statement?: string,
    address?: string
  }>,
  seized_items?: Array<{
    item: string,                // item name
    qty?: string,                // quantity
    seized_from?: string
  }>,

  // AI sections
  sections?: Array<{
    law: 'BNS' | 'BNSS' | 'BSA',
    section: string,             // section number
    title: string,
    confidence?: number,         // 0-100
    reasoning?: string
  }>,

  // Evidence (base64 from FileReader)
  evidence_images?: Array<{
    originalName: string,
    base64: string,
    size: number,
    description?: string
  }>
}
```

### 6.B FullCase (main → renderer on `case:get-full`)

```ts
{
  id: string,
  fir_number: string,
  case_type: string,
  incident_date: string,
  incident_time: string | null,
  incident_location: string,
  incident_district: string,
  incident_state: string,
  description: string,
  description_lang: string,
  status: 'ACTIVE' | 'CLOSED' | 'TRANSFERRED',
  officer_name: string | null,
  officer_badge: string | null,
  officer_rank: string,

  // JSON columns — pre-parsed by main before returning
  complainant: { full_name, phone, address, id_proof_type, id_proof_number, age, gender },
  accused: Array<{ full_name, alias, father_name, age, physical_description, address, phone, ... }>,
  witnesses: Array<{ full_name, phone, statement, address }>,
  seized_items: Array<{ item, qty, seized_from }>,
  applied_sections: Array<{ law, section, title, confidence, reasoning }>,

  // Joined from other tables
  evidence: Array<{ id, file_type, file_path, file_name, file_size, description, created_at }>,
  documents: Array<{ id, doc_type, doc_name, doc_path, doc_format, created_at }>,
  diary: Array<{
    id, entry_date, entry_time, event_type, title, description, location, officer_name,
    images: Array<{ id, file_path, file_name, file_size }>
  }>,

  created_at: string,  // ISO datetime
  updated_at: string
}
```

### 6.C BharatPolSharePayload (renderer → main on `bharatpol:share-case`)

```ts
{
  firNumber: string,
  caseType: string,
  description: string,
  incidentDate: string,
  incidentLocation: string,
  officerName: string,
  station: 'CrimeGPT Police Station, Ahmedabad',
  sections: string,                  // comma-joined "BNS 303, BNS 331"
  accusedName: string,
  accusedPhone: string
}
```

### 6.D AIChatMessage (renderer → main on `ai:chat`)

```ts
{
  message: string  // free-text question
}
```

### 6.E DiaryEntryInput (renderer → main on `diary:add`)

```ts
{
  case_id: string,
  entry_date: string,        // 'YYYY-MM-DD'
  entry_time?: string,       // 'HH:MM:SS'
  event_type: string,        // 'ARREST' | 'SEIZURE' | 'WITNESS_HEARING' | 'INTERROGATION' | ...
  title: string,
  description?: string,
  location?: string,
  officer_name?: string,
  images?: Array<{
    originalName: string,
    base64: string,
    size: number
  }>
}
```

---

## 7. Storage Locations

| What | Where | Format | Owner |
|---|---|---|---|
| User credentials | `app.getPath('userData')/data/crimegpt.db` | SQLite (sql.js export) | Main |
| Cases, evidence, diary, documents, audit, LERS | same .db file | SQLite | Main |
| Evidence images | `app.getPath('userData')/evidence/{caseId}/*.{ext}` | Files (jpg/png) | Main |
| Diary images | `app.getPath('userData')/diary_images/{caseId}/{entryId}/*.{ext}` | Files (jpg/png) | Main |
| Generated PDFs | `app.getPath('downloads')/*_{fir_number}.pdf` | PDF | Main |
| Legal section embeddings | `database/sections.json` | JSON array of `{law, section, title, ..., embedding: number[768]}` | Main |
| Case embeddings | `database/cases.json` | JSON array of `{id, fir_number, ..., embedding: number[768]}` | Main |
| Ollama model weights | `~/.ollama/models/` (or `OLLAMA_MODELS` env) | GGUF (Q4_K_M) | Ollama process |
| Source legal texts | `data/{BNS1,BNSS,BSA,special}.txt` | Plain text | Build-time |

---

## 8. Diagram Generation Prompt

> **Copy-paste the block below into any diagram-generation tool** (Mermaid Live Editor, Excalidraw, Lucidchart, draw.io, or an LLM-based diagram agent). The prompt is structured to produce a 4-layer data flow diagram.

```
Generate a professional, technical data flow diagram for the CrimeGPT application.

ARCHITECTURE: 3-tier Electron desktop app with strict process isolation.
              Two OS processes (Renderer + Main) and four backend services
              (SQLite via sql.js, Ollama AI, JSON vector store, BharatPol API).

LAYERS (top to bottom):

  LAYER 1 — RENDERER PROCESS (React 19, sandboxed)
    Boxes: Login, Setup, Dashboard, NewCase, CaseDetail, AIChat, BharatPol, AuditTrail, Search
    These are React components, each making IPC calls via window.crimeGPT.*

  LAYER 2 — IPC BRIDGE (preload.cjs contextBridge)
    Single box labeled "IPC: ipcRenderer.invoke ↔ ipcMain.handle"
    List 30+ channel names grouped by: auth, ai, rag, case, diary, document, dashboard, bharatpol, lers, audit

  LAYER 3 — MAIN PROCESS (Node.js, full privileges)
    Service boxes: auth.js, case-manager.js, document-manager.js, ai-setup.js, vector-db.js
    Database box: sql.js (SQLite via WASM)

  LAYER 4 — BACKEND SERVICES
    4 boxes side by side:
      4a. SQLite (crimegpt.db file)        — local, sync, file-based
      4b. Ollama (:11434 localhost)        — local HTTP, contains Qwen LLM + nomic-embed
      4c. Vector DB (database/*.json)      — local, in-memory + JSON file
      4d. BharatPol API (mock-api-7969)    — remote HTTPS, the only external call

CONNECTIONS (key flows to depict with arrows + labels):

  Flow 1 — Authentication
    Login (R) → auth:check-setup, auth:login (IPC) → auth.js (M) → sql.js → SQLite (4a)
    Returns: user object back up the stack

  Flow 2 — FIR Registration
    NewCase (R) → case:register (IPC) → case-manager.js (M)
      → sql.js → SQLite (4a) [INSERT cases, evidence_files, case_diary, audit_log]
      → vector-db.js → Ollama (4b) [getEmbedding] → vector DB (4c) [push]
      → saveToFile → crimegpt.db
    Returns: fir_number → renderer imports FIR.js → renders HTML
      → doc:save-as-pdf (IPC) → document-manager.js → hidden BrowserWindow → printToPDF
      → fs.writeFileSync → ~/Downloads/
    Returns: pdf path back to renderer

  Flow 3 — AI Section Suggestion
    NewCase (R) → ai:suggest-sections (IPC) → vector-db.js (M)
      → askOllama (Qwen rewrite query) [Ollama 4b]
      → getEmbedding [Ollama 4b]
      → cosine sim over vector DB (4c) → top-5 sections
      → askOllama (Qwen format answer) [Ollama 4b]
    Returns: formatted section list back to renderer

  Flow 4 — RAG Legal Chat
    AIChat (R) → rag:legal-suggestion (IPC) → vector-db.js (M)
      → askOllama [4b] (rewrite query)
      → getEmbedding [4b] → cosine sim over 4c → top-5 laws + top-3 similar cases
      → askOllamaRaw [4b] (synthesize with temp=0.1, no persona)
    Returns: full legal opinion back to renderer

  Flow 5 — Document Generation
    CaseDetail (R) → doc:generate (IPC) → document-manager.js (M)
      → loads caseData from sql.js → case-manager.js → SQLite (4a)
      → imports doc/{FIR,chargeSheet,remandLetter,...}.js → renders HTML
      → hidden BrowserWindow → printToPDF → ~/Downloads/
      → sql.js → documents table in SQLite (4a)
    Returns: pdf path + download-complete event

  Flow 6 — BharatPol Lookup
    BharatPol (R) → bharatpol:get-criminals (IPC) → main.js (M)
      → electron.net.request GET → BharatPol API (4d)
    Returns: criminal list back to renderer

  Flow 7 — BharatPol Share
    BharatPol (R) → bharatpol:share-case (IPC) → main.js (M)
      → constructs payload from local case data
      → electron.net.request POST → BharatPol API (4d)
    Returns: success status back to renderer

  Flow 8 — Audit Trail
    CaseDetail (R) → audit:get-for-case (IPC) → main.js (M)
      → sql.js → SQLite (4a) [SELECT * FROM audit_log WHERE case_id=?]
    Returns: audit entries back to renderer

  Flow 9 — Startup Indexing (one-time)
    app.whenReady() → vector-db.js → for each law file in data/:
      → fs.readFileSync → parseSections
      → getEmbedding per section [Ollama 4b]
      → write database/sections.json [vector DB 4c]
    Takes 2–5 minutes, runs once

STYLING:
  - Renderer layer: blue/cyan
  - IPC layer: orange (single horizontal bus)
  - Main process services: green
  - Backend services: gray, with red border for BharatPol (external)
  - Use solid arrows for data flow, dashed for return values
  - Label every arrow with the payload type or method name
  - Show timing: "async", "streamed", "blocking" as appropriate
  - Indicate trust boundary: Renderer is untrusted (lock icon), Main is trusted

OUTPUT FORMAT: Mermaid (flowchart) with subgraphs for each layer, OR
               a clean PNG/SVG with labeled boxes and arrows.
```

---

## 9. ASCII Quick-Reference Diagram

A minimal ASCII version suitable for embedding in slides or markdown:

```
┌────────────────────────────────────────────────────────────────────┐
│                    RENDERER (React, sandboxed)                     │
│  Login  Setup  Dashboard  NewCase  CaseDetail  AIChat  BharatPol  │
└───────────────────────────┬────────────────────────────────────────┘
                            │  window.crimeGPT.*  (preload bridge)
                            ▼
┌────────────────────────────────────────────────────────────────────┐
│              IPC BUS  (ipcRenderer.invoke ↔ ipcMain.handle)        │
│  auth  ai  rag  case  diary  doc  dashboard  bharatpol  lers  audit│
└───────────────────────────┬────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────────┐
        ▼                   ▼                   ▼              ▼
   ┌─────────┐         ┌─────────┐         ┌─────────┐    ┌─────────┐
   │ auth.js │         │ case-   │         │  doc-   │    │   ai-   │
   │ (login) │         │ manager │         │ manager │    │  setup  │
   │         │         │ (FIR)   │         │ (8 PDF) │    │ (Ollama)│
   └────┬────┘         └────┬────┘         └────┬────┘    └────┬────┘
        │                   │                   │              │
        └───────────────────┴───────────────────┴──────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │ sql.js (SQLite WASM)  │
                │ 8 tables, in-process  │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────────┐
        ▼                   ▼                   ▼              ▼
   ┌─────────┐         ┌──────────┐        ┌─────────┐    ┌──────────┐
   │ SQLite  │         │  Ollama  │        │ Vector  │    │ BharatPol│
   │  .db    │         │  :11434  │        │   DB    │    │   API    │
   │ (file)  │         │ (local)  │        │ (JSON)  │    │ (remote) │
   └─────────┘         └──────────┘        └─────────┘    └──────────┘
```

---

**End of `data_flow.md`** — Use §8 as the prompt for diagram generation, or §9 for a quick reference.
