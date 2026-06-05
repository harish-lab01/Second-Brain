/**
 * useRateLimit — Client-side API usage tracker
 *
 * Tracks calls per key in localStorage with a rolling time window.
 * Protects Groq (chat) and HF (embeddings) from runaway usage.
 *
 * Usage:
 *   const { check, consume, remaining } = useRateLimit('chat', 30, 60 * 60 * 1000);
 *   // 30 calls per hour
 *   if (!check()) { showToast('Slow down!', 'error'); return; }
 *   consume();
 *   // ... make API call
 */
import { useCallback } from 'react';

const LS_KEY = 'sb_rate_limits';

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function writeStore(data) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  } catch { /* storage full — ignore */ }
}

/**
 * Get current usage for a key within the window.
 */
function getUsage(key, windowMs) {
  const store = readStore();
  const record = store[key] || { calls: [], windowMs };
  const now = Date.now();
  // Prune calls outside the window
  const fresh = record.calls.filter(ts => now - ts < windowMs);
  return { fresh, store, record };
}

/**
 * Check if the key is within the limit (returns true = allowed).
 */
export function checkLimit(key, maxCalls, windowMs) {
  const { fresh } = getUsage(key, windowMs);
  return fresh.length < maxCalls;
}

/**
 * Record a call for the key.
 */
export function consumeLimit(key, windowMs) {
  const { fresh, store } = getUsage(key, windowMs);
  fresh.push(Date.now());
  store[key] = { calls: fresh, windowMs };
  writeStore(store);
}

/**
 * Get remaining calls for the key within the window.
 */
export function remainingCalls(key, maxCalls, windowMs) {
  const { fresh } = getUsage(key, windowMs);
  return Math.max(0, maxCalls - fresh.length);
}

/**
 * Reset all rate limit data (useful for testing).
 */
export function resetLimits() {
  localStorage.removeItem(LS_KEY);
}

/**
 * React hook for convenient rate limit access.
 *
 * @param {string} key       — unique identifier for the limit (e.g. 'chat', 'embed')
 * @param {number} maxCalls  — max calls allowed in the window
 * @param {number} windowMs  — time window in milliseconds
 */
export function useRateLimit(key, maxCalls, windowMs) {
  const check    = useCallback(() => checkLimit(key, maxCalls, windowMs), [key, maxCalls, windowMs]);
  const consume  = useCallback(() => consumeLimit(key, windowMs), [key, windowMs]);
  const remaining = useCallback(() => remainingCalls(key, maxCalls, windowMs), [key, maxCalls, windowMs]);

  return { check, consume, remaining };
}
