import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEmbedding } from './ai-setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let VectraLocalIndex;
let lawIndex = null;
let caseIndex = null;

async function getVectra() {
  if (!VectraLocalIndex) {
    const vectra = await import('vectra');
    VectraLocalIndex = vectra.LocalIndex;
  }
  return VectraLocalIndex;
}

function getBasePath() {
  const dbPath = path.join(__dirname, '..', '..', 'database', 'vectra');
  if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
  return dbPath;
}

export async function initVectorStore() {
  const basePath = getBasePath();
  if (!fs.existsSync(basePath)) fs.mkdirSync(basePath, { recursive: true });

  const Index = await getVectra();
  lawIndex = new Index(path.join(basePath, 'laws'));
  caseIndex = new Index(path.join(basePath, 'cases'));

  if (!await lawIndex.isIndexCreated()) await lawIndex.createIndex();
  if (!await caseIndex.isIndexCreated()) await caseIndex.createIndex();

  console.log('Vector store ready at:', basePath);
}

function chunkText(text, maxChunkSize = 500) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export async function indexLawFile(filePath, lawName) {
  if (!lawIndex) throw new Error('Vector store not initialized');
  const content = fs.readFileSync(filePath, 'utf-8');
  const chunks = chunkText(content);

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await getEmbedding(chunks[i]);
    await lawIndex.insertItem({
      vector: embedding,
      metadata: { law: lawName, type: 'chunk', index: i, text: chunks[i].substring(0, 500) }
    });
  }
  console.log(`Indexed ${lawName}: ${chunks.length} chunks`);
}

export async function indexCaseJSON(caseData) {
  if (!caseIndex) throw new Error('Vector store not initialized');
  const text = `FIR ${caseData.fir_number}: ${caseData.description}. Location: ${caseData.incident_location}. Sections: ${(caseData.sections_applied || []).join(', ')}`;
  const embedding = await getEmbedding(text);
  await caseIndex.insertItem({
    vector: embedding,
    metadata: { type: 'case', fir_number: caseData.fir_number, description: caseData.description, location: caseData.incident_location, date: caseData.incident_date, sections: caseData.sections_applied || [] }
  });
}

export async function searchLaws(query, limit = 5) {
  if (!lawIndex) {
    console.log('ERROR: lawIndex is null');
    return [];
  }
  
  console.log('Searching for:', query);
  
  try {
    const embedding = await getEmbedding(query);
    console.log('Embedding received, length:', embedding?.length);
    
    if (!embedding || embedding.length === 0) {
      console.log('ERROR: Empty embedding');
      return [];
    }
    
    const results = await lawIndex.queryItems(embedding, limit);
    console.log('Raw results:', results?.length || 0);
    
    if (!results || results.length === 0) {
      console.log('No results from Vectra');
      return [];
    }
    
    return results.map(r => ({ 
      score: Math.round(r.score * 100), 
      ...r.item.metadata 
    }));
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}

export async function searchCases(query, limit = 3) {
  if (!caseIndex) return [];
  const embedding = await getEmbedding(query);
  const results = await caseIndex.queryItems(embedding, limit);
  return results.map(r => ({ score: Math.round(r.score * 100), ...r.item.metadata }));
}

export function buildLegalContext(laws, cases) {
  let context = '';

  if (laws.length > 0) {
    context += 'LEGAL SECTIONS FROM DATABASE:\n';
    laws.forEach((l, i) => {
      context += `${i + 1}. [${l.law}] ${l.text}\n\n`;
    });
  }

  if (cases.length > 0) {
    context += 'SIMILAR PAST CASES:\n';
    cases.forEach((c, i) => {
      context += `${i + 1}. ${c.fir_number || 'Case'}: ${c.text || c.description}\n\n`;
    });
  }

  return context;
}