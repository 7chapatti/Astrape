"use client";
import { useEffect, useReducer } from "react";
import { fireGameReducer } from "@/lib/fire-game/reducer";
import { deriveBootPhase, readEverEngulfed, readOutcome } from "@/lib/fire-game/storage";
import type { FireGameState } from "@/lib/fire-game/types";

function initState(): FireGameState {
  return { phase: "ambient", outcome: null, everEngulfed: false, winExit: null, loseExit: null };
}

export function useFireGame() {
  const [state, dispatch] = useReducer(fireGameReducer, undefined, initState);

  useEffect(() => {
    dispatch({ type: "HYDRATE", phase: deriveBootPhase(), outcome: readOutcome(), everEngulfed: readEverEngulfed() });
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!e.ctrlKey || !e.shiftKey) return;
      const key = e.key.toLowerCase();
      
      // Forces game to jump instantly to "engulfed"
      if (key === "f") {
        e.preventDefault();
        dispatch({ type: "DEV_FORCE_ENGULFED" });
      }
      // Triggers the 10-minute fire buildup immediately
      if (key === "x") {
        e.preventDefault();
        dispatch({ type: "DWELL_THRESHOLD_REACHED" });
      }
      // HARD RESET: Wipes local storage and refreshes so you can test the fire again
      if (key === "r") {
        e.preventDefault();
        localStorage.removeItem("astrape-fire-outcome");
        localStorage.removeItem("astrape-ever-engulfed");
        window.location.reload();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return { state, dispatch };
}