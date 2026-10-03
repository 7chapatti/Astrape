export interface RawGlyph {
  advance: number;
  contours: { kind: "outer" | "hole"; points: [number, number][] }[];
}
