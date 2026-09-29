"use client";
import { useEffect, useState, type Dispatch } from "react";
import dynamic from "next/dynamic";
import FireGameWinning from "./FireGameWinning";
import FireGameLosing from "./FireGameLosing";
import type { FireGameAction, FireGameState } from "@/lib/fire-game/types";

const FireGameLevel = dynamic(() => import("./FireGameLevel"), { ssr: false });
const FADE_MS = 450;
const BLACK_HOLD_MS = 700;
const TITLE_FADE_MS = 400;
const TITLE_HOLD_MS = 500;

export default function FireGameOverlay({
  state,
  dispatch,
}: {
  state: FireGameState;
  dispatch: Dispatch<FireGameAction>;
}) {
  const [blackOpacity, setBlackOpacity] = useState(0);
  const [titleOpacity, setTitleOpacity] = useState(0);

  useEffect(() => {
    if (state.phase !== "collapsing") return;
    void import("./FireGameLevel"); // warm the chunk during the black hold
    setBlackOpacity(0);
    setTitleOpacity(0);
    const raf = requestAnimationFrame(() => setBlackOpacity(1));
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setTitleOpacity(1), FADE_MS + BLACK_HOLD_MS),
      setTimeout(() => setTitleOpacity(0), FADE_MS + BLACK_HOLD_MS + TITLE_FADE_MS + TITLE_HOLD_MS),
      setTimeout(
        () => dispatch({ type: "COLLAPSE_COMPLETE" }),
        FADE_MS + BLACK_HOLD_MS + TITLE_FADE_MS + TITLE_HOLD_MS + TITLE_FADE_MS
      ),
    ];
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [state.phase, dispatch]);

  if (state.phase === "playing") {
    return (
      <div className="fixed inset-0 z-[100] bg-black" role="dialog" aria-modal="true" aria-label="Rebuild mini-game">
        <FireGameLevel
          onWin={(exit) => dispatch({ type: "REACHED_TAIL_OF_E", ...exit })}
          onLose={(exit) => dispatch({ type: "FELL_OFF_BOTTOM", ...exit })}
        />
      </div>
    );
  }

  if (state.phase === "winning") return <FireGameWinning state={state} dispatch={dispatch} />;
  if (state.phase === "losing") return <FireGameLosing state={state} dispatch={dispatch} />;

  if (state.phase !== "collapsing") return null;

  return (
    <div className="fixed inset-0 z-[100]" aria-hidden="true">
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: blackOpacity, transition: `opacity ${FADE_MS}ms ease-in-out` }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ opacity: titleOpacity, transition: `opacity ${TITLE_FADE_MS}ms ease-in-out` }}
      >
        {/* Deliberately not the site's own display font (§4.4: "bold,
           distinct from the homepage logo's font"). A real custom bold
           face can replace this system stack later without touching any
           of the transition logic. */}
        <p
          className="m-0"
          style={{
            fontFamily: '"Arial Black", "Helvetica Neue", sans-serif',
            fontWeight: 900,
            letterSpacing: "0.02em",
            fontSize: "clamp(3rem, 10vw, 7rem)",
            color: "#f4f1ea",
          }}
        >
          ASTRAPE
        </p>
      </div>
    </div>
  );
}
