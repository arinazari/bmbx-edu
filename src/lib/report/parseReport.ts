import type {
  CBC,
  CellDifferential,
  FlowMarker,
  HemeCase,
  MarkerExpression,
  Variant,
} from "../../types/case";
import { GENES } from "../genes/genes";
import { MARKERS } from "../flow/markers";

// Best-effort extraction of structured findings from a pasted, de-identified
// report. This is intentionally forgiving: it pulls what it confidently can
// (karyotype, blast %, CBC, flow markers, named gene variants, FISH) and leaves
// the rest for the user to complete in the structured editor. It never guesses
// a diagnosis.

export interface ParsedReport {
  draft: Partial<HemeCase>;
  /** What the parser recognized, for a transparent "here's what I found" view. */
  notes: string[];
}

const GENE_SYMBOLS = new Set(GENES.map((g) => g.gene.toUpperCase()));
const MARKER_NAMES = MARKERS.map((m) => m.marker);

/** Find the most karyotype-looking substring in the text. */
function extractKaryotype(text: string): string | null {
  // An ISCN clone starts with a modal number then a sex constitution.
  const re = /\b(3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9])\s*,\s*(XX|XY|X|XXY|XYY|XXX)\b[^\n\r;]*/gi;
  const matches = [...text.matchAll(re)].map((m) => m[0].trim());
  if (!matches.length) return null;
  // Prefer the longest (most complete) clone string; stitch adjacent clones
  // separated by "/".
  const idx = text.search(re);
  if (idx >= 0) {
    // Grab from the first modal number to the end of a bracketed clone series.
    const tail = text.slice(idx);
    const seriesMatch = tail.match(
      /^(?:[0-9~]+\s*,\s*[XY][^/\n\r]*(?:\[[^\]]*\])?\s*\/?\s*)+/,
    );
    if (seriesMatch) return seriesMatch[0].trim().replace(/\s+/g, "");
  }
  return matches.sort((a, b) => b.length - a.length)[0];
}

function extractBlasts(text: string): CellDifferential[] {
  const diffs: CellDifferential[] = [];
  const marrow = text.match(
    /(?:marrow|aspirate|bone marrow)[^.\n]*?blasts?[^.\n]*?(\d{1,3}(?:\.\d+)?)\s*%/i,
  );
  const marrow2 = text.match(/blasts?[^.\n]*?(\d{1,3}(?:\.\d+)?)\s*%[^.\n]*?(?:marrow|aspirate)/i);
  const pb = text.match(
    /(?:peripheral|blood|circulating)[^.\n]*?blasts?[^.\n]*?(\d{1,3}(?:\.\d+)?)\s*%/i,
  );
  const generic = text.match(/blasts?[^.\n]*?(\d{1,3}(?:\.\d+)?)\s*%/i);

  const mVal = marrow?.[1] ?? marrow2?.[1];
  if (mVal !== undefined) {
    diffs.push({ source: "aspirate", blasts: Number(mVal) });
  } else if (generic && !pb) {
    diffs.push({ source: "aspirate", blasts: Number(generic[1]) });
  }
  if (pb) diffs.push({ source: "peripheral", blasts: Number(pb[1]) });
  return diffs;
}

function extractCBC(text: string): CBC | undefined {
  const cbc: CBC = {};
  const num = (re: RegExp): number | undefined => {
    const m = text.match(re);
    return m ? Number(m[1]) : undefined;
  };
  cbc.wbc = num(/\bWBC[^0-9\-]*([\d.]+)/i);
  cbc.hgb = num(/\b(?:Hb|Hgb|hemoglobin)[^0-9\-]*([\d.]+)/i);
  cbc.plt = num(/\b(?:PLT|platelets?)[^0-9\-]*([\d.]+)/i);
  cbc.anc = num(/\bANC[^0-9\-]*([\d.]+)/i);
  cbc.mcv = num(/\bMCV[^0-9\-]*([\d.]+)/i);
  const defined = Object.values(cbc).some((v) => v !== undefined);
  return defined ? cbc : undefined;
}

function expressionNear(text: string, index: number, marker: string): MarkerExpression {
  const window = text.slice(index, index + marker.length + 24).toLowerCase();
  if (/\bdim\b/.test(window)) return "dim";
  if (/\bbright\b/.test(window)) return "bright";
  if (/\bpartial\b|\bsubset\b/.test(window)) return "subset";
  if (/negative|\bneg\b|\(-\)|\b-\b/.test(window)) return "negative";
  if (/aberrant/.test(window)) return "aberrant";
  if (/positive|\bpos\b|\(\+\)|\bexpress/.test(window)) return "positive";
  return "positive";
}

function extractFlow(text: string): FlowMarker[] {
  const found: FlowMarker[] = [];
  const seen = new Set<string>();
  for (const marker of MARKER_NAMES) {
    const re = new RegExp(`\\b${marker.replace(/[-]/g, "\\-?")}\\b`, "i");
    const m = re.exec(text);
    if (m && !seen.has(marker.toUpperCase())) {
      seen.add(marker.toUpperCase());
      found.push({ marker, expression: expressionNear(text, m.index, marker) });
    }
  }
  return found;
}

function extractVariants(text: string): Variant[] {
  const variants: Variant[] = [];
  const seen = new Set<string>();
  // Token scan for gene symbols, then look for nearby p./c. changes, VAF, ITD.
  const tokenRe = /\b([A-Z][A-Z0-9]{1,6})\b/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(text)) !== null) {
    const sym = m[1].toUpperCase();
    if (!GENE_SYMBOLS.has(sym) || seen.has(sym)) continue;
    const window = text.slice(m.index, m.index + 80);
    const negated = /\b(?:no|negative|not detected|wild-?type|wt)\b/i.test(
      text.slice(Math.max(0, m.index - 20), m.index + 40),
    );
    const isMutationContext =
      /mut|c\.\d|p\.[A-Z]|ITD|TKD|insertion|deletion|frameshift|VAF|%|positive|detected|rearrang/i.test(
        window,
      );
    if (negated || !isMutationContext) continue;
    seen.add(sym);
    const protein = window.match(/p\.[A-Za-z0-9*_]+/)?.[0];
    const hgvs = window.match(/c\.[0-9A-Za-z_>+*]+/)?.[0];
    const vaf = window.match(/(?:VAF[^0-9]*)?(\d{1,3}(?:\.\d+)?)\s*%/i)?.[1];
    const itd = /ITD/i.test(window);
    const tkd = /TKD|D835/i.test(window);
    variants.push({
      gene: sym,
      protein,
      hgvs,
      vaf: vaf ? Number(vaf) : undefined,
      type: itd ? "ITD" : tkd ? "TKD" : undefined,
    });
  }
  return variants;
}

export function parseReport(text: string): ParsedReport {
  const notes: string[] = [];
  const draft: Partial<HemeCase> = {};

  const karyotype = extractKaryotype(text);
  if (karyotype) {
    draft.cytogenetics = { karyotypeISCN: karyotype };
    notes.push(`Karyotype: ${karyotype}`);
  }

  const diffs = extractBlasts(text);
  if (diffs.length) {
    draft.differential = diffs;
    notes.push(
      diffs.map((d) => `${d.source} blasts ${d.blasts}%`).join("; "),
    );
  }

  const cbc = extractCBC(text);
  if (cbc) {
    draft.cbc = cbc;
    notes.push(
      "CBC: " +
        Object.entries(cbc)
          .filter(([, v]) => v !== undefined)
          .map(([k, v]) => `${k} ${v}`)
          .join(", "),
    );
  }

  const flow = extractFlow(text);
  if (flow.length) {
    draft.flow = { markers: flow };
    notes.push(`Flow markers: ${flow.map((f) => `${f.marker}(${f.expression})`).join(", ")}`);
  }

  const variants = extractVariants(text);
  if (variants.length) {
    draft.molecular = { variants };
    notes.push(
      `Variants: ${variants.map((v) => `${v.gene}${v.type ? ` ${v.type}` : ""}`).join(", ")}`,
    );
  }

  if (notes.length === 0) {
    notes.push(
      "Nothing recognized automatically. Enter the findings in the structured fields below.",
    );
  }

  return { draft, notes };
}
