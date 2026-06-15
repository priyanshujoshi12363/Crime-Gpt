import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getEmbedding, askOllama } from './ai-setup.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sectionsStore = [];
let casesStore = [];

function getStorePath() {
  const dbDir = path.join(__dirname, '..', '..', 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'sections.json');
}

function getCasesPath() {
  const dbDir = path.join(__dirname, '..', '..', 'database');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, 'cases.json');
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export async function initVectorStore() {
  const storePath = getStorePath();
  if (fs.existsSync(storePath)) {
    try {
      sectionsStore = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      console.log(`[VectorDB] Loaded ${sectionsStore.length} sections`);
    } catch (err) {
      console.error('[VectorDB] Failed to load store:', err.message);
      sectionsStore = [];
    }
  }

  const casesPath = getCasesPath();
  if (fs.existsSync(casesPath)) {
    try {
      casesStore = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
      console.log(`[VectorDB] Loaded ${casesStore.length} cases`);
    } catch (err) {
      casesStore = [];
    }
  }
}

export async function rebuildCache() {
  const storePath = getStorePath();
  if (fs.existsSync(storePath)) {
    try {
      sectionsStore = JSON.parse(fs.readFileSync(storePath, 'utf-8'));
      console.log(`[VectorDB] Cache rebuilt: ${sectionsStore.length} sections`);
    } catch (err) {
      console.error('[VectorDB] Cache rebuild failed:', err.message);
      sectionsStore = [];
    }
  }

  const casesPath = getCasesPath();
  if (fs.existsSync(casesPath)) {
    try {
      casesStore = JSON.parse(fs.readFileSync(casesPath, 'utf-8'));
      console.log(`[VectorDB] Cases rebuilt: ${casesStore.length} cases`);
    } catch (err) {
      casesStore = [];
    }
  }
}

export async function indexCaseData(caseData) {
  const casesPath = getCasesPath();

  if (fs.existsSync(casesPath)) {
    try { casesStore = JSON.parse(fs.readFileSync(casesPath, 'utf-8')); }
    catch { casesStore = []; }
  }

  const text = `FIR ${caseData.fir_number || ''}: ${caseData.description || ''}. Location: ${caseData.incident_location || ''}. Date: ${caseData.incident_date || ''}. Type: ${caseData.case_type || ''}. Sections: ${Array.isArray(caseData.sections_applied) ? caseData.sections_applied.join(', ') : caseData.sections_applied || ''}`;

  try {
    const embedding = await getEmbedding(text);
    if (embedding && embedding.length === 768) {
      casesStore.push({
        id: caseData.id,
        fir_number: caseData.fir_number,
        description: caseData.description,
        incident_location: caseData.incident_location,
        incident_date: caseData.incident_date,
        case_type: caseData.case_type,
        sections_applied: caseData.sections_applied || [],
        embedding
      });
      fs.writeFileSync(casesPath, JSON.stringify(casesStore));
      console.log(`[VectorDB] Case indexed: ${caseData.fir_number} (Total cases: ${casesStore.length})`);
    }
  } catch (err) {
    console.log(`[VectorDB] Failed to index case: ${err.message}`);
  }
}

export async function searchSimilarCases(query, limit = 5) {
  if (casesStore.length === 0) return [];

  try {
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length !== 768) return [];

    const scored = casesStore
      .filter(c => c.embedding && c.embedding.length === 768)
      .map(c => ({
        score: Math.round(cosineSimilarity(queryEmbedding, c.embedding) * 100),
        fir_number: c.fir_number,
        description: c.description,
        incident_location: c.incident_location,
        incident_date: c.incident_date,
        case_type: c.case_type,
        sections_applied: c.sections_applied
      }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  } catch (err) {
    console.error('[VectorDB] Case search error:', err.message);
    return [];
  }
}

function parseSections(content, lawName) {
  content = content.toLowerCase();
  const sections = [];
  const regex = /(?:bns|bnss|bsa|special act)\s*(?:section)?\s*(\d+)?\s*[-–]*\s*([^\n]+)\n([\s\S]*?)(?=(?:bns|bnss|bsa|special act)\s|$)/gi;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const sectionNumber = match[1] || '';
    const title = match[2].trim().substring(0, 200);
    const body = match[3].trim();

    const coreMatch = body.match(/(?:core content|covers):?\s*([\s\S]*?)(?=(?:procedure|punishment|bail|investigation):|(?:illustration):|$)/i);
    const procMatch = body.match(/(?:procedure):?\s*([\s\S]*?)(?=(?:illustration):|$)/i);
    const illusMatch = body.match(/(?:illustration):?\s*([\s\S]*?)$/i);

    const coreContent = coreMatch ? coreMatch[1].trim() : body;
    const procedure = procMatch ? procMatch[1].trim() : '';
    const illustration = illusMatch ? illusMatch[1].trim() : '';

    if (coreContent.length > 10) {
      sections.push({ law: lawName, section: sectionNumber, title, coreContent, procedure, illustration });
    }
  }

  if (sections.length === 0) {
    const chunks = content.split(/\n\n+/).filter(c => c.trim().length > 50);
    for (const chunk of chunks) {
      const titleMatch = chunk.match(/^(.+?)(?:\n|$)/);
      sections.push({ law: lawName, section: '', title: titleMatch ? titleMatch[1].trim().substring(0, 200) : '', coreContent: chunk, procedure: '', illustration: '' });
    }
  }

  return sections;
}

export async function indexLawFile(filePath, lawName) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sections = parseSections(content, lawName);
  console.log(`[VectorDB] Indexing ${lawName}: ${sections.length} sections`);

  let indexed = 0, skipped = 0;

  for (const s of sections) {
    const text = `${s.law} section ${s.section} ${s.title} ${s.coreContent.substring(0, 2000)}`;
    try {
      const embedding = await getEmbedding(text);
      if (embedding && embedding.length === 768) {
        s.embedding = embedding;
        sectionsStore.push(s);
        indexed++;
      } else {
        skipped++;
      }
    } catch (err) {
      skipped++;
    }
  }

  fs.writeFileSync(getStorePath(), JSON.stringify(sectionsStore));
  console.log(`[VectorDB] ${lawName} done. Indexed: ${indexed}, Skipped: ${skipped}, Total: ${sectionsStore.length}`);
}

export async function searchLaws(query, limit = 5) {
  if (sectionsStore.length === 0) return [];

  try {
    const queryEmbedding = await getEmbedding(query);
    if (!queryEmbedding || queryEmbedding.length !== 768) return [];

    const scored = sectionsStore
      .filter(s => s.embedding && s.embedding.length === 768)
      .map(s => ({
        score: Math.round(cosineSimilarity(queryEmbedding, s.embedding) * 100),
        law: s.law, section: s.section, title: s.title,
        coreContent: s.coreContent, procedure: s.procedure, illustration: s.illustration
      }));

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  } catch (err) {
    console.error('[VectorDB] Search error:', err.message);
    return [];
  }
}

const SEARCH_QUERY_PROMPT = `You are a legal search expert for Indian criminal law. You know the three new laws:

BNS (Bharatiya Nyaya Sanhita 2023) = Crimes and punishments
- Examples: theft (303), murder (101), rape (63), robbery (309), assault, kidnapping, fraud, dowry death (80), house trespass (331)

BNSS (Bharatiya Nagarik Suraksha Sanhita 2023) = Police procedures
- Examples: FIR registration (173), arrest without warrant (35), search (97), remand (187), charge sheet (193)

BSA (Bharatiya Sakshya Adhiniyam 2023) = Evidence rules
- Examples: electronic evidence (61, 63), confessions (22, 23), burden of proof (105), witness testimony (124)

A police officer asked: "{{QUERY}}"

Your job: Write ONE short search query that will find the exact legal sections needed.

Rules:
- Use the crime name + any important details (night, weapon, dwelling, consent, etc.)
- Use BNS for crime questions, BNSS for procedure questions, BSA for evidence questions
- Maximum 10 words
- No filler words like "sections under" or "what is" or "tell me about"
- Just the keywords

Examples:
- "theft at night" → "theft night house breaking dwelling bns"
- "how to arrest without warrant" → "arrest without warrant procedure bnss"
- "what evidence needed for murder" → "murder evidence collection bsa"
- "rape complaint procedure" → "rape fir medical evidence procedure bnss"
- "dowry death what section" → "dowry death bns section 80"

Return ONLY the search query. Nothing else.`;

const FINAL_ANSWER_PROMPT = `You are CrimeGPT, a senior legal advisor for Indian police officers.
You specialize in BNS 2023, BNSS 2023, and BSA 2023.

The officer asked: "{{QUERY}}"

We searched our legal database and found these relevant sections:

{{CONTEXT}}

{{SIMILAR_CASES}}

Your job: Read the question and references. Give a complete, accurate answer.

Structure your response:

1. RELEVANT LEGAL SECTIONS
   List each section with exact number and title from the references.

2. LEGAL EXPLANATION
   Explain what each section means in simple terms.

3. PROCEDURE TO FOLLOW
   Step-by-step what the officer should do.

4. EVIDENCE TO COLLECT
   What evidence is needed and how to collect it.

5. KEY POINTS
   Bail status, urgency, victim protection, or important cautions.

Rules:
- Only cite section numbers from the REFERENCES above
- If references don't cover something, say so honestly
- Be direct and actionable
- Respond in the same language as the officer's question`;

export async function getLegalOpinion(query) {
  console.log('\n═══════════════════════════════════');
  console.log(' RAG PIPELINE');
  console.log('═══════════════════════════════════');
  console.log(` Officer Query: "${query}"`);

  console.log('\n[Step 1] Qwen writing search query...');
  const searchPrompt = SEARCH_QUERY_PROMPT.replace('{{QUERY}}', query);
  let searchQuery = query;

  try {
    const response = await askOllama(searchPrompt);
    searchQuery = response.trim().substring(0, 300);
    console.log(' Search query:', searchQuery);
  } catch {
    console.log(' Using raw query as fallback');
  }

  console.log('\n[Step 2] Nomic searching database...');
  let results = await searchLaws(searchQuery, 5);

  if (results.length === 0) {
    console.log(' No results, trying original query...');
    results = await searchLaws(query, 5);
  }

  const similarCases = await searchSimilarCases(query, 3);

  console.log(` Retrieved: ${results.length} sections, ${similarCases.length} similar cases`);
  results.forEach((r, i) => {
    console.log(`  ${i + 1}. ${r.law.toUpperCase()} §${r.section} - "${r.title}" (${r.score}%)`);
  });

  if (results.length === 0) {
    return 'No matching legal sections found in the database. Please try rephrasing your question.';
  }

  console.log('\n[Step 3] Qwen generating answer...');
  let context = '';
  results.forEach((r, i) => {
    context += `\n--- REFERENCE ${i + 1} ---\n`;
    context += `LAW: ${r.law.toUpperCase()} | SECTION: ${r.section} | TITLE: ${r.title}\n`;
    context += `SCORE: ${r.score}% match\n`;
    context += `CONTENT: ${r.coreContent?.substring(0, 1500)}\n`;
    if (r.procedure && r.procedure.length > 5) {
      context += `PROCEDURE: ${r.procedure.substring(0, 800)}\n`;
    }
    if (r.illustration && r.illustration.length > 5) {
      context += `EXAMPLE: ${r.illustration.substring(0, 600)}\n`;
    }
  });

  let similarCasesText = '';
  if (similarCases.length > 0) {
    similarCasesText += '\n--- SIMILAR PAST CASES FROM THIS STATION ---\n';
    similarCases.forEach((c, i) => {
      similarCasesText += `\nCASE ${i + 1}: ${c.fir_number} (${c.score}% similar)\n`;
      similarCasesText += `Description: ${c.description}\n`;
      similarCasesText += `Location: ${c.incident_location} | Date: ${c.incident_date}\n`;
      if (c.sections_applied && c.sections_applied.length > 0) {
        similarCasesText += `Sections Applied: ${Array.isArray(c.sections_applied) ? c.sections_applied.join(', ') : c.sections_applied}\n`;
      }
    });
  }

  const finalPrompt = FINAL_ANSWER_PROMPT
    .replace('{{CONTEXT}}', context)
    .replace('{{SIMILAR_CASES}}', similarCasesText)
    .replace('{{QUERY}}', query);

  const answer = await askOllama(finalPrompt);
  console.log('═══════════════════════════════════\n');
  return answer;
}
const SECTION_SUGGESTION_PROMPT = `You are a legal section finder for Indian police.

Officer query: "{{QUERY}}"

Relevant sections from database:
{{CONTEXT}}

List ONLY the section numbers and titles. One per line. Nothing else.

Example:
BNS Section 303 - Theft
BNS Section 331 - House Trespass
BNSS Section 173 - FIR Registration`;

export async function suggestSections(query) {
  console.log('\n=== SECTION SUGGESTION ===');
  console.log(` Query: "${query}"`);

  const searchPrompt = SEARCH_QUERY_PROMPT.replace('{{QUERY}}', query);
  let searchQuery = query;

  try {
    const response = await askOllama(searchPrompt);
    searchQuery = response.trim().substring(0, 300);
  } catch {}

  let results = await searchLaws(searchQuery, 5);
  if (results.length === 0) results = await searchLaws(query, 5);

  if (results.length === 0) return 'No matching sections found.';

  let context = '';
  results.forEach((r, i) => {
    context += `${r.law.toUpperCase()} Section ${r.section} - ${r.title}\n`;
  });

  const finalPrompt = SECTION_SUGGESTION_PROMPT
    .replace('{{CONTEXT}}', context)
    .replace('{{QUERY}}', query);

  const answer = await askOllama(finalPrompt);
  console.log('=== SUGGESTION COMPLETE ===\n');
  return answer.trim();
}