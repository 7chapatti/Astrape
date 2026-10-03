// Types for the hidden homepage fire game. See project spec for the full
// phase-by-phase behavior; this file only defines the shapes.

export type FireGamePhase =
  | "ambient" // default site behavior, dwell timer running
  | "burning" // fire visibly spreading toward the logo
  | "engulfed" // logo fully on fire, clickable
  | "collapsing" // click registered, one-shot transition into the level
  | "playing" // the letterform platformer
  | "winning" // slide off "e" -> travel to badge -> ignite/flare -> zoom out
  | "losing" // fall past bottom -> water -> smoke -> fade home
  | "resolved"; // back on the homepage, badge reflects session outcome

export type FireGameOutcome = "won" | "lost" | null;

/** Fireball position/velocity in screen-space pixels at the moment it left the level — lets the winning/losing sequences pick up smoothly from where the level left off, without persisting any of it. */
export interface FireExit {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface FireGameState {
  phase: FireGamePhase;
  /** Best outcome this session ("winning sticks" — never downgraded by a later loss). */
  outcome: FireGameOutcome;
  /**
   * Whether the logo has ever fully caught fire this session. Only used to
   * decide what a mid-game refresh lands on (see storage.ts) — not part of
   * the win/loss rules themselves.
   */
  everEngulfed: boolean;
  /** Transient hand-off data for the current winning/losing sequence — in-memory only, never persisted, irrelevant once resolved. */
  winExit: FireExit | null;
  loseExit: FireExit | null;
}

export type FireGameAction =
  | { type: "DWELL_THRESHOLD_REACHED" } // ambient -> burning
  | { type: "BURN_COMPLETE" } // burning -> engulfed
  | { type: "LOGO_CLICKED" } // engulfed -> collapsing
  | { type: "COLLAPSE_COMPLETE" } // collapsing -> playing
  | ({ type: "REACHED_TAIL_OF_E" } & FireExit) // playing -> winning
  | ({ type: "FELL_OFF_BOTTOM" } & FireExit) // playing -> losing
  | { type: "WIN_SEQUENCE_COMPLETE" } // winning -> resolved (outcome: won)
  | { type: "LOSE_SEQUENCE_COMPLETE" } // losing -> resolved (outcome: lost unless already won)
  | { type: "BADGE_CLICKED" } // resolved -> collapsing (retry, skips ambient/burning/engulfed)
  | { type: "DEV_FORCE_ENGULFED" } // ambient/burning -> engulfed (silent dev/impatient-user shortcut)
  // Client-only sync from sessionStorage, dispatched once after mount (see
  // useFireGame). Not a real phase transition — bypasses the normal
  // transition guards entirely, since this is establishing where we
  // already were, not moving anywhere. Kept separate from the reducer's
  // initial state so server and client render the same thing on the first
  // pass and hydration never has real session state to disagree over.
  | { type: "HYDRATE"; phase: FireGamePhase; outcome: FireGameOutcome; everEngulfed: boolean };
