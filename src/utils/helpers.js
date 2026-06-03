/**
 * Format a Firestore timestamp or ISO string to a readable date string.
 */
export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text to a max length with ellipsis.
 */
export function truncate(str, maxLen = 120) {
  if (!str) return '';
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
}

/**
 * Get notes from the past 7 days.
 */
export function getRecentNotes(notes, days = 7) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return notes.filter(n => {
    const ts = n.createdAt?.toDate ? n.createdAt.toDate().getTime() : new Date(n.createdAt).getTime();
    return ts >= cutoff;
  });
}

/**
 * Get all unique tags across notes.
 */
export function getAllTags(notes) {
  const tagSet = new Set();
  notes.forEach(n => n.tags?.forEach(t => tagSet.add(t)));
  return Array.from(tagSet).sort();
}

/**
 * Get note type color class.
 */
export function getTypeBadgeClass(type) {
  switch (type) {
    case 'pdf': return 'bg-orange-100 text-orange-700';
    case 'url': return 'bg-blue-100 text-blue-700';
    default:    return 'bg-gray-100 text-gray-600';
  }
}
