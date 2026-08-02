import type { HemeCase } from "../../types/case";
import type { ElnRisk } from "../../types/findings";
import { buildContext, type ClinicalContext } from "./context";
import type { Step } from "./types";

// ELN 2022 genetic risk stratification for AML, shown as a decision path.
// Key 2022 changes encoded here: FLT3-ITD allelic ratio was dropped (NPM1mut +
// FLT3-ITD is now intermediate regardless of ratio); the MDS-related
// "secondary-type" mutations became adverse (unless in a favorable-risk AML);
// CEBPA favorability is restricted to in-frame bZIP mutations.

export interface ElnFactor {
  feature: string;
  direction: ElnRisk;
  note: string;
}

export interface ElnResult {
  risk: ElnRisk;
  steps: Step[];
  factors: ElnFactor[];
  /** Prognostic modifiers that do not change the ELN bucket by themselves. */
  modifiers: string[];
  applicable: boolean;
  /** When not applicable, why (MDS-range vs APL-excluded). */
  notApplicableReason?: string;
}

const ADVERSE_CYTO_IDS = new Set([
  "t_6_9",
  "kmt2a_other",
  "bcr_abl1",
  "inv_3",
  "del_5q",
  "minus5",
  "minus7",
  "abn_17p",
  "t_8_16",
]);

export function elnRisk(c: HemeCase): ElnResult {
  const ctx = buildContext(c);
  return elnFromContext(ctx);
}

export function elnFromContext(ctx: ClinicalContext): ElnResult {
  const factors: ElnFactor[] = [];
  const modifiers: string[] = [];
  const steps: Step[] = [];

  // APL/PML::RARA is deliberately excluded from ELN genetic risk; it is managed
  // under separate APL-specific (ATRA / arsenic trioxide) guidelines.
  if (ctx.recurrent.some((m) => m.entry.id === "t_15_17")) {
    return {
      risk: "favorable",
      steps: [],
      factors: [],
      modifiers: [],
      applicable: false,
      notApplicableReason:
        "APL (PML::RARA) is not assigned an ELN genetic-risk class — it is managed under separate APL-specific (ATRA / arsenic trioxide) guidelines.",
    };
  }

  const favorableFeatures: string[] = [];
  const adverseFeatures: string[] = [];
  const intermediateFeatures: string[] = [];

  // --- Favorable-defining features ---------------------------------------
  const cbf = ctx.recurrent.filter(
    (m) => m.entry.id === "t_8_21" || m.entry.id === "inv_16",
  );
  for (const m of cbf) {
    favorableFeatures.push(m.entry.label);
    factors.push({
      feature: m.entry.label,
      direction: "favorable",
      note: "Core-binding-factor AML — favorable.",
    });
  }
  if (ctx.npm1 && !ctx.flt3ITD) {
    favorableFeatures.push("NPM1mut (no FLT3-ITD)");
    factors.push({
      feature: "Mutated NPM1 without FLT3-ITD",
      direction: "favorable",
      note: "Favorable — the benefit is lost if FLT3-ITD is present.",
    });
  }
  if (ctx.cebpaBZIP) {
    favorableFeatures.push("CEBPA bZIP");
    factors.push({
      feature: "In-frame bZIP CEBPA",
      direction: "favorable",
      note: "Favorable (only the in-frame bZIP class qualifies).",
    });
  }

  // --- Adverse-defining features -----------------------------------------
  const adverseCyto = ctx.recurrent.filter((m) => ADVERSE_CYTO_IDS.has(m.entry.id));
  for (const m of adverseCyto) {
    adverseFeatures.push(m.entry.label);
    factors.push({
      feature: m.entry.label,
      direction: "adverse",
      note: "Adverse-risk cytogenetic lesion.",
    });
  }
  if (ctx.complexKaryotype) {
    adverseFeatures.push("complex karyotype");
    factors.push({
      feature: "Complex karyotype (≥3 abnormalities)",
      direction: "adverse",
      note: "Adverse.",
    });
  }
  if (ctx.monosomalKaryotype) {
    adverseFeatures.push("monosomal karyotype");
    factors.push({
      feature: "Monosomal karyotype",
      direction: "adverse",
      note: "Adverse.",
    });
  }
  if (ctx.tp53Count >= 1) {
    adverseFeatures.push("TP53mut");
    factors.push({
      feature: "Mutated TP53",
      direction: "adverse",
      note: "Adverse regardless of allele state — the dominant risk driver.",
    });
  }
  const secondary = ctx.secondaryTypeMutations;

  // --- Intermediate-defining features ------------------------------------
  const kmt2aMllt3 = ctx.recurrent.find((m) => m.entry.id === "t_9_11");
  if (kmt2aMllt3) {
    intermediateFeatures.push(kmt2aMllt3.entry.label);
    factors.push({
      feature: kmt2aMllt3.entry.label,
      direction: "intermediate",
      note: "KMT2A::MLLT3 is intermediate (better than other KMT2A partners).",
    });
  }
  if (ctx.flt3ITD) {
    intermediateFeatures.push("FLT3-ITD");
    factors.push({
      feature: ctx.npm1 ? "NPM1mut + FLT3-ITD" : "FLT3-ITD (wild-type NPM1)",
      direction: "intermediate",
      note: "Intermediate. ELN 2022 no longer uses the ITD allelic ratio.",
    });
  }

  // --- Modifiers ---------------------------------------------------------
  if (ctx.mutatedGenes.includes("KIT") && cbf.length) {
    modifiers.push(
      "KIT mutation in core-binding-factor AML worsens outcome within the favorable group.",
    );
  }
  if (ctx.flt3TKD && !ctx.flt3ITD) {
    modifiers.push(
      "FLT3-TKD (D835) is present; it is prognostically weaker than ITD and does not define intermediate risk on its own.",
    );
  }

  // --- Precedence --------------------------------------------------------
  let risk: ElnRisk;
  // ELN 2022 keeps core-binding-factor AML favorable regardless of additional
  // cytogenetic abnormalities, and its complex-karyotype definition excludes
  // CBF/APL cases. So adverse cytogenetics / complex / monosomal do NOT downgrade
  // a CBF-AML — but TP53 mutation still dominates.
  const cytoAdverse =
    adverseCyto.length > 0 || ctx.complexKaryotype || ctx.monosomalKaryotype;
  const cbfOverridesCyto = ctx.hasCbf && cytoAdverse;
  const hardAdverse = ctx.tp53Count >= 1 || (cytoAdverse && !ctx.hasCbf);

  if (cbfOverridesCyto && ctx.tp53Count === 0) {
    modifiers.push(
      "Additional adverse cytogenetics / a complex karyotype are present, but ELN 2022 keeps core-binding-factor AML favorable (and excludes CBF from the complex-karyotype definition).",
    );
  }
  if (kmt2aMllt3 && secondary.length && !hardAdverse && !favorableFeatures.length) {
    modifiers.push(
      "t(9;11)/KMT2A::MLLT3 takes precedence over concurrent MDS-related (secondary-type) mutations under ELN 2022 — risk stays intermediate, not adverse.",
    );
  }

  if (hardAdverse) {
    risk = "adverse";
    steps.push({
      label: "Adverse-defining lesion present",
      detail: ctx.tp53Count >= 1
        ? `TP53 mutation dominates: adverse${adverseFeatures.length ? ` (also ${adverseFeatures.join(", ")})` : ""}.`
        : `Adverse cytogenetics or complex/monosomal karyotype take precedence: ${adverseFeatures.join(", ")}.`,
      decisive: true,
    });
  } else if (favorableFeatures.length) {
    risk = "favorable";
    const secondaryNote = secondary.length
      ? ` MDS-related mutations (${secondary.join(
          ", ",
        )}) are present but do not downgrade a favorable-risk AML under ELN 2022.`
      : "";
    steps.push({
      label: "Favorable-defining feature, no dominant adverse lesion",
      detail: `${favorableFeatures.join(", ")} sets favorable risk.${secondaryNote}`,
      decisive: true,
    });
    if (secondary.length) {
      for (const g of secondary)
        factors.push({
          feature: `${g} (MDS-related)`,
          direction: "favorable",
          note: "Would be adverse, but a favorable-risk AML overrides it.",
        });
    }
  } else if (secondary.length && !kmt2aMllt3) {
    risk = "adverse";
    for (const g of secondary)
      factors.push({
        feature: `${g} (MDS-related)`,
        direction: "adverse",
        note: "Adverse secondary-type mutation.",
      });
    steps.push({
      label: "MDS-related (secondary-type) mutation, no favorable lesion",
      detail: `${secondary.join(
        ", ",
      )} → adverse under ELN 2022 (adverse only outside a favorable-risk AML).`,
      decisive: true,
    });
  } else if (intermediateFeatures.length) {
    risk = "intermediate";
    steps.push({
      label: "Intermediate feature, no favorable or adverse lesion",
      detail: `${intermediateFeatures.join(", ")} → intermediate risk.`,
      decisive: true,
    });
  } else {
    risk = "intermediate";
    steps.push({
      label: "No favorable, adverse, or defining intermediate lesion",
      detail:
        "Defaults to intermediate risk (e.g. a normal karyotype without NPM1 or an adverse marker).",
      decisive: true,
    });
  }

  return {
    risk,
    steps,
    factors,
    modifiers,
    applicable: (ctx.blasts ?? 0) >= 20 || ctx.amlDefining.length > 0,
  };
}
