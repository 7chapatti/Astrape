"use client";
import { useEffect, useReducer } from "react";
import { fireGameReducer } from "@/lib/fire-game/reducer";
import {
  clearFireGameStorage,
  deriveBootPhase,
  readEverEngulfed,
  readOutcome,
  writeCycleComplete,
  writeEverEngulfed,
  writeOutcome,
} from "@/lib/fire-game/storage";
import type { FireGameState } from "@/lib/fire-game/types";

const DEV_SHORTCUTS = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_FIRE_DEV_KEYS === "1";

function initState(): FireGameState {
  return { phase: "ambient", outcome: null, everEngulfed: false, winExit: null, loseExit: null };
}

export function useFireGame() {
  const [state, dispatch] = useReducer(fireGameReducer, undefined, initState);

  useEffect(() => {
    dispatch({ type: "HYDRATE", phase: deriveBootPhase(), outcome: readOutcome(), everEngulfed: readEverEngulfed() });
  }, []);

  useEffect(() => {
    if (state.phase === "engulfed") writeEverEngulfed();
  }, [state.phase]);

  useEffect(() => {
    if (state.phase !== "resolved") return;
    writeCycleComplete();
    if (state.outcome) writeOutcome(state.outcome);
  }, [state.phase, state.outcome]);

  useEffect(() => {
    if (!DEV_SHORTCUTS) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat) return;
      const key = e.key.toLowerCase();

      if (e.ctrlKey && e.shiftKey && !e.altKey) {
        if (key === "f") {
          e.preventDefault();
          dispatch({ type: "DEV_FORCE_ENGULFED" });
        } else if (key === "x") {
          e.preventDefault();
          dispatch({ type: "DWELL_THRESHOLD_REACHED" });
        }
        return;
      }

      if (e.altKey && e.shiftKey && !e.ctrlKey && key === "r") {
        e.preventDefault();
        clearFireGameStorage();
        window.location.reload();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { state, dispatch };
}
