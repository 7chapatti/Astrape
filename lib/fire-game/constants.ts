// How long a visitor needs to have the hero actually on-screen and the tab
// actually focused before the fire starts (§1: "~10 minutes of dwell
// time"). Drop this to a few seconds locally when eyeballing the burn
// animation — the dev shortcut (Ctrl+Shift+F) skips it entirely, but
// sometimes it's useful to watch the buildup itself rather than skip past it.
export const DWELL_THRESHOLD_S = 600;

// How long the visible "burning" spread takes once the dwell threshold
// hits — a short, escalating sequence, not the 10 minutes itself (§4.1).
export const BURNING_DURATION_S = 50;

// Ambient strike cadence, in seconds, as a [min, max] range. While burning,
// strikes come noticeably faster than the normal ambient cadence — each one
// is a new ember taking hold, so the flurry itself communicates "this is
// escalating" without any UI saying so.
export const AMBIENT_STRIKE_INTERVAL_S: [number, number] = [9, 15];
export const BURNING_STRIKE_INTERVAL_S: [number, number] = [3, 6];

// Fire climbs to cover the bottom half of the hero wordmark by the time
// "burning" completes, then holds there through "engulfed" (per project
// notes: small fires build up until half the logo, no further).
export const MAX_LOGO_BURN = 0.5;

// Cap on simultaneous ground-level embers so a long burning window doesn't
// clutter the tree line indefinitely.
export const MAX_BURN_EMBERS = 7;
