// Regenerates src/lib/ideogram/cytobands.ts from a bundled ISCN band table.
// Usage: npm i -D ideogram && node scripts/gen-cytobands.mjs
// The ideogram package is only needed to regenerate; it is not a runtime dep.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const SRC =
  "ideogram/dist/data/bands/native/homo-sapiens-GCF_000001405.13-850.json";
const j = require(SRC);
const raw = j.chrBands;

const byChr = {};
for (const line of raw) {
  const t = line.trim().split(/\s+/);
  const [chr, arm, band, iscnStart, iscnStop, , , stain, density] = t;
  const s = stain === "gpos" && density ? "gpos" + density : stain;
  (byChr[chr] = byChr[chr] || []).push({
    name: arm + band,
    arm,
    sub: band,
    start: Number(iscnStart),
    stop: Number(iscnStop),
    stain: s,
  });
}

const chrOrder = [];
for (let i = 1; i <= 22; i++) chrOrder.push(String(i));
chrOrder.push("X", "Y");

const out = {};
for (const chr of chrOrder) {
  const bands = byChr[chr].sort((a, b) => a.start - b.start);
  const length = bands[bands.length - 1].stop;
  const firstQ = bands.find((b) => b.arm === "q");
  const centromere = firstQ ? firstQ.start : Math.round(length / 2);
  out[chr] = { chr, length, centromere, bands };
}

const header = `// AUTO-GENERATED cytoband ideogram data (do not edit by hand).
// Source: ISCN 850-band chromosome ideogram coordinates, derived from the
// eweitz/ideogram dataset (Apache-2.0), which itself derives from NCBI/UCSC
// cytoBandIdeo. Coordinates are ISCN drawing units, not base pairs.
// Regenerate via scripts/gen-cytobands.mjs.

export type Stain =
  | "gneg" | "gpos25" | "gpos50" | "gpos75" | "gpos100"
  | "acen" | "gvar" | "stalk";

export interface CytoBand {
  /** Full band label, e.g. "p36.33". */
  name: string;
  arm: "p" | "q";
  /** Sub-band portion, e.g. "36.33". */
  sub: string;
  /** ISCN drawing-coordinate start (pter = 0). */
  start: number;
  stop: number;
  stain: Stain;
}

export interface ChromosomeIdeo {
  chr: string;
  /** Total length in ISCN drawing units. */
  length: number;
  /** ISCN coordinate where the q arm begins (centromere). */
  centromere: number;
  bands: CytoBand[];
}

`;
const body =
  `export const CYTOBANDS: Record<string, ChromosomeIdeo> = ${JSON.stringify(out)};\n\n` +
  `export const CHROMOSOME_ORDER: string[] = ${JSON.stringify(chrOrder)};\n`;

fs.writeFileSync("src/lib/ideogram/cytobands.ts", header + body);
console.log("wrote src/lib/ideogram/cytobands.ts with", Object.keys(out).length, "chromosomes");
