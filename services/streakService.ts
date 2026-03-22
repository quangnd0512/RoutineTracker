// services/streakService.ts
import { toLocalDateString } from '@/utils/dateUtils';

export const FREEZE_CAP = 3;
export const FREEZE_AWARD_INTERVAL = 7;

export interface StreakSnapshot {
  streakCount: number;
  longestStreak: number;
  freezeCount: number;
  lastTaskDate: string | null;   // YYYY-MM-DD local
  lastCheckedDate: string | null; // YYYY-MM-DD local
  lastFreezeAwardedAtStreak: number;
}

export const DEFAULT_SNAPSHOT: StreakSnapshot = {
  streakCount: 0,
  longestStreak: 0,
  freezeCount: 0,
  lastTaskDate: null,
  lastCheckedDate: null,
  lastFreezeAwardedAtStreak: 0,
};

/**
 * Days B is after A (both YYYY-MM-DD local date strings).
 * Uses local-time Date constructor to avoid UTC offset issues.
 * e.g. daysBetween('2025-01-14', '2025-01-15') === 1
 */
export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const dateA = new Date(ay, am - 1, ad);
  const dateB = new Date(by, bm - 1, bd);
  return Math.round((dateB.getTime() - dateA.getTime()) / 86400000);
}

/**
 * Return the YYYY-MM-DD local date string for the day before dateStr.
 */
export function getYesterday(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d - 1);
  return toLocalDateString(date);
}

/**
 * Evaluate day transition: consumes freezes or resets streak for missed days.
 * Call on every app foreground event. Idempotent — safe to call many times/day.
 * Returns same snapshot reference if no change (for cheap equality checks).
 */
export function computeEvaluateResult(
  snapshot: StreakSnapshot,
  today: string,
): StreakSnapshot {
  const { lastCheckedDate, lastTaskDate, streakCount, freezeCount } = snapshot;

  // Idempotent: already evaluated today
  if (lastCheckedDate === today) return snapshot;

  // No prior activity — nothing to evaluate, just record today
  if (!lastTaskDate || lastTaskDate === today) {
    return { ...snapshot, lastCheckedDate: today };
  }

  const daysSince = daysBetween(lastTaskDate, today);

  // Completed yesterday or same day — no gap, streak intact
  if (daysSince <= 1) {
    return { ...snapshot, lastCheckedDate: today };
  }

  // Gap: (daysSince - 1) missed days
  const missedDays = daysSince - 1;

  if (freezeCount >= missedDays) {
    // Freezes cover the entire gap
    return {
      ...snapshot,
      freezeCount: Math.max(0, freezeCount - missedDays),
      // Fast-forward lastTaskDate to yesterday so recordTaskDone sees daysSince = 1
      lastTaskDate: getYesterday(today),
      lastCheckedDate: today,
    };
  } else {
    // Streak broken — not enough freezes
    return {
      ...snapshot,
      streakCount: 0,
      freezeCount: 0,
      lastTaskDate: null,
      lastCheckedDate: today,
      lastFreezeAwardedAtStreak: 0,
    };
  }
}

/**
 * Revoke today's streak record when the user un-completes their last task for today.
 * Only has an effect if lastTaskDate === today (meaning today was already counted).
 * Keeps longestStreak and freezeCount intact — freeze earned stays earned.
 * Returns same snapshot reference if no change.
 */
export function computeRevokeToday(
  snapshot: StreakSnapshot,
  today: string,
): StreakSnapshot {
  // Only revoke if today was actually counted
  if (snapshot.lastTaskDate !== today) return snapshot;

  const newStreak = Math.max(0, snapshot.streakCount - 1);
  return {
    ...snapshot,
    streakCount: newStreak,
    // Roll lastTaskDate back: to yesterday if streak > 0, else null
    lastTaskDate: newStreak > 0 ? getYesterday(today) : null,
  };
}

/**
 * Record that the user completed at least one task today.
 * Call only when the selected date IS today.
 * Idempotent — no-op if lastTaskDate is already today.
 * Returns same snapshot reference if no change.
 */
export function computeRecordTaskResult(
  snapshot: StreakSnapshot,
  today: string,
): StreakSnapshot {
  const { lastTaskDate, streakCount, longestStreak, freezeCount, lastFreezeAwardedAtStreak } = snapshot;

  // Idempotent: already recorded today
  if (lastTaskDate === today) return snapshot;

  let newStreak: number;
  let newFreezeCount = freezeCount;

  if (!lastTaskDate) {
    // First task ever (or after a reset)
    newStreak = 1;
  } else {
    const daysSince = daysBetween(lastTaskDate, today);
    if (daysSince === 1) {
      // Perfect continuation
      newStreak = streakCount + 1;
    } else if (daysSince > 1) {
      // Gap (defensive: evaluateNewDay should have handled this, but protect against races)
      const missedDays = daysSince - 1;
      if (newFreezeCount >= missedDays) {
        newFreezeCount = Math.max(0, newFreezeCount - missedDays);
        newStreak = streakCount + 1;
      } else {
        newFreezeCount = 0;
        newStreak = 1;
      }
    } else {
      // daysSince <= 0: same day or time-travel — idempotent
      return snapshot;
    }
  }

  // Award 1 freeze at each FREEZE_AWARD_INTERVAL milestone, capped at FREEZE_CAP
  let newLastFreezeAwardedAtStreak = lastFreezeAwardedAtStreak;
  if (
    newStreak > 0 &&
    newStreak % FREEZE_AWARD_INTERVAL === 0 &&
    newStreak > lastFreezeAwardedAtStreak
  ) {
    newFreezeCount = Math.min(FREEZE_CAP, newFreezeCount + 1);
    newLastFreezeAwardedAtStreak = newStreak;
  }

  return {
    streakCount: newStreak,
    longestStreak: Math.max(longestStreak, newStreak),
    freezeCount: newFreezeCount,
    lastTaskDate: today,
    lastCheckedDate: today,
    lastFreezeAwardedAtStreak: newLastFreezeAwardedAtStreak,
  };
}
