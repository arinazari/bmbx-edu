import type { HemeCase } from "../../types/case";
import { buildContext, type ClinicalContext } from "./context";
import type {
  ClassificationResult,
  Disagreement,
  Step,
  SystemResult,
} from "./types";

// A focused, educational classifier for the AML / MDS axis — the region where
// WHO 5th edition and ICC 2022 most visibly disagree (the blast threshold for
// genetically-defined AML, and the 10–19% "gray zone"). Each engine emits an
// ordered decision path so the learner sees the reasoning, not just the label.
//
// Scope note: this models the myeloid blast-count/genetics backbone. It does not
// attempt the full lymphoid or MPN classifications.

function blastLine(ctx: ClinicalContext): Step {
  const parts: string[] = [];
  if (ctx.marrowBlasts !== null) parts.push(`${ctx.marrowBlasts}% marrow`);
  if (ctx.peripheralBlasts !== null)
    parts.push(`${ctx.peripheralBlasts}% peripheral`);
  return {
    label: `Blast count: ${parts.join(" · ") || `${ctx.blasts}%`}`,
    detail:
      "≥20% (marrow or blood) reaches AML. For the increased-blast MDS tiers, peripheral-blood blasts carry lower thresholds than marrow: the 10–19% tier (MDS-IB2 / MDS/AML) also triggers at 5–19% blood blasts, and the 5–9% tier at 2–9% blood blasts.",
  };
}

/** Increased-blast tier honoring the lower peripheral-blood thresholds. */
type BlastTier = "aml" | "tier10" | "tier5" | "low";
function mdsBlastTier(ctx: ClinicalContext): BlastTier {
  const bm = ctx.marrowBlasts ?? 0;
  const pb = ctx.peripheralBlasts ?? 0;
  if (bm >= 20 || pb >= 20) return "aml";
  if (bm >= 10 || pb >= 5) return "tier10"; // MDS-IB2 / MDS/AML
  if (bm >= 5 || pb >= 2) return "tier5"; // MDS-IB1 / MDS-EB
  return "low";
}

/**
 * Myelodysplasia-related qualifier text for the given system. WHO5 uses an
 * 8-gene MR set (no RUNX1); ICC/ELN use the 9-gene set. Both share the same
 * AML-MR cytogenetic list.
 */
function mrReason(
  ctx: ClinicalContext,
  system: "WHO5" | "ICC",
): string | null {
  const genes = system === "WHO5" ? ctx.who5MrMutations : ctx.secondaryTypeMutations;
  const bits: string[] = [];
  if (ctx.mdsRelatedCytogenetics) bits.push("an MDS-related cytogenetic lesion");
  if (genes.length) bits.push(`MDS-related mutation(s) (${genes.join(", ")})`);
  return bits.length ? bits.join(" and ") : null;
}

function lowBlastMdsSubtype(ctx: ClinicalContext): string {
  const isolated5q =
    ctx.recurrent.some((m) => m.entry.id === "del_5q") &&
    (ctx.karyotype?.clones.every((c) => c.abnormalities.length <= 2) ?? false);
  if (isolated5q) return "MDS with low blasts and isolated 5q deletion";
  if (ctx.tp53MultiHit) return "MDS with biallelic TP53 inactivation";
  if (ctx.mutatedGenes.includes("SF3B1"))
    return "MDS with low blasts and SF3B1 mutation";
  return "MDS with low blasts";
}

function classifyWHO5(ctx: ClinicalContext): SystemResult {
  const steps: Step[] = [blastLine(ctx)];
  const blasts = ctx.blasts ?? 0;

  // WHO5: AML with defining genetic abnormalities is AML at ANY blast %,
  // except AML with BCR::ABL1 and AML with CEBPA mutation, which need >=20%.
  const qualifyingFusions = ctx.amlDefining.filter(
    (m) => blasts >= (m.entry.who5Threshold ?? 0),
  );

  const definingFeatures: { label: string; note: string }[] = [];
  for (const m of qualifyingFusions) {
    definingFeatures.push({
      label: m.entry.entity,
      note:
        (m.entry.who5Threshold ?? 0) > 0
          ? `${m.entry.label}: WHO5 requires ≥20% blasts (met).`
          : `${m.entry.label}: AML-defining at any blast count.`,
    });
  }
  if (ctx.npm1) {
    definingFeatures.push({
      label: "AML with mutated NPM1",
      note: "WHO5 places no blast-percentage requirement on NPM1-mutated AML.",
    });
  }
  if (ctx.cebpaBZIP && blasts >= 20) {
    definingFeatures.push({
      label: "AML with CEBPA mutation (in-frame bZIP)",
      note: "WHO5 requires ≥20% blasts for CEBPA-defined AML (met).",
    });
  }

  if (definingFeatures.length) {
    const chosen = definingFeatures[0];
    steps.push({
      label: "AML-defining genetic abnormality present",
      detail: definingFeatures.map((f) => f.note).join(" "),
      decisive: true,
    });
    return {
      system: "WHO5",
      category: chosen.label,
      thresholdNote:
        "AML by defining genetics — the 20% blast rule is waived (except BCR::ABL1 and CEBPA).",
      steps,
    };
  }

  // No qualifying defining genetics — fall back to the blast-count backbone.
  const mr = mrReason(ctx, "WHO5");
  const tier = mdsBlastTier(ctx);

  if (tier === "aml") {
    const category = mr
      ? "AML, myelodysplasia-related"
      : "AML (defined by differentiation)";
    steps.push({
      label: "≥20% blasts, no defining genetics",
      detail: mr
        ? `Meets the AML blast threshold; ${mr} makes this myelodysplasia-related AML.`
        : "Meets the AML blast threshold; classify by line of differentiation (the former 'AML, NOS').",
      decisive: true,
    });
    return { system: "WHO5", category, thresholdNote: "≥20% blasts.", steps };
  }

  // WHO5: multi-hit TP53 defines a genetic MDS entity at ANY blast % below 20,
  // and supersedes the morphologic MDS-IB categories.
  if (ctx.tp53MultiHit) {
    steps.push({
      label: "Multi-hit TP53, <20% blasts",
      detail:
        "Multi-hit TP53 defines MDS with biallelic TP53 inactivation, which supersedes the morphologic MDS-IB tiers under WHO5.",
      decisive: true,
    });
    return {
      system: "WHO5",
      category: "MDS with biallelic TP53 inactivation",
      thresholdNote: "Genetically defined (<20% blasts, multi-hit TP53).",
      steps,
    };
  }

  if (tier === "tier10") {
    steps.push({
      label: "10–19% blasts (or 5–19% blood), no defining genetics",
      detail:
        "WHO5 keeps this in MDS as MDS with increased blasts type 2 (MDS-IB2). WHO5 has no MDS/AML category.",
      decisive: true,
    });
    return {
      system: "WHO5",
      category: "MDS with increased blasts 2 (MDS-IB2)",
      thresholdNote: "10–19% marrow (or 5–19% blood) blasts stays MDS under WHO5.",
      steps,
    };
  }
  if (tier === "tier5") {
    steps.push({
      label: "5–9% blasts (or 2–9% blood)",
      detail: "MDS with increased blasts type 1 (MDS-IB1).",
      decisive: true,
    });
    return {
      system: "WHO5",
      category: "MDS with increased blasts 1 (MDS-IB1)",
      thresholdNote: "5–9% marrow (or 2–9% blood) blasts.",
      steps,
    };
  }
  const subtype = lowBlastMdsSubtype(ctx);
  steps.push({
    label: "<5% blasts",
    detail: `Low-blast MDS; defining features point to ${subtype}.`,
    decisive: true,
  });
  return {
    system: "WHO5",
    category: subtype,
    thresholdNote: "<5% blasts (low-blast MDS).",
    steps,
  };
}

function classifyICC(ctx: ClinicalContext): SystemResult {
  const steps: Step[] = [blastLine(ctx)];
  const blasts = ctx.blasts ?? 0;
  const mr = mrReason(ctx, "ICC");
  const tier = mdsBlastTier(ctx);

  // ICC: most AML-defining recurrent genetics require >=10% blasts; BCR::ABL1
  // requires >=20%.
  const qualifyingFusions = ctx.amlDefining.filter(
    (m) => blasts >= (m.entry.iccThreshold ?? 10),
  );
  const definingFeatures: { label: string; note: string }[] = [];
  for (const m of qualifyingFusions) {
    definingFeatures.push({
      label: m.entry.entity,
      note: `${m.entry.label}: ICC requires ≥${m.entry.iccThreshold ?? 10}% blasts (met).`,
    });
  }
  if (ctx.npm1 && blasts >= 10) {
    definingFeatures.push({
      label: "AML with mutated NPM1",
      note: "ICC requires ≥10% blasts for NPM1-mutated AML (met).",
    });
  }
  if (ctx.cebpaBZIP && blasts >= 10) {
    definingFeatures.push({
      label: "AML with in-frame bZIP CEBPA mutation",
      note: "ICC requires ≥10% blasts for CEBPA-defined AML (met).",
    });
  }

  if (definingFeatures.length) {
    steps.push({
      label: "AML-defining genetic abnormality present (≥ICC threshold)",
      detail: definingFeatures.map((f) => f.note).join(" "),
      decisive: true,
    });
    return {
      system: "ICC2022",
      category: definingFeatures[0].label,
      thresholdNote: "AML by defining genetics at ≥10% (≥20% for BCR::ABL1).",
      steps,
    };
  }

  // ICC TP53 track (blast tiers honor the lower peripheral-blood thresholds).
  if (ctx.tp53Count >= 1) {
    if (tier === "aml") {
      steps.push({
        label: "TP53-mutated, ≥20% blasts",
        detail:
          "ICC recognizes AML with mutated TP53 (mutant VAF ≥10%). A single hit suffices at AML blast levels — unlike WHO5, which has no AML-TP53 entity.",
        decisive: true,
      });
      return {
        system: "ICC2022",
        category: "AML with mutated TP53",
        thresholdNote: "≥20% blasts + TP53 (VAF ≥10%).",
        steps,
      };
    }
    if (tier === "tier10") {
      steps.push({
        label: "TP53-mutated, 10–19% blasts",
        detail: "ICC classifies this as MDS/AML with mutated TP53.",
        decisive: true,
      });
      return {
        system: "ICC2022",
        category: "MDS/AML with mutated TP53",
        thresholdNote: "10–19% blasts + TP53.",
        steps,
      };
    }
    if (ctx.tp53MultiHit) {
      steps.push({
        label: "Multi-hit TP53, <10% blasts",
        detail: "ICC classifies this as MDS with mutated TP53 (multi-hit).",
        decisive: true,
      });
      return {
        system: "ICC2022",
        category: "MDS with mutated TP53",
        thresholdNote: "<10% blasts, multi-hit TP53.",
        steps,
      };
    }
  }

  if (tier === "aml") {
    steps.push({
      label: "≥20% blasts, no defining genetics",
      detail: mr
        ? `AML, myelodysplasia-related; ${mr}.`
        : "AML, classified by differentiation.",
      decisive: true,
    });
    return {
      system: "ICC2022",
      category: mr ? "AML, myelodysplasia-related" : "AML, NOS",
      thresholdNote: "≥20% blasts.",
      steps,
    };
  }
  if (tier === "tier10") {
    steps.push({
      label: "10–19% blasts (or 5–19% blood), no defining genetics",
      detail:
        "ICC's defining move: a dedicated MDS/AML category for the 10–19% gray zone, distinct from both MDS and AML. (ICC applies genetic qualifiers to MDS/AML but does not use a standalone 'myelodysplasia-related' MDS/AML label.)",
      decisive: true,
    });
    return {
      system: "ICC2022",
      category: "MDS/AML",
      thresholdNote: "10–19% marrow (or 5–19% blood) blasts → the ICC-only MDS/AML category.",
      steps,
    };
  }
  if (tier === "tier5") {
    steps.push({
      label: "5–9% blasts (or 2–9% blood)",
      detail: "MDS with excess blasts (MDS-EB).",
      decisive: true,
    });
    return {
      system: "ICC2022",
      category: "MDS with excess blasts (MDS-EB)",
      thresholdNote: "5–9% marrow (or 2–9% blood) blasts.",
      steps,
    };
  }
  const subtype = lowBlastMdsSubtype(ctx).replace(
    "biallelic TP53 inactivation",
    "mutated TP53 (multi-hit)",
  );
  steps.push({
    label: "<5% blasts",
    detail: `Low-blast MDS; features point to ${subtype}.`,
    decisive: true,
  });
  return {
    system: "ICC2022",
    category: subtype,
    thresholdNote: "<5% blasts.",
    steps,
  };
}

function findDisagreements(ctx: ClinicalContext): Disagreement[] {
  const out: Disagreement[] = [];
  const blasts = ctx.blasts ?? 0;

  // 1) Genetic AML below the ICC 10% floor.
  const subTenFusion = ctx.amlDefining.some(
    (m) => (m.entry.who5Threshold ?? 0) === 0 && blasts < (m.entry.iccThreshold ?? 10),
  );
  if (subTenFusion || (ctx.npm1 && blasts < 10)) {
    out.push({
      topic: "Blast threshold for genetically-defined AML",
      who5: "AML — no blast requirement for defining genetics.",
      icc: "Below the ICC ≥10% floor → classified as MDS with the abnormality.",
      why: "WHO5 lets the genetics define AML at any blast count; ICC keeps a 10% blast floor.",
    });
  }

  const tier = mdsBlastTier(ctx);

  // 2) The 10–19% (or 5–19% blood) gray zone without defining genetics.
  if (tier === "tier10" && !ctx.amlDefining.length && !ctx.npm1 && !ctx.tp53MultiHit) {
    out.push({
      topic: "The 10–19% blast gray zone",
      who5: "MDS with increased blasts 2 (MDS-IB2) — still MDS.",
      icc: "MDS/AML — a distinct hybrid category.",
      why: "The single most visible structural difference between the two systems.",
    });
  }

  // 3) TP53 — only where the two systems name genuinely different entities.
  if (ctx.tp53Count >= 1 && (tier === "aml" || tier === "tier10" || ctx.tp53MultiHit)) {
    out.push({
      topic: "TP53-mutated disease",
      who5:
        tier === "aml"
          ? "No dedicated AML-TP53 entity; falls to AML-MR / by differentiation."
          : "MDS with biallelic (multi-hit) TP53 inactivation — requires two hits.",
      icc:
        tier === "aml"
          ? "AML with mutated TP53 — a single hit at VAF ≥10% suffices."
          : tier === "tier10"
            ? "MDS/AML with mutated TP53 — a single hit suffices."
            : "MDS with mutated TP53 (multi-hit).",
      why: "WHO5 emphasizes multi-hit biology; ICC builds a blast-stratified TP53 ladder and accepts single hits at AML level.",
    });
  }

  // 4) RUNX1 is an AML-MR gene for ICC but not WHO5.
  const runx1SoleMr =
    ctx.mutatedGenes.includes("RUNX1") &&
    tier === "aml" &&
    !ctx.amlDefining.length &&
    !ctx.npm1 &&
    !ctx.mdsRelatedCytogenetics &&
    ctx.who5MrMutations.length === 0;
  if (runx1SoleMr) {
    out.push({
      topic: "RUNX1 as a myelodysplasia-related gene",
      who5: "AML, defined by differentiation — WHO5 excludes RUNX1 from its AML-MR gene set (and removed the 'AML with mutated RUNX1' entity).",
      icc: "AML with myelodysplasia-related gene mutations — ICC includes RUNX1.",
      why: "The two systems use different AML-MR gene lists; RUNX1 is the clearest divergence.",
    });
  }

  return out;
}

export function classifyCase(c: HemeCase): ClassificationResult {
  const ctx = buildContext(c);
  if (ctx.blasts === null) {
    const empty: SystemResult = {
      system: "WHO5",
      category: "Insufficient data",
      thresholdNote: "No blast count available.",
      steps: [
        {
          label: "No blast percentage",
          detail:
            "Classification of the AML/MDS axis needs a marrow or peripheral blast count.",
        },
      ],
    };
    return {
      who5: empty,
      icc: { ...empty, system: "ICC2022" },
      disagreements: [],
      insufficient: true,
    };
  }
  return {
    who5: classifyWHO5(ctx),
    icc: classifyICC(ctx),
    disagreements: findDisagreements(ctx),
    insufficient: false,
  };
}

export { buildContext };
