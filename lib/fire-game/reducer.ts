import type { FireGameAction, FireGameState } from "./types";

export function fireGameReducer(state: FireGameState, action: FireGameAction): FireGameState {
  switch (action.type) {
    case "HYDRATE":

      if (state.phase !== "ambient" || state.outcome !== null || state.everEngulfed) return state;
      return { ...state, phase: action.phase, outcome: action.outcome, everEngulfed: action.everEngulfed };

    case "DWELL_THRESHOLD_REACHED":
      if (state.phase !== "ambient") return state;
      return { ...state, phase: "burning" };

    case "BURN_COMPLETE":
      if (state.phase !== "burning") return state;
      return { ...state, phase: "engulfed", everEngulfed: true };

    case "DEV_FORCE_ENGULFED":

      if (state.phase !== "ambient" && state.phase !== "burning") return state;
      return { ...state, phase: "engulfed", everEngulfed: true };

    case "LOGO_CLICKED":
      if (state.phase !== "engulfed") return state;
      return { ...state, phase: "collapsing" };

    case "BADGE_CLICKED":

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
      return { ...state, phase: "resolved", outcome: "won" };

    case "LOSE_SEQUENCE_COMPLETE": {
      if (state.phase !== "losing") return state;
      const nextOutcome = state.outcome === "won" ? "won" : "lost";
      return { ...state, phase: "resolved", outcome: nextOutcome };
    }

    default:
      return state;
  }
}
