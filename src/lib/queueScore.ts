/**
 * queueScore.ts — Pure scoring function for the patient queue system.
 *
 * Score = baseSeverity + appointmentBonus + agingBonus + manualAdjustment
 *
 * Higher score = called sooner.
 */

export interface QueueScoreParams {
  critical: "low" | "medium" | "high";
  checkInTime: Date;       // when the patient physically registered/arrived
  scheduledTime: Date | null; // null = walk-in; Date = pre-booked slot
  manualAdjustment: number;   // receptionist override (e.g. +999 = urgent, -30 = defer slightly)
  now?: Date;              // injectable for testing; defaults to new Date()
}

export function computeQueueScore(params: QueueScoreParams): number {
  const now = params.now ?? new Date();

  // ── 1. Base severity points ──
  const BASE: Record<string, number> = { high: 100, medium: 50, low: 10 };
  const base = BASE[params.critical] ?? 10;

  // ── 2. Appointment bonus ──
  // Activates in the final 60 min before the scheduled slot.
  // Ramps linearly 0 → 40 as the slot approaches.
  // Once the slot time has passed, the full 40 pts is maintained
  // (per requirement: assume all patients arrive on time).
  let apptBonus = 0;
  if (params.scheduledTime) {
    const minutesToSlot =
      (params.scheduledTime.getTime() - now.getTime()) / 60_000;

    if (minutesToSlot < 0) {
      // Slot has passed — award the full bonus
      apptBonus = 40;
    } else if (minutesToSlot <= 60) {
      // Within the 60-min activation window — ramp 0 → 40
      apptBonus = 40 * (1 - minutesToSlot / 60);
    }
    // > 60 min before slot → bonus stays 0
  }

  // ── 3. Aging / anti-starvation bonus ──
  // Every 5 minutes waiting adds points. Low-severity patients age faster
  // so they eventually catch up to fresher higher-severity patients.
  const minutesWaiting =
    (now.getTime() - params.checkInTime.getTime()) / 60_000;

  const AGING_RATE: Record<string, number> = { high: 1, medium: 2, low: 3 };
  const agingRate = AGING_RATE[params.critical] ?? 1;
  const agingBonus = Math.floor(minutesWaiting / 5) * agingRate;

  return base + apptBonus + agingBonus + params.manualAdjustment;
}
