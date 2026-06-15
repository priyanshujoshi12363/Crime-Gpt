import { execSync, exec } from 'child_process';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ─────────────────────────────────────────────
//  OLLAMA STATUS CHECKS
// ─────────────────────────────────────────────
export function isOllamaInstalled() {
  try {
    const result = execSync('ollama --version', { encoding: 'utf-8', stdio: 'pipe' });
    return { installed: true, version: result.trim() };
  } catch {
    return { installed: false, version: null };
  }
}

export async function isOllamaRunning() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:11434/api/tags', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(3000, () => { req.destroy(); resolve(false); });
  });
}

export function getInstalledModels() {
  try {
    const result = execSync('ollama list', { encoding: 'utf-8', stdio: 'pipe' });
    const lines = result.trim().split('\n').slice(1); // skip header
    return lines
      .map(line => {
        const parts = line.trim().split(/\s+/);
        if (parts.length < 3) return null;
        return { name: parts[0], id: parts[1], size: `${parts[2]} ${parts[3] || ''}`.trim() };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function hasQwenModel() {
  return getInstalledModels().some(m => m.name.toLowerCase().includes('qwen'));
}

export function hasEmbedModel() {
  return getInstalledModels().some(m => m.name.toLowerCase().includes('nomic-embed'));
}

// ─────────────────────────────────────────────
//  OLLAMA PROCESS MANAGEMENT
// ─────────────────────────────────────────────
export function startOllamaProcess() {
  return new Promise((resolve) => {
    exec('ollama serve', { stdio: 'ignore' });

    let attempts = 0;
    const MAX_ATTEMPTS = 30;

    const interval = setInterval(async () => {
      attempts++;
      const running = await isOllamaRunning();

      if (running) {
        clearInterval(interval);
        console.log('[Ollama] Server started successfully');
        resolve(true);
      } else if (attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        console.error('[Ollama] Failed to start after 30 seconds');
        resolve(false);
      }
    }, 1000);
  });
}

// ─────────────────────────────────────────────
//  DEVICE & MODEL SELECTION
// ─────────────────────────────────────────────
export function getDeviceSpecs() {
  const totalRAM = Math.round(os.totalmem() / (1024 ** 3));
  const cpuCores = os.cpus().length;
  const platform = process.platform;
  return { totalRAM, cpuCores, platform };
}

/**
 * Pick the best Qwen model based on available RAM.
 * More RAM → bigger model → better legal reasoning accuracy.
 */
export function getQwenModel() {
  const { totalRAM } = getDeviceSpecs();

  if (totalRAM >= 16) {
    return { name: 'qwen2.5:7b',   display: 'Qwen 2.5 7B',   size: '~4.7GB', reason: '16GB+ RAM — Best accuracy' };
  } else if (totalRAM >= 8) {
    return { name: 'qwen2.5:3b',   display: 'Qwen 2.5 3B',   size: '~1.9GB', reason: '8GB RAM — Balanced' };
  } else {
    return { name: 'qwen2.5:1.5b', display: 'Qwen 2.5 1.5B', size: '~1GB',   reason: 'Limited RAM — Lightweight' };
  }
}

export function getEmbedModelSize() {
  return { name: 'nomic-embed-text:latest', display: 'Nomic Embed Text', size: '~274MB' };
}

// ─────────────────────────────────────────────
//  CORE HTTP HELPER
// ─────────────────────────────────────────────
/**
 * Low-level POST to Ollama API.
 * All AI calls go through here — single place to handle timeouts/errors.
 */
function ollamaPost(endpoint, body, timeoutMs = 120_000) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);

    const options = {
      hostname: 'localhost',
      port: 11434,
      path: endpoint,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch {
          reject(new Error(`Failed to parse Ollama response: ${raw.substring(0, 200)}`));
        }
      });
    });

    req.on('error', err => reject(new Error(`Ollama request failed: ${err.message}`)));
    req.setTimeout(timeoutMs, () => {
      req.destroy();
      reject(new Error(`Ollama request timed out after ${timeoutMs / 1000}s`));
    });

    req.write(data);
    req.end();
  });
}

// ─────────────────────────────────────────────
//  LLM — CHAT WITH SYSTEM PERSONA
// ─────────────────────────────────────────────
/**
 * askOllama — for general chat with the CrimeGPT persona.
 * Wraps the prompt in a system context so the model knows its role.
 * Use this for: general questions, FIR suggestions, non-RAG chat.
 */
export async function askOllama(prompt) {
  const model = getQwenModel();

  const systemPrompt = `You are CrimeGPT, an AI-powered legal assistant built for Indian law enforcement. You help police officers with criminal law, FIR documentation, legal sections under BNS, BNSS, BSA 2023, and investigation procedures.

Rules:
- Introduce yourself as CrimeGPT when asked who you are
- Never say you are "just an AI" — you are CrimeGPT
- Respond in the same language the officer uses (English, Hindi, or Gujarati)
- Be professional and helpful like a senior legal advisor
- If you don't know something, say "CrimeGPT recommends consulting the legal database or a senior officer"
- Never mention OpenAI, ChatGPT, or any other AI company
- You work completely offline at Indian police stations

OFFICER'S QUERY:
${prompt}`;

  try {
    const result = await ollamaPost('/api/generate', {
      model: model.name,
      prompt: systemPrompt,
      stream: false,
      options: { temperature: 0.4, num_predict: 2048 },
    });

    if (!result.response) throw new Error('Empty response from model');
    return result.response;
  } catch (err) {
    console.error('[askOllama] Error:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
//  LLM — RAW CALL (for RAG pipeline)
// ─────────────────────────────────────────────
/**
 * askOllamaRaw — for the RAG pipeline ONLY.
 *
 * Why a separate function?
 * The RAG pipeline builds a fully structured prompt with LEGAL REFERENCES,
 * OFFICER'S QUESTION, and strict output format. If we wrap it inside
 * askOllama's system prompt, the model sees two conflicting personas
 * and tends to ignore the retrieved legal context.
 *
 * Lower temperature (0.1) = more deterministic, factually grounded output.
 * This is critical for legal accuracy — we don't want creative hallucinations.
 */
export async function askOllamaRaw(prompt) {
  const model = getQwenModel();

  try {
    const result = await ollamaPost('/api/generate', {
      model: model.name,
      prompt,
      stream: false,
      options: {
        temperature: 0.1,   // very low — legal answers must be precise
        num_predict: 3072,  // longer budget for detailed legal opinions
        top_p: 0.9,
        repeat_penalty: 1.1,
      },
    });

    if (!result.response) throw new Error('Empty response from model');
    return result.response;
  } catch (err) {
    console.error('[askOllamaRaw] Error:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
//  EMBEDDINGS
// ─────────────────────────────────────────────
/**
 * getEmbedding — converts text to a vector using nomic-embed-text.
 * Used by Vectra for both indexing and querying.
 *
 * nomic-embed-text supports up to 8192 tokens.
 * We truncate at ~6000 chars to stay safe.
 */
export async function getEmbedding(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('getEmbedding: text must be a non-empty string');
  }

  // Truncate to ~6000 chars to stay within token limits
  const truncated = text.length > 6000 ? text.substring(0, 6000) : text;

  try {
    const result = await ollamaPost('/api/embeddings', {
      model: 'nomic-embed-text:latest',
      prompt: truncated,
      stream: false,
    }, 30_000); // 30s timeout for embeddings (faster than generation)

    if (!result.embedding || !Array.isArray(result.embedding)) {
      throw new Error('Invalid embedding response — missing embedding array');
    }

    if (result.embedding.length === 0) {
      throw new Error('Empty embedding vector returned');
    }

    return result.embedding;
  } catch (err) {
    console.error('[getEmbedding] Error:', err.message);
    throw err;
  }
}

// ─────────────────────────────────────────────
//  FIR LEGAL SUGGESTION  (structured JSON output)
// ─────────────────────────────────────────────
/**
 * getLegalSuggestion — quick structured analysis of a FIR description.
 * Returns JSON with suggested BNS/BNSS sections and reasoning.
 * This is the non-RAG fast path — good for initial FIR filing suggestions.
 */
export async function getLegalSuggestion(firDescription) {
  const prompt = `You are an expert Indian criminal law AI trained on BNS, BNSS, and BSA 2023.

Analyze this FIR and suggest the most relevant legal sections.

FIR DESCRIPTION:
${firDescription}

Return ONLY a valid JSON object with no extra text, no markdown, no code fences:
{
  "bns_sections": [
    { "section": "BNS section number", "title": "section title", "reasoning": "why this applies", "confidence": 85 }
  ],
  "bnss_sections": [
    { "section": "BNSS section number", "title": "section title", "reasoning": "procedural reason" }
  ],
  "summary": "brief one-paragraph analysis of the case"
}

Rules:
- Only suggest sections you are confident about
- Use BNS/BNSS/BSA — never IPC or CrPC
- confidence is a number 0–100`;

  try {
    const response = await askOllama(prompt);
    // Strip any accidental markdown fences before parsing
    const cleaned = response
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Extract JSON even if there's surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON object found in response');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('[getLegalSuggestion] Error:', err.message);
    return { error: 'Failed to get legal suggestion', details: err.message };
  }
}

// ─────────────────────────────────────────────
//  DISK SPACE CHECK
// ─────────────────────────────────────────────
export function checkDiskSpace() {
  const home = os.homedir();
  const modelsPath = process.env.OLLAMA_MODELS || path.join(home, '.ollama', 'models');
  const drive = path.parse(modelsPath).root;

  try {
    if (!fs.existsSync(modelsPath)) fs.mkdirSync(modelsPath, { recursive: true });
    const stats = fs.statfsSync(drive);
    const freeGB = Math.round((stats.bsize * stats.bfree) / (1024 ** 3));
    return { drive, freeGB, hasSpace: freeGB >= 5, modelsPath };
  } catch {
    return { drive, freeGB: 0, hasSpace: false, modelsPath };
  }
}

// ─────────────────────────────────────────────
//  MODEL DOWNLOAD
// ─────────────────────────────────────────────
export async function downloadOllamaInstaller(mainWindow) {
  const platform = process.platform;
  let url = '';

  if (platform === 'win32')       url = 'https://ollama.com/download/OllamaSetup.exe';
  else if (platform === 'linux')  url = 'https://ollama.com/install.sh';
  else                            url = 'https://ollama.com/download/Ollama-darwin.zip';

  const tempDir = os.tmpdir();
  const installerPath = path.join(
    tempDir,
    platform === 'win32' ? 'OllamaSetup.exe' : 'ollama-install.sh'
  );

  mainWindow?.webContents.send('ai:download-progress', { step: 'ollama', percent: 0 });

  await new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const handleResponse = (response) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location;
        const redirectProtocol = redirectUrl.startsWith('https') ? https : http;
        redirectProtocol.get(redirectUrl, handleResponse).on('error', reject);
        return;
      }
      downloadStream(response, installerPath, mainWindow, 'ollama').then(resolve).catch(reject);
    };

    protocol.get(url, handleResponse).on('error', reject);
  });

  mainWindow?.webContents.send('ai:download-progress', { step: 'installing', percent: 100 });

  if (platform === 'win32') {
    execSync(`"${installerPath}" /S`, { stdio: 'ignore' });
  } else if (platform === 'linux') {
    execSync(`sh "${installerPath}"`, { stdio: 'ignore' });
  }

  try { fs.unlinkSync(installerPath); } catch {}

  const started = await startOllamaProcess();
  return { success: started };
}

export async function downloadQwenModel(mainWindow) {
  return await pullModel(mainWindow, getQwenModel());
}

export async function downloadEmbedModel(mainWindow) {
  return await pullModel(mainWindow, getEmbedModelSize());
}

async function pullModel(mainWindow, model) {
  mainWindow?.webContents.send('ai:download-progress', {
    step: 'model', percent: 0, modelName: model.display
  });

  return new Promise((resolve) => {
    const postData = JSON.stringify({ name: model.name, stream: true });

    const req = http.request({
      hostname: 'localhost', port: 11434, path: '/api/pull', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // keep incomplete line

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.completed && parsed.total) {
              const percent = Math.round((parsed.completed / parsed.total) * 100);
              mainWindow?.webContents.send('ai:download-progress', {
                step: 'model', percent, modelName: model.display
              });
            }
            if (parsed.status === 'success') {
              resolve({ success: true, modelName: model.display });
            }
          } catch {
            // skip malformed JSON lines in stream
          }
        }
      });

      res.on('end', () => resolve({ success: true, modelName: model.display }));
      res.on('error', err => resolve({ success: false, error: err.message }));
    });

    req.on('error', err => resolve({ success: false, error: err.message }));
    req.setTimeout(0); // no timeout for model downloads
    req.write(postData);
    req.end();
  });
}

// ─────────────────────────────────────────────
//  DOWNLOAD STREAM HELPER
// ─────────────────────────────────────────────
function downloadStream(response, dest, mainWindow, step) {
  return new Promise((resolve, reject) => {
    const total = parseInt(response.headers['content-length'] || '0', 10);
    let downloaded = 0;
    const chunks = [];

    response.on('data', (chunk) => {
      chunks.push(chunk);
      downloaded += chunk.length;
      if (total > 0) {
        const percent = Math.round((downloaded / total) * 100);
        mainWindow?.webContents.send('ai:download-progress', { step, percent });
      }
    });

    response.on('end', () => {
      fs.writeFileSync(dest, Buffer.concat(chunks));
      resolve();
    });

    response.on('error', reject);
  });
}