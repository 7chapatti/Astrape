"use client";
import type { FireGameState } from "@/lib/fire-game/types";

/**
 * Badge slot at the top right of the header logo. Renders nothing at all —
 * no placeholder, nothing in the DOM — until a win or loss has actually
 * happened this session (§1, §3). The win state deliberately draws the
 * same fire-gradient "©" (same colors, same flicker) that FireGameWinning
 * paints in its final frame, so the hand-off from the animation to this
 * resting badge is seamless — see FireGameWinning's ignite() for the
 * canvas equivalent of this same look.
 */
export default function FireBadge({ state, onClick }: { state: FireGameState; onClick: () => void }) {
  if (state.phase !== "resolved") return null;

  const isWin = state.outcome === "won";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isWin ? "Replay the hidden game" : "Retry the hidden game"}
      className="ml-1.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0"
    >
      {isWin ? (
        <span
          aria-hidden
          className="animate-fire-flicker text-[15px] font-bold leading-none"
          style={{
            backgroundImage: "linear-gradient(180deg, #ffe9a8 0%, #ff9a3d 45%, #e13b1c 90%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0 4px rgba(255,130,40,.85))",
          }}
        >
          ©
        </span>
      ) : (
        // Deliberately plain — not fire, not copyright-shaped (§1, §3).
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-mute hover:text-ink"
        >
          <path d="M3 12a9 9 0 1 0 3-6.7" strokeLinecap="round" />
          <path d="M3 4v5h5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
