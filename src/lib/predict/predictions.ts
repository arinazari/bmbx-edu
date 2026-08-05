import type { HemeCase, StageId } from "../../types/case";
import { flagAberrancies } from "../flow/teaching";
import { parseKaryotype } from "../iscn/parser";
import { identifyRecurrent, RECURRENT_ABNORMALITIES } from "../iscn/recurrent";
import { GENES } from "../genes/genes";

// Before each reveal, the learner predicts what the next layer will show. This
// keeps a confident learner working instead of re-affirming the same diagnosis,
// and it converts confidence into something falsifiable.
//
// Every question is derived from the case's own data plus plausible
// distractors, so pasted reports get predictions with no authoring required.

export interface PredictionOption {
  id: string;
  label: string;
  correct: boolean;
}

export interface Prediction {
  /** Stage where the question is asked (before the reveal). */
  askAt: StageId;
  /** Stage whose reveal resolves it. */
  resolveAt: StageId;
  question: string;
  hint: string;
  options: PredictionOption[];
}

/** Deterministic shuffle so option order is stable across renders/sessions. */
function stableShuffle<T extends { id: string }>(items: T[], seed: string): T[] {
  const score = (s: string) => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  };
  return [...items].sort((a, b) => score(seed + a.id) - score(seed + b.id));
}

function assemble(
  correct: string[],
  distractors: string[],
  seed: string,
  maxCorrect = 4,
  maxTotal = 7,
): PredictionOption[] {
  const seen = new Set<string>();
  const pick: PredictionOption[] = [];
  for (const label of correct) {
    const key = label.toLowerCase();
    if (seen.has(key) || pick.length >= maxCorrect) continue;
    seen.add(key);
    pick.push({ id: label, label, correct: true });
  }
  for (const label of distractors) {
    const key = label.toLowerCase();
    if (seen.has(key) || pick.length >= maxTotal) continue;
    seen.add(key);
    pick.push({ id: label, label, correct: false });
  }
  return stableShuffle(pick, seed);
}

// --- Flow -----------------------------------------------------------------

const FLOW_DISTRACTOR_POOL = [
  "CD34 positive",
  "HLA-DR positive",
  "aberrant CD19",
  "aberrant CD56",
  "aberrant CD7",
  "CD14 positive (monocytic)",
  "TdT positive",
  "MPO negative",
  "surface CD3 positive",
  "CD10 positive",
];

function flowPrediction(c: HemeCase): Prediction | null {
  if (!c.flow || c.flow.markers.length === 0) return null;

  const flags = flagAberrancies(c.flow);
  const correct: string[] = [];

  // The auto-flagged aberrancies are exactly the discriminating features.
  for (const f of flags) {
    const e = f.expression;
    if (e === "negative") correct.push(`${f.marker} negative`);
    else if (e === "bright") correct.push(`${f.marker} bright`);
    else correct.push(`aberrant ${f.marker}`);
  }

  // A couple of salient lineage anchors, so it is not purely aberrancy-spotting.
  const read = (name: string) =>
    c.flow!.markers.find((m) => m.marker.toUpperCase() === name.toUpperCase());
  const mpo = read("MPO");
  if (mpo && (mpo.expression === "bright" || mpo.expression === "positive")) {
    correct.push(mpo.expression === "bright" ? "MPO bright" : "MPO positive");
  }
  const cd14 = read("CD14");
  if (cd14 && cd14.expression !== "negative") correct.push("CD14 positive (monocytic)");

  if (correct.length === 0) correct.push("No aberrant phenotype");

  const lower = new Set(correct.map((s) => s.toLowerCase()));
  const distractors = FLOW_DISTRACTOR_POOL.filter((d) => {
    if (lower.has(d.toLowerCase())) return false;
    // Don't offer "X positive" as a distractor when "X negative" is correct
    // in a way that makes it a giveaway pair — that's exactly the teaching
    // contrast we want, so keep it. Only drop exact duplicates.
    return true;
  });

  return {
    askAt: "morphology",
    resolveAt: "flow",
    question: "What do you expect flow to show on the population of interest?",
    hint: "Pick every feature you expect. This is your phenotype call before you see it.",
    options: assemble(correct, distractors, c.id + "flow"),
  };
}

// --- Cytogenetics ---------------------------------------------------------

function cytogeneticsPrediction(c: HemeCase): Prediction | null {
  const iscn = c.cytogenetics?.karyotypeISCN;
  if (!iscn) return null;

  const k = parseKaryotype(iscn);
  const found = identifyRecurrent(k);
  const correct: string[] = [];

  for (const m of found) correct.push(`${m.entry.label} · ${m.entry.gene}`);
  if (found.length === 0) {
    correct.push(
      k.clones.every((cl) => cl.isNormal)
        ? "Normal karyotype"
        : "A clonal abnormality with no classic recurrent fusion",
    );
  }
  if (k.complexKaryotype) correct.push("Complex karyotype (≥3 abnormalities)");

  const foundIds = new Set(found.map((m) => m.entry.id));
  const distractors = RECURRENT_ABNORMALITIES.filter((e) => !foundIds.has(e.id))
    .map((e) => `${e.label} · ${e.gene}`)
    .concat(k.clones.every((cl) => cl.isNormal) ? [] : ["Normal karyotype"]);

  return {
    askAt: "flow",
    resolveAt: "cytogenetics",
    question: "What do you expect the karyotype to show?",
    hint: "Your phenotype should predict the genetics. Commit before you look.",
    options: assemble(correct, distractors, c.id + "cyto", 3, 6),
  };
}

// --- Molecular ------------------------------------------------------------

function molecularPrediction(c: HemeCase): Prediction | null {
  const variants = c.molecular?.variants ?? [];
  if (!c.molecular) return null;

  const correct = variants.map((v) =>
    v.type === "ITD" ? `${v.gene} (ITD)` : v.gene.toUpperCase(),
  );
  if (correct.length === 0) correct.push("No reportable mutation");

  const present = new Set(
    variants.map((v) => v.gene.toUpperCase()),
  );
  const distractors = GENES.filter((g) => !present.has(g.gene.toUpperCase()))
    .map((g) => g.gene)
    .concat(variants.length ? ["No reportable mutation"] : []);

  return {
    askAt: "cytogenetics",
    resolveAt: "molecular",
    question: "Which mutations do you expect the NGS panel to report?",
    hint: "Think about what co-occurs with what you have seen so far.",
    options: assemble(correct, distractors, c.id + "mol", 4, 7),
  };
}

export function buildPredictions(c: HemeCase): Prediction[] {
  return [
    flowPrediction(c),
    cytogeneticsPrediction(c),
    molecularPrediction(c),
  ].filter((p): p is Prediction => p !== null);
}

export function predictionAskedAt(
  predictions: Prediction[],
  stage: StageId,
): Prediction | undefined {
  return predictions.find((p) => p.askAt === stage);
}

export function predictionResolvedAt(
  predictions: Prediction[],
  stage: StageId,
): Prediction | undefined {
  return predictions.find((p) => p.resolveAt === stage);
}

export interface PredictionScore {
  hits: PredictionOption[];
  misses: PredictionOption[];
  falseAlarms: PredictionOption[];
  /** True when every correct option was picked and nothing wrong was. */
  perfect: boolean;
  /** True when at least one correct option was picked. */
  anyHit: boolean;
}

export function scorePrediction(
  prediction: Prediction,
  picks: string[],
): PredictionScore {
  const picked = new Set(picks);
  const hits = prediction.options.filter((o) => o.correct && picked.has(o.id));
  const misses = prediction.options.filter((o) => o.correct && !picked.has(o.id));
  const falseAlarms = prediction.options.filter(
    (o) => !o.correct && picked.has(o.id),
  );
  return {
    hits,
    misses,
    falseAlarms,
    perfect: misses.length === 0 && falseAlarms.length === 0 && hits.length > 0,
    anyHit: hits.length > 0,
  };
}
