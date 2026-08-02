import type { HemeCase } from "../../types/case";
import { buildContext } from "./context";

// IPSS-M is a weighted model (Bernard et al., 2022) whose precise score requires
// the published per-gene coefficients and the official calculator. Rather than
// ship an approximate number that could be trusted clinically, this exposes the
// *direction* each molecular feature pushes the IPSS-M score, which is the
// teaching point: which mutations move risk, and which way.

export type Direction = "adverse" | "favorable" | "context";

export interface IpssmModifier {
  feature: string;
  direction: Direction;
  note: string;
}

// Direction of effect for the IPSS-M main-effect features (simplified to the
// well-established directions).
const ADVERSE_GENES: Record<string, string> = {
  TP53: "Multi-hit TP53 is the single strongest adverse weight in IPSS-M.",
  FLT3: "FLT3 (ITD/TKD) increases the IPSS-M score.",
  RUNX1: "Adverse main-effect gene.",
  ASXL1: "Adverse main-effect gene.",
  EZH2: "Adverse main-effect gene.",
  SRSF2: "Adverse main-effect gene.",
  U2AF1: "Adverse main-effect gene.",
  NRAS: "Adverse main-effect gene.",
  KRAS: "Adverse main-effect gene.",
  STAG2: "Adverse main-effect gene.",
  BCOR: "Adverse (residual/main-effect) gene.",
  IDH2: "Adverse main-effect gene.",
  DNMT3A: "Adverse main-effect gene.",
  NPM1: "In MDS, NPM1 mutation carries an adverse IPSS-M weight.",
  MLL: "KMT2A partial tandem duplication is adverse.",
  KMT2A: "A KMT2A-PTD is adverse in IPSS-M.",
  ETV6: "Adverse main-effect gene.",
  CBL: "Adverse residual gene.",
};

export function ipssmModifiers(c: HemeCase): IpssmModifier[] {
  const ctx = buildContext(c);
  const mods: IpssmModifier[] = [];

  if (ctx.tp53MultiHit) {
    mods.push({
      feature: "TP53 (multi-hit)",
      direction: "adverse",
      note: ADVERSE_GENES.TP53,
    });
  } else if (ctx.tp53Count >= 1) {
    mods.push({
      feature: "TP53 (single hit)",
      direction: "adverse",
      note: "TP53 is adverse; a single hit weighs less than multi-hit.",
    });
  }

  for (const g of ctx.mutatedGenes) {
    if (g === "TP53") continue;
    if (g === "SF3B1") {
      mods.push({
        feature: "SF3B1",
        direction: "context",
        note: "Favorable in the SF3B1-mutated, low-risk phenotype — but its benefit is cancelled by co-occurring adverse lesions (del(5q), RUNX1, others).",
      });
      continue;
    }
    const note = ADVERSE_GENES[g];
    if (note) mods.push({ feature: g, direction: "adverse", note });
  }

  return mods;
}
