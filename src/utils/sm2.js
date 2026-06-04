/**
 * SM-2 Spaced Repetition Algorithm
 * Ratings: 0 = complete blackout, 5 = perfect response
 * Returns updated { interval, repetitions, easeFactor, nextReview }
 */
export function sm2(rating, repetitions, easeFactor, interval) {
  const ef = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
  let newInterval;
  let newRepetitions;

  if (rating < 3) {
    // Failed — reset
    newRepetitions = 0;
    newInterval = 1;
  } else {
    newRepetitions = repetitions + 1;
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * ef);
    }
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + newInterval);

  return {
    interval: newInterval,
    repetitions: newRepetitions,
    easeFactor: ef,
    nextReview: nextReview.toISOString(),
  };
}

/**
 * Check if a note is due for review today
 */
export function isDueForReview(nextReview) {
  if (!nextReview) return true; // never reviewed → always due
  const due = new Date(nextReview);
  return due <= new Date();
}

/**
 * Get all notes that are due for review from review logs + notes list
 */
export function getDueNotes(notes, reviewLogs) {
  // Build a map of noteId → most recent review
  const latestReview = {};
  reviewLogs.forEach(log => {
    const existing = latestReview[log.noteId];
    if (!existing || new Date(log.reviewedAt?.toDate?.() || log.reviewedAt) > new Date(existing.reviewedAt?.toDate?.() || existing.reviewedAt)) {
      latestReview[log.noteId] = log;
    }
  });

  return notes.filter(note => {
    const log = latestReview[note.id];
    if (!log) return true; // never reviewed
    return isDueForReview(log.nextReview);
  });
}
