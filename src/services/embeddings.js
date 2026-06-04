/**
 * Semantic Embeddings Service
 *
 * Uses Hugging Face Inference API with sentence-transformers/all-MiniLM-L6-v2
 * → 384-dimensional embeddings, free tier, no extra packages needed.
 *
 * Embeddings are stored directly on Firestore note documents.
 * Similarity is computed client-side with cosine similarity — fast enough
 * for hundreds of notes in the browser.
 */

const HF_API_KEY = import.meta.env.VITE_HF_API_KEY;
const HF_MODEL   = 'sentence-transformers/all-MiniLM-L6-v2';
const HF_URL     = `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`;

// ── In-memory cache: text → embedding vector ─────────────────────────────────
const embeddingCache = new Map();

/**
 * Generate an embedding for a single string.
 * Returns a Float32Array (384 dims) or null on failure.
 */
export async function getEmbedding(text) {
  if (!text?.trim()) return null;

  // Normalise + truncate — model max is 512 tokens (~1800 chars)
  const normalised = text.trim().replace(/\s+/g, ' ').slice(0, 1800);

  if (embeddingCache.has(normalised)) {
    return embeddingCache.get(normalised);
  }

  if (!HF_API_KEY) {
    console.warn('Semantic search disabled: add VITE_HF_API_KEY to .env');
    return null;
  }

  try {
    const res = await fetch(HF_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: normalised, options: { wait_for_model: true } }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      // 503 = model loading — caller can retry; log but don't throw
      console.warn(`HF embedding API ${res.status}:`, body.slice(0, 120));
      return null;
    }

    const raw = await res.json();

    // HF returns either a flat array or array-of-arrays (batch)
    const vector = Array.isArray(raw[0]) ? raw[0] : raw;
    if (!Array.isArray(vector) || vector.length === 0) return null;

    const f32 = new Float32Array(vector);
    embeddingCache.set(normalised, f32);
    return f32;
  } catch (err) {
    console.warn('getEmbedding failed:', err.message);
    return null;
  }
}

/**
 * Build the text we embed for a note.
 * Combines title (weighted 3×) + tags (weighted 2×) + summary + first 800 chars of content.
 * Title repetition increases its influence in the dot product.
 */
export function noteToEmbedText(note) {
  const parts = [
    note.title, note.title, note.title,           // 3× weight
    note.tags?.join(' '), note.tags?.join(' '),   // 2× weight
    note.summary,
    note.content?.slice(0, 800),
  ].filter(Boolean);
  return parts.join('. ');
}

/**
 * Cosine similarity between two Float32Arrays (or regular arrays).
 * Returns a value in [-1, 1]. Higher = more similar.
 */
export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Rank a list of notes by semantic similarity to a query string.
 * Returns notes sorted by descending similarity with their scores.
 *
 * @param {string}   query
 * @param {object[]} notes  — must have .embedding (array stored in Firestore)
 * @param {number}   topK   — max results to return
 * @param {number}   threshold — minimum similarity (0-1) to include
 */
export async function semanticRankNotes(query, notes, topK = 6, threshold = 0.25) {
  const queryVec = await getEmbedding(query);
  if (!queryVec) return []; // no HF key or API failure — caller falls back to keyword

  const notesWithEmbedding = notes.filter(n => n.embedding && n.embedding.length > 0);
  if (!notesWithEmbedding.length) return [];

  const scored = notesWithEmbedding.map(note => {
    // Firestore stores embedding as a plain JS array — convert for dot product
    const noteVec = note.embedding instanceof Float32Array
      ? note.embedding
      : new Float32Array(note.embedding);

    return { note, score: cosineSimilarity(queryVec, noteVec) };
  });

  return scored
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ note, score }) => ({ ...note, _semanticScore: score }));
}

/**
 * Hybrid search: combine semantic score + keyword score into a single ranking.
 *
 * @param {string}   query
 * @param {object[]} notes
 * @param {number}   topK
 */
export async function hybridSearch(query, notes, topK = 8) {
  if (!query?.trim()) return notes.slice(0, topK);

  // ── Keyword scoring ──────────────────────────────────────────────────────
  const q = query.toLowerCase();
  const stopWords = new Set([
    'the','a','an','is','are','was','were','be','been','have','has','had',
    'do','does','did','will','would','could','should','may','might','shall',
    'can','about','from','with','what','who','where','when','how','why',
    'i','in','on','at','to','of','and','or','for','not','but','by','this','that',
  ]);
  const words = q.split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

  const keywordScores = new Map();
  notes.forEach(note => {
    const tl = note.title?.toLowerCase()   || '';
    const cl = note.content?.toLowerCase() || '';
    const sl = note.summary?.toLowerCase() || '';
    const gl = note.tags?.join(' ').toLowerCase() || '';

    let score = 0;
    if (tl.includes(q)) score += 12;
    if (gl.includes(q)) score += 9;
    if (sl.includes(q)) score += 6;
    if (cl.includes(q)) score += 4;

    words.forEach(w => {
      if (tl.includes(w)) score += 7;
      if (gl.includes(w)) score += 5;
      if (sl.includes(w)) score += 3;
      if (cl.includes(w)) score += 2;
    });

    keywordScores.set(note.id, score);
  });

  const maxKeyword = Math.max(1, ...keywordScores.values());

  // ── Semantic scoring ─────────────────────────────────────────────────────
  const queryVec = await getEmbedding(query);
  const semanticScores = new Map();

  if (queryVec) {
    notes.forEach(note => {
      if (!note.embedding?.length) return;
      const noteVec = note.embedding instanceof Float32Array
        ? note.embedding
        : new Float32Array(note.embedding);
      semanticScores.set(note.id, cosineSimilarity(queryVec, noteVec));
    });
  }

  const maxSemantic = semanticScores.size > 0
    ? Math.max(1e-6, ...semanticScores.values())
    : 1;

  // ── Combine: 40% keyword (normalised) + 60% semantic ────────────────────
  // If no embeddings exist yet, fall back to 100% keyword
  const hasAnyEmbeddings = semanticScores.size > 0;
  const kWeight = hasAnyEmbeddings ? 0.4 : 1.0;
  const sWeight = hasAnyEmbeddings ? 0.6 : 0.0;

  const combined = notes.map(note => {
    const ks = (keywordScores.get(note.id) || 0) / maxKeyword;
    const ss = (semanticScores.get(note.id) || 0) / maxSemantic;
    const total = kWeight * ks + sWeight * ss;
    return { note, total, semanticScore: semanticScores.get(note.id) || 0 };
  });

  return combined
    .filter(({ total }) => total > 0.05)
    .sort((a, b) => b.total - a.total)
    .slice(0, topK)
    .map(({ note, semanticScore }) => ({
      ...note,
      _semanticScore: semanticScore,
      _hasEmbedding: semanticScores.has(note.id),
    }));
}

/**
 * Check whether the HF API key is configured.
 */
export function isSemanticSearchAvailable() {
  return Boolean(HF_API_KEY);
}
