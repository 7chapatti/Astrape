import { LETTERFORMS } from "./letterform-data";
import type { RawGlyph } from "./letterform-types";

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  climbable?: boolean;
  invisible?: boolean;
}

export interface FireLevel {
  width: number;
  height: number;
  segments: WallSegment[];
  spawn: { x: number; y: number };
  winZone: { x: number; y: number; w: number; h: number };
  winMinSpeed: number;
  fallLockY: number;
  fallBottomY: number;
}

interface Cut {
  edge: number;
  t0: number;
  t1: number;
}

interface LetterSpec {
  char: string;
  cuts: { outer?: Cut[]; hole?: Cut[] };
  climbableOuterEdges?: number[];
}

const LETTER_SEQUENCE: LetterSpec[] = [
  {
    char: "A",
    cuts: { outer: [{ edge: 7, t0: 0, t1: 0.88 }] },
  },
  {
    char: "s",
    cuts: { 
      outer: [
        { edge: 21, t0: 0.3, t1: 1 },
        { edge: 22, t0: 0, t1: 1 }, 
        { edge: 3, t0: 0, t1: 1 },
        { edge: 23, t0: 0, t1: 1 }, 
        { edge: 24, t0: 0, t1: 1 },
        { edge: 25, t0: 0, t1: 1 } 
      ] 
    },
  },
  {
    char: "t",
    cuts: { outer: [{ edge: 14, t0: 0, t1: 1 }, { edge: 5, t0: 0, t1: 1 }] },
  },
  {
    char: "r",
    cuts: {
      outer: [
        { edge: 8, t0: 0.15, t1: 0.45 },
        { edge: 1, t0: 0.2, t1: 0.8 },
      ],
    },
    climbableOuterEdges: [2, 3, 4, 5, 6, 7, 8],
  },
  {
    char: "a",
    cuts: {
      outer: [
        { edge: 26, t0: 0, t1: 1 },
        { edge: 27, t0: 0, t1: 1 },
        { edge: 28, t0: 0, t1: 1 },
        { edge: 29, t0: 0, t1: 1 },
        { edge: 30, t0: 0, t1: 1 },
        { edge: 6, t0: 0, t1: 1 },
        { edge: 7, t0: 0, t1: 1 },
      ],
    },
  },
  {
    char: "p",
    cuts: {},
    climbableOuterEdges: [15],
  },
  {
    char: "e",
    cuts: {
      outer: [
        { edge: 24, t0: 0, t1: 1 },
        { edge: 25, t0: 0, t1: 1 },
        { edge: 26, t0: 0, t1: 1 },
        { edge: 12, t0: 0, t1: 1 },
        { edge: 13, t0: 0, t1: 1 },
        { edge: 14, t0: 0, t1: 1 },
      ],
      hole: [{ edge: 1, t0: 0, t1: 1 }],
    },
  },
];

const SCALE = 0.45;
const BASELINE_Y = 620;
const LEFT_MARGIN = 60;
const LETTER_GAP = 90;
const FALL_LOCK_MARGIN = 110;
const FALL_BOTTOM_MARGIN = 400;
const WIN_MIN_SPEED = 1.0; 

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

interface CutSeg {
  a: [number, number];
  b: [number, number];
  sourceEdge: number;
}

function cutContour(points: [number, number][], cuts: Cut[]): CutSeg[] {
  const segs: CutSeg[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i],
      b = points[i + 1];
    const edgeCuts = cuts.filter((c) => c.edge === i).sort((x, y) => x.t0 - y.t0);
    if (!edgeCuts.length) {
      segs.push({ a, b, sourceEdge: i });
      continue;
    }
    let t = 0;
    for (const c of edgeCuts) {
      if (c.t0 > t) segs.push({ a: lerp(a, b, t), b: lerp(a, b, c.t0), sourceEdge: i });
      t = Math.max(t, c.t1);
    }
    if (t < 1) segs.push({ a: lerp(a, b, t), b: lerp(a, b, 1), sourceEdge: i });
  }
  return segs;
}

export function buildLevel(): FireLevel {
  const segments: WallSegment[] = [];
  let cursorX = LEFT_MARGIN;
  let spawn = { x: 0, y: 0 };
  let winZone = { x: 0, y: 0, w: 0, h: 0 };

  for (const spec of LETTER_SEQUENCE) {
    const glyph: RawGlyph = LETTERFORMS[spec.char];
    const offsetX = cursorX;
    glyph.contours.forEach((contour, ci) => {
      const cuts = (ci === 0 ? spec.cuts.outer : spec.cuts.hole) ?? [];
      for (const seg of cutContour(contour.points, cuts)) {
        const climbable = ci === 0 && spec.climbableOuterEdges?.includes(seg.sourceEdge);
        segments.push({
          x1: offsetX + seg.a[0] * SCALE,
          y1: BASELINE_Y + seg.a[1] * SCALE,
          x2: offsetX + seg.b[0] * SCALE,
          y2: BASELINE_Y + seg.b[1] * SCALE,
          ...(climbable ? { climbable: true } : {}),
        });
      }
    });

    if (spec.char === "A") {
      const outer = glyph.contours[0].points;
      const [p2, p3] = [outer[2], outer[3]];
      spawn = {
        x: offsetX + ((p2[0] + p3[0]) / 2) * SCALE,
        y: BASELINE_Y + ((p2[1] + p3[1]) / 2) * SCALE - 30,
      };
    }

    if (spec.char === "e") {
      const outer = glyph.contours[0].points;
      const tailPoint = outer[13];
      
      winZone = {
        x: offsetX + tailPoint[0] * SCALE,
        y: BASELINE_Y + tailPoint[1] * SCALE - 60, 
        w: 100,
        h: 120,
      };

      // NEW: Invisible wall blocking the "jump over the 'e'" route
      segments.push({
          x1: offsetX + tailPoint[0] * SCALE + 10,
          y1: BASELINE_Y - 280, // Touching the invisible ceiling
          x2: offsetX + tailPoint[0] * SCALE + 10,
          y2: BASELINE_Y + tailPoint[1] * SCALE - 50, // Ends right above the win zone gap
          invisible: true,
      });
    }

    cursorX += (glyph.advance + LETTER_GAP) * SCALE;
  }

  // Ceiling marked as invisible
  segments.push({
      x1: -1000,
      y1: BASELINE_Y - 280,
      x2: cursorX + 1000,
      y2: BASELINE_Y - 280,
      invisible: true,
  });

  return {
    width: cursorX + 40,
    height: BASELINE_Y + FALL_BOTTOM_MARGIN + 80,
    segments,
    spawn,
    winZone,
    winMinSpeed: WIN_MIN_SPEED,
    fallLockY: BASELINE_Y + FALL_LOCK_MARGIN,
    fallBottomY: BASELINE_Y + FALL_BOTTOM_MARGIN,
  };
}