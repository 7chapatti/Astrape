import type { FireGameOutcome } from "./types";

// Two keys the spec calls for, plus one small addition — see the comment
// on EVER_ENGULFED_KEY below for why.
const CYCLE_COMPLETE_KEY = "astrape-burn-cycle-complete";
const OUTCOME_KEY = "astrape-game-outcome";
const EVER_ENGULFED_KEY = "astrape-fire-engulfed";

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {}
}

export function readCycleComplete(): boolean {
  return safeGet(CYCLE_COMPLETE_KEY) === "1";
}

export function readOutcome(): FireGameOutcome {
  const v = safeGet(OUTCOME_KEY);
  return v === "won" || v === "lost" ? v : null;
}

export function readEverEngulfed(): boolean {
  return safeGet(EVER_ENGULFED_KEY) === "1";
}

export function writeCycleComplete() {
  safeSet(CYCLE_COMPLETE_KEY, "1");
}

// Unconditional write — the "winning sticks" guard (don't overwrite "won"
// with a later "lost") lives in the reducer, which already holds the
// authoritative in-memory outcome and doesn't need to re-read storage to
// enforce it.
export function writeOutcome(outcome: "won" | "lost") {
  safeSet(OUTCOME_KEY, outcome);
}

export function writeEverEngulfed() {
  safeSet(EVER_ENGULFED_KEY, "1");
}

/**
 * Derives the phase to boot into on page load / refresh.
 *
 * - Burn cycle already complete this session -> "resolved" (badge shows
 *   the session's best outcome, no re-ignition).
 * - Never reached "engulfed" yet -> "ambient" (dwell timer starts fresh —
 *   this also covers true first-ever visits).
 * - Reached "engulfed" at least once but never finished a cycle (i.e. they
 *   refreshed somewhere in burning/engulfed/collapsing/playing/winning/
 *   losing) -> "engulfed" directly. Nothing about the level itself is
 *   persisted on purpose: refreshing mid-game just drops them back onto
 *   the lit, clickable logo so they can jump straight back in, rather than
 *   resuming a physics simulation mid-air or re-running the buildup.
 */
export function deriveBootPhase(): "ambient" | "engulfed" | "resolved" {
  if (readCycleComplete()) return "resolved";
  if (readEverEngulfed()) return "engulfed";
  return "ambient";
}
