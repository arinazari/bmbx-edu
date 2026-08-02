import type { HemeCase } from "../../types/case";
import type { Clone } from "../../types/cytogenetics";
import { buildContext } from "./context";
import type { Step } from "./types";

// IPSS-R (Revised International Prognostic Scoring System, Greenberg 2012) for
// MDS. Fully specified and deterministic — implemented exactly, with the point
// contribution of each variable exposed so the learner sees the arithmetic.

export type IpssrCytoCategory =
  | "Very Good"
  | "Good"
  | "Intermediate"
  | "Poor"
  | "Very Poor";

const CYTO_POINTS: Record<IpssrCytoCategory, number> = {
  "Very Good": 0,
  Good: 1,
  Intermediate: 2,
  Poor: 3,
  "Very Poor": 4,
};

export type IpssrRisk =
  | "Very Low"
  | "Low"
  | "Intermediate"
  | "High"
  | "Very High";

export interface IpssrResult {
  applicable: boolean;
  reason?: string;
  cytoCategory?: IpssrCytoCategory;
  total?: number;
  risk?: IpssrRisk;
  steps: Step[];
}

interface AbnFlags {
  count: number;
  minusY: boolean;
  del11q: boolean;
  del5q: boolean;
  del12p: boolean;
  del20q: boolean;
  del7q: boolean;
  plus8: boolean;
  plus19: boolean;
  i17q: boolean;
  minus7: boolean;
  abn3q: boolean;
}

function abnFlags(clone: Clone): AbnFlags {
  const A = clone.abnormalities;
  const has = (pred: (a: (typeof A)[number]) => boolean) => A.some(pred);
  const isDel = (chr: string, arm: "p" | "q") => (a: (typeof A)[number]) =>
    a.kind === "deletion" &&
    a.chromosomes.includes(chr) &&
    a.breakpoints.some((b) => b.band?.startsWith(arm));
  return {
    count: A.length,
    minusY: has((a) => a.kind === "loss" && a.chromosomes.includes("Y")),
    del11q: has(isDel("11", "q")),
    del5q: has(isDel("5", "q")),
    del12p: has(isDel("12", "p")),
    del20q: has(isDel("20", "q")),
    del7q: has(isDel("7", "q")),
    plus8: has((a) => a.kind === "gain" && a.chromosomes.includes("8")),
    plus19: has((a) => a.kind === "gain" && a.chromosomes.includes("19")),
    i17q: has(
      (a) => a.kind === "isochromosome" && a.chromosomes.includes("17"),
    ),
    minus7: has((a) => a.kind === "loss" && a.chromosomes.includes("7")),
    abn3q: has(
      (a) =>
        a.chromosomes.includes("3") &&
        a.breakpoints.some((b) => b.band?.startsWith("q2")),
    ),
  };
}

/** Map a parsed karyotype to the five IPSS-R cytogenetic risk groups. */
export function ipssrCytoCategory(
  clones: Clone[],
): { category: IpssrCytoCategory; rationale: string } {
  const abnormalClones = clones.filter((c) => !c.isNormal);
  if (abnormalClones.length === 0) {
    return { category: "Good", rationale: "Normal karyotype → Good." };
  }
  // Use the clone with the most abnormalities as the operative clone.
  const clone = abnormalClones.reduce((a, b) =>
    b.abnormalities.length > a.abnormalities.length ? b : a,
  );
  const f = abnFlags(clone);
  const n = f.count;

  if (n >= 4) return { category: "Very Poor", rationale: "Complex, >3 abnormalities → Very Poor." };
  if (n === 3) return { category: "Poor", rationale: "Complex, exactly 3 abnormalities → Poor." };

  if (n === 2) {
    // A double containing both del(5q) and −7/del(7q) satisfies both rules; the
    // published table leaves the overlap ambiguous, so the poor lesion wins.
    if (f.minus7 || f.del7q)
      return { category: "Poor", rationale: "Double including −7/del(7q) → Poor." };
    if (f.del5q) return { category: "Good", rationale: "Double including del(5q) → Good." };
    return { category: "Intermediate", rationale: "Two independent abnormalities → Intermediate." };
  }

  // Single abnormality.
  if (f.minusY) return { category: "Very Good", rationale: "Isolated −Y → Very Good." };
  if (f.del11q) return { category: "Very Good", rationale: "Isolated del(11q) → Very Good." };
  if (f.del5q) return { category: "Good", rationale: "Isolated del(5q) → Good." };
  if (f.del12p) return { category: "Good", rationale: "Isolated del(12p) → Good." };
  if (f.del20q) return { category: "Good", rationale: "Isolated del(20q) → Good." };
  if (f.del7q) return { category: "Intermediate", rationale: "Isolated del(7q) → Intermediate." };
  if (f.plus8) return { category: "Intermediate", rationale: "Isolated +8 → Intermediate." };
  if (f.plus19) return { category: "Intermediate", rationale: "Isolated +19 → Intermediate." };
  if (f.i17q) return { category: "Intermediate", rationale: "Isolated i(17q) → Intermediate." };
  if (f.minus7) return { category: "Poor", rationale: "Isolated −7 → Poor." };
  if (f.abn3q) return { category: "Poor", rationale: "inv(3)/t(3q)/del(3q) → Poor." };
  return { category: "Intermediate", rationale: "Other single clone → Intermediate." };
}

function blastPoints(marrowBlasts: number): { points: number; note: string } {
  if (marrowBlasts <= 2) return { points: 0, note: "≤2% → 0" };
  if (marrowBlasts < 5) return { points: 1, note: ">2–<5% → 1" };
  if (marrowBlasts <= 10) return { points: 2, note: "5–10% → 2" };
  return { points: 3, note: ">10% → 3" };
}

function hbPoints(hgb: number): { points: number; note: string } {
  if (hgb >= 10) return { points: 0, note: "≥10 g/dL → 0" };
  if (hgb >= 8) return { points: 1, note: "8–<10 g/dL → 1" };
  return { points: 1.5, note: "<8 g/dL → 1.5" };
}

function pltPoints(plt: number): { points: number; note: string } {
  if (plt >= 100) return { points: 0, note: "≥100 → 0" };
  if (plt >= 50) return { points: 0.5, note: "50–<100 → 0.5" };
  return { points: 1, note: "<50 → 1" };
}

function ancPoints(anc: number): { points: number; note: string } {
  if (anc >= 0.8) return { points: 0, note: "≥0.8 → 0" };
  return { points: 0.5, note: "<0.8 → 0.5" };
}

function riskFromTotal(total: number): IpssrRisk {
  if (total <= 1.5) return "Very Low";
  if (total <= 3) return "Low";
  if (total <= 4.5) return "Intermediate";
  if (total <= 6) return "High";
  return "Very High";
}

export function ipssr(c: HemeCase): IpssrResult {
  const ctx = buildContext(c);
  const steps: Step[] = [];

  // IPSS-R is defined and validated on the BONE MARROW blast percentage; a
  // peripheral value is a different quantity and must not be substituted.
  const blasts = ctx.marrowBlasts;
  if (blasts === null) {
    return {
      applicable: false,
      reason: "IPSS-R requires a bone-marrow (aspirate) blast percentage.",
      steps,
    };
  }
  if (blasts >= 20) {
    return {
      applicable: false,
      reason: "IPSS-R applies to MDS; ≥20% blasts is AML.",
      steps,
    };
  }
  const cbc = c.cbc;
  if (!cbc || cbc.hgb === undefined || cbc.plt === undefined) {
    return {
      applicable: false,
      reason: "IPSS-R needs hemoglobin and platelet values (and ANC).",
      steps,
    };
  }

  const cyto = ctx.karyotype
    ? ipssrCytoCategory(ctx.karyotype.clones)
    : { category: "Good" as IpssrCytoCategory, rationale: "No karyotype provided; assuming Good." };
  const cytoP = CYTO_POINTS[cyto.category];
  steps.push({
    label: `Cytogenetics: ${cyto.category} → ${cytoP}`,
    detail: cyto.rationale,
  });

  const bp = blastPoints(blasts);
  steps.push({ label: `Marrow blasts ${blasts}% → ${bp.points}`, detail: bp.note });

  const hp = hbPoints(cbc.hgb);
  steps.push({ label: `Hemoglobin ${cbc.hgb} → ${hp.points}`, detail: hp.note });

  const pp = pltPoints(cbc.plt);
  steps.push({ label: `Platelets ${cbc.plt} → ${pp.points}`, detail: pp.note });

  const anc = cbc.anc ?? 1.0;
  const ap = ancPoints(anc);
  steps.push({
    label: `ANC ${cbc.anc ?? "n/a"} → ${ap.points}`,
    detail: cbc.anc === undefined ? "ANC not provided; assumed ≥0.8 (0)." : ap.note,
  });

  const total =
    cytoP + bp.points + hp.points + pp.points + ap.points;
  const risk = riskFromTotal(total);
  steps.push({
    label: `Total ${total} → ${risk}`,
    detail:
      "Cut-points: ≤1.5 Very Low · >1.5–3 Low · >3–4.5 Intermediate · >4.5–6 High · >6 Very High.",
    decisive: true,
  });

  return {
    applicable: true,
    cytoCategory: cyto.category,
    total,
    risk,
    steps,
  };
}
