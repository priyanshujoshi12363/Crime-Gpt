import { execSync, exec } from 'child_process';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
    const lines = result.trim().split('\n').slice(1);
    const models = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        models.push({ name: parts[0], id: parts[1], size: parts[2] + ' ' + (parts[3] || '') });
      }
    }
    return models;
  } catch {
    return [];
  }
}

export function hasQwenModel() {
  const models = getInstalledModels();
  return models.some(m => m.name.toLowerCase().includes('qwen'));
}

export function hasEmbedModel() {
  const models = getInstalledModels();
  return models.some(m => m.name.toLowerCase().includes('nomic-embed'));
}

export function startOllamaProcess() {
  return new Promise((resolve) => {
    exec('ollama serve', { stdio: 'ignore' });
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const running = await isOllamaRunning();
      if (running) {
        clearInterval(interval);
        resolve(true);
      } else if (attempts > 30) {
        clearInterval(interval);
        resolve(false);
      }
    }, 1000);
  });
}

export function getDeviceSpecs() {
  const totalRAM = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const cpuCores = os.cpus().length;
  return { totalRAM, cpuCores };
}

export function getQwenModel() {
  const { totalRAM } = getDeviceSpecs();

  if (totalRAM >= 16) {
    return { name: 'qwen2.5:7b', display: 'Qwen 2.5 7B', size: '~4.7GB', reason: '16GB+ RAM — Best accuracy' };
  } else if (totalRAM >= 8) {
    return { name: 'qwen2.5:3b', display: 'Qwen 2.5 3B', size: '~1.9GB', reason: '8GB RAM — Balanced' };
  } else {
    return { name: 'qwen2.5:1.5b', display: 'Qwen 2.5 1.5B', size: '~1GB', reason: 'Limited RAM — Lightweight' };
  }
}

export function getEmbedModelSize() {
  return { name: 'nomic-embed-text:latest', display: 'Nomic Embed Text', size: '~274MB' };
}

export async function askOllama(prompt) {
  const model = getQwenModel();

  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: model.name,
      prompt: prompt,
      stream: false,
      options: { temperature: 0.1, num_predict: 2048 }
    });

    const options = {
      hostname: 'localhost', port: 11434, path: '/api/generate',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body).response); }
        catch { reject(new Error('Failed to parse response')); }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export async function getEmbedding(text) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      model: 'nomic-embed-text:latest',
      prompt: text,
      stream: false
    });

    const options = {
      hostname: 'localhost', port: 11434, path: '/api/embeddings',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body).embedding); }
        catch { reject(new Error('Failed to get embedding')); }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export async function getLegalSuggestion(firDescription) {
  const prompt = `You are an expert Indian criminal law AI. Analyze this FIR and suggest BNS, BNSS, BSA sections.

FIR: ${firDescription}

Return ONLY JSON:
{
  "bns_sections": [{"section": "", "title": "", "reasoning": "", "confidence": 0}],
  "bnss_sections": [{"section": "", "title": "", "reasoning": "", "confidence": 0}],
  "summary": ""
}`;

  try {
    const response = await askOllama(prompt);
    const cleaned = response.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { error: 'Failed to get legal suggestion' };
  }
}

export async function downloadOllamaInstaller(mainWindow) {
  const platform = process.platform;
  let url = '';
  
  if (platform === 'win32') url = 'https://ollama.com/download/OllamaSetup.exe';
  else if (platform === 'linux') url = 'https://ollama.com/install.sh';
  else url = 'https://ollama.com/download/Ollama-darwin.zip';

  const tempDir = os.tmpdir();
  const installerPath = path.join(tempDir, platform === 'win32' ? 'OllamaSetup.exe' : 'ollama-install.sh');

  mainWindow?.webContents.send('ai:download-progress', { step: 'ollama', percent: 0 });

  await new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectProtocol = response.headers.location.startsWith('https') ? https : http;
        redirectProtocol.get(response.headers.location, (redirectResponse) => {
          downloadStream(redirectResponse, installerPath, mainWindow, 'ollama').then(resolve).catch(reject);
        });
        return;
      }
      downloadStream(response, installerPath, mainWindow, 'ollama').then(resolve).catch(reject);
    }).on('error', reject);
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

function downloadStream(response, dest, mainWindow, step) {
  return new Promise((resolve, reject) => {
    const total = parseInt(response.headers['content-length'] || '0');
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

export async function downloadQwenModel(mainWindow) {
  const model = getQwenModel();
  return await pullModel(mainWindow, model);
}

export async function downloadEmbedModel(mainWindow) {
  const model = getEmbedModelSize();
  return await pullModel(mainWindow, model);
}

async function pullModel(mainWindow, model) {
  mainWindow?.webContents.send('ai:download-progress', { 
    step: 'model', percent: 0, modelName: model.display 
  });

  return new Promise((resolve) => {
    const postData = JSON.stringify({ name: model.name, stream: true });

    const req = http.request({
      hostname: 'localhost', port: 11434, path: '/api/pull', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let buffer = '';
      
      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
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
          } catch {}
        }
      });

      res.on('end', () => resolve({ success: true, modelName: model.display }));
      res.on('error', (err) => resolve({ success: false, error: err.message }));
    });

    req.on('error', (err) => resolve({ success: false, error: err.message }));
    req.setTimeout(0);
    req.write(postData);
    req.end();
  });
}

export function checkDiskSpace() {
  const home = os.homedir();
  const modelsPath = process.env.OLLAMA_MODELS || path.join(home, '.ollama', 'models');
  const drive = path.parse(modelsPath).root;
  
  try {
    if (!fs.existsSync(modelsPath)) fs.mkdirSync(modelsPath, { recursive: true });
    const stats = fs.statfsSync(drive);
    const freeGB = Math.round((stats.bsize * stats.bfree) / (1024 * 1024 * 1024));
    return { drive, freeGB, hasSpace: freeGB >= 5, modelsPath };
  } catch {
    return { drive, freeGB: 0, hasSpace: false, modelsPath };
  }
}