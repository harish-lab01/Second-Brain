// AI service — powered by Groq (llama-3.3-70b-versatile)
// Drop-in replacement for Gemini — same exports, same behaviour

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

async function callAI(prompt) {
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is missing. Add VITE_GROQ_API_KEY to your .env file.');
  }

  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Groq API error ${response.status}: ${errorBody || response.statusText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function analyzeNote(content) {
  if (!content?.trim()) {
    return { summary: 'No content to analyze.', tags: [] };
  }

  const prompt = `Analyze this note and return ONLY valid JSON (no markdown, no code blocks):
{
  "summary": "2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
Rules: tags must be lowercase, max 2 words each, no special characters.
Note:
"""
${content.slice(0, 3000)}
"""`;

  try {
    const raw = await callAI(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('analyzeNote error:', err.message);
    return { summary: 'Could not generate summary.', tags: [] };
  }
}

export async function findRelatedNotes(currentNote, allNotes) {
  if (!allNotes.length) return [];

  const noteList = allNotes
    .slice(0, 20)
    .map(n => `ID:${n.id} | ${n.title} | tags:${n.tags?.join(',')}`)
    .join('\n');

  const prompt = `Return ONLY a JSON array of IDs (max 3) of notes most related to the current note. Return [] if none are related.
Current note: ${currentNote.title} | tags: ${currentNote.tags?.join(',')}
Available notes:
${noteList}
Return only the JSON array like: ["id1","id2"]`;

  try {
    const raw = await callAI(prompt);
    const cleaned = raw.replace(/```json|```/g, '').trim();
    // Extract JSON array from response
    const match = cleaned.match(/\[.*\]/s);
    return match ? JSON.parse(match[0]) : [];
  } catch (err) {
    console.error('findRelatedNotes error:', err.message);
    return [];
  }
}

export async function chatWithNotes(userMessage, relevantNotes, chatHistory) {
  const context = relevantNotes.length
    ? relevantNotes
        .map(n => `### ${n.title}\n${n.content?.slice(0, 1500)}`)
        .join('\n\n')
    : 'No relevant notes found.';

  const history = chatHistory
    .slice(-6)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = `You are a friendly, conversational personal assistant. The user has saved notes and you help them recall and understand that information.

Respond naturally like a helpful friend — no robotic phrases like "According to the note" or "[Note: ...]". Just answer directly and conversationally. Use bullet points or short paragraphs when it helps clarity. If something isn't in the notes, say so casually.

USER'S NOTES:
${context}

${history ? `PREVIOUS MESSAGES:\n${history}\n` : ''}
User: ${userMessage}
Assistant:`;

  return await callAI(prompt);
}

export async function generateWeeklyDigest(recentNotes) {
  if (!recentNotes.length) return 'No notes saved this week.';

  const list = recentNotes.map(n => `- ${n.title}: ${n.summary}`).join('\n');
  const prompt = `Based on these notes the user saved this week, write a warm, conversational 3-4 sentence summary of what they've been learning and working on. Make it feel personal and encouraging, like a friend reflecting back their progress:\n${list}`;

  try {
    return await callAI(prompt);
  } catch (err) {
    console.error('generateWeeklyDigest error:', err.message);
    return 'Could not generate digest.';
  }
}

/**
 * Fetch metadata + readable content from a URL using a CORS proxy.
 * Returns { title, description, content } — all strings, possibly empty.
 */
export async function fetchUrlContent(url) {
  try {
    // Use allorigins CORS proxy to fetch raw HTML
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`Proxy error ${res.status}`);
    const json = await res.json();
    const html = json.contents || '';

    // Parse with DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract title
    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      doc.querySelector('title')?.textContent?.trim() ||
      '';

    // Extract description
    const description =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '';

    // Extract body text — prefer article/main, fall back to body
    const articleEl = doc.querySelector('article') || doc.querySelector('main') || doc.body;
    // Remove scripts, styles, nav, footer
    ['script', 'style', 'nav', 'footer', 'header', 'aside', 'noscript'].forEach(tag => {
      articleEl?.querySelectorAll(tag).forEach(el => el.remove());
    });
    const bodyText = (articleEl?.innerText || articleEl?.textContent || '')
      .replace(/\s{3,}/g, '\n\n')
      .trim()
      .slice(0, 6000);

    return { title, description, content: bodyText };
  } catch (err) {
    console.warn('fetchUrlContent failed:', err.message);
    return { title: '', description: '', content: '' };
  }
}

/**
 * Generate a flashcard question from note content for spaced repetition.
 */
export async function generateFlashcard(note) {
  const prompt = `Based on this note, create ONE clear flashcard question that tests understanding of the most important concept. Return ONLY valid JSON:
{"question": "...", "hint": "one short hint"}
Note title: ${note.title}
Note summary: ${note.summary || ''}
Note content (excerpt): ${note.content?.slice(0, 1000) || ''}`;

  try {
    const raw = await callAI(prompt);
    const cleaned = raw.replace(/\`\`\`json|\`\`\`/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { question: `What is the main idea of "${note.title}"?`, hint: note.summary || '' };
  }
}
