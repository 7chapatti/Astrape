import type { FireGameAction, FireGameState } from "./types";
import { writeCycleComplete, writeEverEngulfed, writeOutcome } from "./storage";

export function fireGameReducer(state: FireGameState, action: FireGameAction): FireGameState {
  switch (action.type) {
    case "HYDRATE":
      // Only ever dispatched once, immediately after mount, from a state
      // that's still the untouched server-safe default — never overwrite
      // real in-session progress with it.
      if (state.phase !== "ambient" || state.outcome !== null || state.everEngulfed) return state;
      return { ...state, phase: action.phase, outcome: action.outcome, everEngulfed: action.everEngulfed };

    case "DWELL_THRESHOLD_REACHED":
      if (state.phase !== "ambient") return state;
      return { ...state, phase: "burning" };

    case "BURN_COMPLETE":
      if (state.phase !== "burning") return state;
      writeEverEngulfed();
      return { ...state, phase: "engulfed", everEngulfed: true };

    case "DEV_FORCE_ENGULFED":
      // Silent shortcut, never surfaced in the UI. Only valid before the
      // logo is already lit — once engulfed/collapsing/playing/etc, there's
      // nothing left to force.
      if (state.phase !== "ambient" && state.phase !== "burning") return state;
      writeEverEngulfed();
      return { ...state, phase: "engulfed", everEngulfed: true };

    case "LOGO_CLICKED":
      if (state.phase !== "engulfed") return state;
      return { ...state, phase: "collapsing" };

    case "BADGE_CLICKED":
      // Retry: skips ambient/burning/engulfed entirely, straight into the
      // same collapsing -> playing transition a fresh logo click uses.
      if (state.phase !== "resolved") return state;
      return { ...state, phase: "collapsing" };

    case "COLLAPSE_COMPLETE":
      if (state.phase !== "collapsing") return state;
      return { ...state, phase: "playing" };

    case "REACHED_TAIL_OF_E":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "winning", winExit: { x: action.x, y: action.y, vx: action.vx, vy: action.vy } };

    case "FELL_OFF_BOTTOM":
      if (state.phase !== "playing") return state;
      return { ...state, phase: "losing", loseExit: { x: action.x, y: action.y, vx: action.vx, vy: action.vy } };

    case "WIN_SEQUENCE_COMPLETE":
      if (state.phase !== "winning") return state;
      writeCycleComplete();
      writeOutcome("won");
      return { ...state, phase: "resolved", outcome: "won" };

    case "LOSE_SEQUENCE_COMPLETE": {
      if (state.phase !== "losing") return state;
      writeCycleComplete();
      // "Winning sticks" — a loss never downgrades an existing win. The
      // in-memory state.outcome is the authoritative record here (it's
      // always kept in sync with storage), so no re-read is needed.
      const nextOutcome = state.outcome === "won" ? "won" : "lost";
      if (nextOutcome === "lost") writeOutcome("lost");
      return { ...state, phase: "resolved", outcome: nextOutcome };
    }

    default:
      return state;
  }
}
