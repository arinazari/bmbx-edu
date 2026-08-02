import { CYTOBANDS, type ChromosomeIdeo, type CytoBand } from "./cytobands";

export interface ResolvedBand {
  chr: string;
  /** The query band label, e.g. "q34". */
  query: string;
  start: number;
  stop: number;
  /** Midpoint ISCN coordinate — where a breakpoint marker is drawn. */
  mid: number;
  /** The concrete sub-bands the query resolved to. */
  matched: CytoBand[];
}

export function getChromosome(chr: string): ChromosomeIdeo | undefined {
  return CYTOBANDS[chr];
}

/**
 * Resolve a possibly-imprecise band label (e.g. "q34", "q11.2", "p13") to a
 * coordinate span. Handles the common case where a report gives a coarser band
 * than the 850-band table stores (q34 -> q34.11..q34.3) by spanning all
 * matching sub-bands. Falls back to an exact match, then a parent match.
 */
export function resolveBand(chr: string, band: string): ResolvedBand | null {
  const ideo = CYTOBANDS[chr];
  if (!ideo || !band) return null;

  const norm = band.trim();

  // 1) Exact name match.
  const exact = ideo.bands.find((b) => b.name === norm);
  if (exact) {
    return span(chr, norm, [exact]);
  }

  // 2) Prefix match: query is coarser than stored bands.
  //    "q34" matches q34, q34.11, q34.12, ...  Guard against "q3" matching
  //    "q31" by requiring the next char to be "." or end-of-string.
  const prefixMatches = ideo.bands.filter((b) => {
    if (!b.name.startsWith(norm)) return false;
    const next = b.name.charAt(norm.length);
    return next === "" || next === ".";
  });
  if (prefixMatches.length) {
    return span(chr, norm, prefixMatches);
  }

  // 3) Parent match: query is finer than stored bands ("q34.13" -> "q34.1").
  //    Progressively trim trailing precision until something matches.
  let probe = norm;
  while (probe.length > 1) {
    probe = probe.replace(/\.?\d$/, "");
    const parent = ideo.bands.filter((b) => b.name.startsWith(probe));
    if (parent.length) return span(chr, norm, parent);
    if (!/\d/.test(probe)) break;
  }

  return null;
}

function span(chr: string, query: string, bands: CytoBand[]): ResolvedBand {
  const start = Math.min(...bands.map((b) => b.start));
  const stop = Math.max(...bands.map((b) => b.stop));
  return { chr, query, start, stop, mid: (start + stop) / 2, matched: bands };
}

/** CSS custom-property name for a Giemsa stain, so bands theme correctly. */
export function stainVar(stain: CytoBand["stain"]): string {
  return `var(--band-${stain})`;
}
