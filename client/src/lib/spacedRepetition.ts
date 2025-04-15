// SM-2 Algorithm implementation for spaced repetition
// Based on: https://www.supermemo.com/en/archives1990-2015/english/ol/sm2

/**
 * Grade quality:
 * 0 - Complete blackout, wrong answer
 * 1 - Incorrect response, but upon seeing the answer, it felt familiar
 * 2 - Incorrect response, but upon seeing the answer, it feels easy to recall
 * 3 - Correct response, but required significant effort to recall
 * 4 - Correct response, after some hesitation
 * 5 - Perfect recall
 */

export interface SpacedRepetitionItem {
  eFactor: number; // easiness factor, minimum 1.3
  interval: number; // in days
  repetitions: number; // number of successful recalls
}

/**
 * Calculate the next review parameters based on SM-2 algorithm
 * @param item The current item with spaced repetition parameters
 * @param quality The quality of response (0-5)
 * @returns Updated spaced repetition parameters
 */
export function calculateNextReview(
  item: SpacedRepetitionItem,
  quality: number
): SpacedRepetitionItem {
  // Ensure quality is within bounds
  quality = Math.max(0, Math.min(5, quality));

  // If quality < 3, start repetitions from scratch
  const newRepetitions = quality < 3 ? 0 : item.repetitions + 1;

  // Update eFactor based on quality
  let newEFactor = item.eFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  newEFactor = Math.max(1.3, newEFactor); // eFactor shouldn't be less than 1.3

  // Calculate new interval
  let newInterval;
  if (quality < 3) {
    newInterval = 1; // Reset interval if quality < 3
  } else {
    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(item.interval * newEFactor);
    }
  }

  return {
    eFactor: newEFactor,
    interval: newInterval,
    repetitions: newRepetitions
  };
}

/**
 * Calculate the next review date
 * @param item The spaced repetition item
 * @returns Date object representing the next review date
 */
export function getNextReviewDate(item: SpacedRepetitionItem): Date {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + item.interval);
  return nextDate;
}

/**
 * Check if an item is due for review
 * @param nextReviewDate The date when the item is due for review
 * @returns Boolean indicating if the item is due
 */
export function isDue(nextReviewDate: Date): boolean {
  return new Date() >= nextReviewDate;
}

/**
 * Initialize a new spaced repetition item
 * @returns A new spaced repetition item with default values
 */
export function initializeItem(): SpacedRepetitionItem {
  return {
    eFactor: 2.5,
    interval: 0,
    repetitions: 0
  };
}
