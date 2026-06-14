import { searchLaws, searchCases, buildLegalContext } from './vector-db.js';
const ANALYSIS_PROMPT = `You are a legal intake specialist for Indian police using the NEW criminal laws (BNS, BNSS, BSA 2023).

CRITICAL: The old IPC, CrPC, and Evidence Act are REPLACED. Never mention them.

Query: "{{QUERY}}"

Extract key legal facts. Return ONLY a JSON object:
{
  "crime_type": "theft/assault/murder/robbery/rape/kidnapping/fraud/cybercrime/dowry/domestic_violence/other",
  "key_actions": ["action1", "action2"],
  "urgency": "high/medium/low",
  "victim_involved": true/false,
  "search_terms": ["term1", "term2", "term3"]
}

CRITICAL RULES for search_terms:
- Use SIMPLE keywords like "theft", "stolen property", "night robbery"
- DO NOT include section numbers like "Section 378" or "IPC 378"
- DO NOT mention IPC, CrPC, or old laws
- Use plain English words that describe the crime
- Keep search terms short (1-3 words each)`;
const OPINION_PROMPT = `You are CrimeGPT, a senior legal advisor for Indian police officers using the NEW criminal laws: BNS 2023, BNSS 2023, BSA 2023.

CRITICAL: You MUST ONLY use the exact section numbers from the DATABASE REFERENCES below. Every section number you mention must appear in the references. Do NOT invent numbers.

DATABASE REFERENCES:
{{CONTEXT}}

OFFICER QUERY:
{{QUERY}}

Provide a clear, structured legal advisory using ONLY the section numbers found in the references above.

1. IMMEDIATE ACTIONS
2. APPLICABLE LEGAL SECTIONS (exact numbers from references)
3. PROCEDURAL STEPS (BNSS)
4. EVIDENCE REQUIREMENTS (BSA)
5. NEXT STEPS

If no relevant references found, say so honestly and give general guidance based on BNS/BNSS/BSA.`;
export async function getLegalOpinion(query) {
  const { askOllama } = await import('./ai-setup.js');

  console.log('=== RAG PIPELINE START ===');
  console.log('Query:', query);

  const laws = await searchLaws(query, 5);
  console.log('Laws found:', laws.length);
  laws.forEach((l, i) => {
    console.log(`  ${i + 1}. [${l.law}] Score: ${l.score}% - ${l.text?.substring(0, 150)}`);
  });

  const cases = await searchCases(query, 3);
  console.log('Cases found:', cases.length);

  const context = buildLegalContext(laws, cases);
  console.log('Context length:', context.length, 'characters');

  if (context.length > 0) {
    console.log('Context preview:', context.substring(0, 300));
  }

  const opinionPrompt = OPINION_PROMPT
    .replace('{{CRIME_TYPE}}', '')
    .replace('{{URGENCY}}', '')
    .replace('{{VICTIM_INVOLVED}}', '')
    .replace('{{CONTEXT}}', context || 'No database references found.')
    .replace('{{QUERY}}', query);

  console.log('Getting opinion from Qwen...');
  const opinion = await askOllama(opinionPrompt);
  console.log('Opinion received, length:', opinion.length);
  console.log('=== RAG PIPELINE END ===');

  return opinion;
}