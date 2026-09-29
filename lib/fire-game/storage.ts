import type { FireGameOutcome } from "./types";

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

export function writeOutcome(outcome: "won" | "lost") {
  safeSet(OUTCOME_KEY, outcome);
}

export function writeEverEngulfed() {
  safeSet(EVER_ENGULFED_KEY, "1");
}

export function clearFireGameStorage() {
  for (const key of [CYCLE_COMPLETE_KEY, OUTCOME_KEY, EVER_ENGULFED_KEY]) {
    try {
      sessionStorage.removeItem(key);
    } catch {}
  }
}

export function deriveBootPhase(): "ambient" | "engulfed" | "resolved" {
  if (readCycleComplete()) return "resolved";
  if (readEverEngulfed()) return "engulfed";
  return "ambient";
}
