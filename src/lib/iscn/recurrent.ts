import type { Abnormality, Karyotype } from "../../types/cytogenetics";
import type { ElnRisk, FindingRole } from "../../types/findings";

// Knowledge base of recurrent cytogenetic abnormalities in myeloid (and a few
// lymphoid) neoplasms. Each entry links a structural/numerical signature to the
// gene fusion or dosage effect, the entity it defines or associates with, how
// WHO 5th ed and ICC 2022 treat it, and its ELN 2022 risk contribution.
//
// Matching is deliberately signature-based (kind + involved chromosomes, with
// optional arm/band refinement) so it is robust to the order in which
// chromosomes are written.

export interface RecurrentAbnormality {
  id: string;
  /** Canonical label, e.g. "t(9;22)(q34;q11.2)". */
  label: string;
  /** Gene fusion or dosage lesion, e.g. "BCR::ABL1", "del(5q) dosage". */
  gene: string;
  /** Entity or context this abnormality defines or points toward. */
  entity: string;
  /** Plain-English significance. */
  meaning: string;
  who5?: string;
  icc?: string;
  eln2022?: ElnRisk;
  roles: FindingRole[];
  /** True if this is an AML-defining recurrent genetic abnormality. */
  amlDefining?: boolean;
  /** Blast % floor to call AML under WHO5 (0 = none required). */
  who5Threshold?: number;
  /** Blast % floor to call AML under ICC 2022. */
  iccThreshold?: number;
  /**
   * True if this lesion is on the WHO5/ICC "myelodysplasia-related" defining
   * cytogenetic list (del(5q)/-5, -7/del(7q), del(11q), del(12p), -13/del(13q),
   * del(17p)/-17/i(17q), idic(X)(q13)). This drives the AML-MR determination.
   */
  amlMrDefining?: boolean;
  /**
   * True for lesions that merely support clonality of a myeloid process but are
   * too nonspecific to define MDS or AML-MR on their own (e.g. +8, del(20q)).
   * Deliberately NOT used to call AML-MR.
   */
  supportsClonality?: boolean;
  /** True if this is an MDS-associated / MDS-defining cytogenetic lesion. */
  mdsRelated?: boolean;
  /** Predicate over a single parsed abnormality. */
  test: (abn: Abnormality) => boolean;
}

function bandsInclude(abn: Abnormality, chr: string, prefix: string): boolean {
  return abn.breakpoints.some(
    (b) => b.chr === chr && (b.band ?? "").startsWith(prefix),
  );
}

/** Translocation between an unordered pair of chromosomes. */
function isTranslocation(abn: Abnormality, a: string, b: string): boolean {
  if (abn.kind !== "translocation") return false;
  const set = new Set(abn.chromosomes);
  return set.has(a) && set.has(b) && abn.chromosomes.length === 2;
}

function isArmChange(
  abn: Abnormality,
  kind: Abnormality["kind"],
  chr: string,
  arm: "p" | "q",
): boolean {
  if (abn.kind !== kind) return false;
  if (!abn.chromosomes.includes(chr)) return false;
  return abn.breakpoints.some((bp) => bp.chr === chr && bp.band?.startsWith(arm));
}

export const RECURRENT_ABNORMALITIES: RecurrentAbnormality[] = [
  {
    id: "t_8_21",
    label: "t(8;21)(q22;q22.1)",
    gene: "RUNX1::RUNX1T1",
    entity: "AML with RUNX1::RUNX1T1 (core-binding factor AML)",
    meaning:
      "Core-binding factor AML. Diagnostic of AML at any blast count under WHO5, and favorable-risk. Often expresses CD19 and CD56 aberrantly; watch for KIT mutations, which worsen prognosis.",
    who5: "AML with RUNX1::RUNX1T1 — AML-defining regardless of blast %.",
    icc: "AML with t(8;21)/RUNX1::RUNX1T1 — defining; ICC still lists a ≥10% blast floor.",
    eln2022: "favorable",
    roles: ["diagnostic", "prognostic", "mrd"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) => isTranslocation(a, "8", "21"),
  },
  {
    id: "inv_16",
    label: "inv(16)(p13.1q22) / t(16;16)(p13.1;q22)",
    gene: "CBFB::MYH11",
    entity: "AML with CBFB::MYH11 (core-binding factor AML)",
    meaning:
      "Core-binding factor AML, classically with abnormal eosinophils. AML-defining at any blast count under WHO5, favorable-risk. KIT mutations modulate risk.",
    who5: "AML with CBFB::MYH11 — AML-defining regardless of blast %.",
    icc: "AML with inv(16)/t(16;16) — defining; ICC lists a ≥10% blast floor.",
    eln2022: "favorable",
    roles: ["diagnostic", "prognostic", "mrd"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) =>
      (a.kind === "inversion" &&
        a.chromosomes.includes("16") &&
        bandsInclude(a, "16", "q22")) ||
      isTranslocation(a, "16", "16"),
  },
  {
    id: "t_15_17",
    label: "t(15;17)(q24.1;q21.2)",
    gene: "PML::RARA",
    entity: "Acute promyelocytic leukemia (APL)",
    meaning:
      "PML::RARA defines APL — an oncologic emergency because of DIC/coagulopathy. Highly curable with ATRA + arsenic trioxide, so recognizing it changes management within hours.",
    who5: "APL with PML::RARA — AML-defining regardless of blast %.",
    icc: "APL with t(15;17)/PML::RARA — defining.",
    // APL is excluded from ELN genetic risk stratification (separate guidelines).
    roles: ["diagnostic", "predictive", "mrd"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) => isTranslocation(a, "15", "17"),
  },
  {
    id: "t_9_11",
    label: "t(9;11)(p21.3;q23.3)",
    gene: "KMT2A::MLLT3",
    entity: "AML with KMT2A rearrangement",
    meaning:
      "The most common KMT2A (MLL) fusion in AML. Often monocytic. Intermediate risk — better than most other KMT2A partners.",
    who5: "AML with KMT2A rearrangement — AML-defining.",
    icc: "AML with t(9;11)/KMT2A::MLLT3 — defining.",
    eln2022: "intermediate",
    roles: ["diagnostic", "prognostic"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) => isTranslocation(a, "9", "11"),
  },
  {
    id: "kmt2a_other",
    label: "t(v;11q23.3) — KMT2A rearranged (non-MLLT3)",
    gene: "KMT2A::various",
    entity: "AML (or ALL) with KMT2A rearrangement",
    meaning:
      "KMT2A (11q23.3) fused to a partner other than MLLT3. AML-defining and generally adverse-risk. Frequently therapy-related (prior topoisomerase-II inhibitors).",
    who5: "AML with KMT2A rearrangement — AML-defining.",
    icc: "AML with other KMT2A rearrangement — defining.",
    eln2022: "adverse",
    roles: ["diagnostic", "prognostic"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) =>
      a.kind === "translocation" &&
      a.chromosomes.includes("11") &&
      !a.chromosomes.includes("9") &&
      bandsInclude(a, "11", "q23"),
  },
  {
    id: "t_6_9",
    label: "t(6;9)(p22.3;q34.1)",
    gene: "DEK::NUP214",
    entity: "AML with DEK::NUP214",
    meaning:
      "Often with basophilia and multilineage dysplasia; frequently FLT3-ITD positive. AML-defining and adverse-risk.",
    who5: "AML with DEK::NUP214 — AML-defining.",
    icc: "AML with t(6;9)/DEK::NUP214 — defining.",
    eln2022: "adverse",
    roles: ["diagnostic", "prognostic"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) => isTranslocation(a, "6", "9"),
  },
  {
    id: "inv_3",
    label: "inv(3)(q21.3q26.2) / t(3;3)(q21.3;q26.2)",
    gene: "GATA2 / MECOM(EVI1)",
    entity: "AML with MECOM rearrangement",
    meaning:
      "Repositions a GATA2 enhancer to activate MECOM (EVI1). Often with normal or high platelets and multilineage dysplasia. AML-defining and adverse-risk; frequently monosomy 7.",
    who5: "AML with MECOM rearrangement — AML-defining.",
    icc: "AML with inv(3)/t(3;3)/MECOM — defining.",
    eln2022: "adverse",
    roles: ["diagnostic", "prognostic"],
    amlDefining: true,
    who5Threshold: 0,
    iccThreshold: 10,
    test: (a) =>
      (a.kind === "inversion" &&
        a.chromosomes.includes("3") &&
        bandsInclude(a, "3", "q26")) ||
      (isTranslocation(a, "3", "3") && bandsInclude(a, "3", "q26")),
  },
  {
    id: "bcr_abl1",
    label: "t(9;22)(q34.1;q11.2)",
    gene: "BCR::ABL1",
    entity: "Philadelphia chromosome — CML, Ph+ ALL, or AML with BCR::ABL1",
    meaning:
      "The Philadelphia chromosome. Context decides the entity: chronic-phase CML, Ph+ B-ALL, or (rarely) de novo AML with BCR::ABL1. Predictive of response to tyrosine-kinase inhibitors (imatinib and successors).",
    who5: "AML with BCR::ABL1 — AML-defining (a diagnosis of exclusion vs CML blast crisis).",
    icc: "AML with BCR::ABL1 — defining, with a ≥20% blast requirement.",
    eln2022: "adverse",
    roles: ["diagnostic", "predictive", "mrd"],
    amlDefining: true,
    who5Threshold: 20,
    iccThreshold: 20,
    test: (a) => isTranslocation(a, "9", "22"),
  },
  {
    id: "del_5q",
    label: "del(5q)",
    gene: "del(5q) dosage (CSNK1A1, RPS14, ...)",
    entity: "MDS with del(5q); or an adverse marker within complex AML",
    meaning:
      "Isolated interstitial del(5q) defines a favorable MDS subtype that responds to lenalidomide (a predictive marker). Within a complex karyotype, or in AML, del(5q) is an adverse feature.",
    who5: "MDS with low blasts and isolated 5q deletion (5q- syndrome).",
    icc: "MDS with del(5q).",
    eln2022: "adverse",
    roles: ["diagnostic", "prognostic", "predictive"],
    mdsRelated: true,
    amlMrDefining: true,
    test: (a) => isArmChange(a, "deletion", "5", "q"),
  },
  {
    id: "minus5",
    label: "-5",
    gene: "chr5 loss",
    entity: "Monosomy 5 (adverse)",
    meaning:
      "Whole loss of chromosome 5 is an adverse lesion, almost always part of a complex/monosomal karyotype — distinct from isolated del(5q)/5q- syndrome, and never a favorable, lenalidomide-responsive entity.",
    who5: "Contributes to AML-MR / complex categories.",
    icc: "Contributes to complex-karyotype / adverse categories.",
    eln2022: "adverse",
    roles: ["prognostic"],
    mdsRelated: true,
    amlMrDefining: true,
    test: (a) => a.kind === "loss" && a.chromosomes.includes("5"),
  },
  {
    id: "minus7",
    label: "-7 / del(7q)",
    gene: "chr7 dosage",
    entity: "MDS / AML with monosomy 7 or 7q deletion",
    meaning:
      "Monosomy 7 or del(7q) is a recurrent poor-risk lesion across MDS and AML and a feature of germline predisposition (e.g. GATA2, SAMD9/SAMD9L in younger patients).",
    who5: "MDS-defining cytogenetic abnormality; adverse in AML.",
    icc: "MDS-defining; adverse in AML.",
    eln2022: "adverse",
    roles: ["diagnostic", "prognostic"],
    mdsRelated: true,
    amlMrDefining: true,
    test: (a) =>
      (a.kind === "loss" && a.chromosomes.includes("7")) ||
      isArmChange(a, "deletion", "7", "q"),
  },
  {
    id: "abn_17p",
    label: "-17 / del(17p) / i(17)(q10)",
    gene: "TP53 locus (17p13)",
    entity: "TP53-region loss",
    meaning:
      "Loss of 17p removes one TP53 allele. Combined with a TP53 mutation it produces a multi-hit state — the most adverse molecular context in myeloid neoplasia and a red flag for the transplant conversation.",
    who5: "Contributes to complex/TP53 categories.",
    icc: "Contributes to TP53-mutated categories (with molecular).",
    eln2022: "adverse",
    roles: ["prognostic"],
    mdsRelated: true,
    amlMrDefining: true,
    test: (a) =>
      (a.kind === "loss" && a.chromosomes.includes("17")) ||
      isArmChange(a, "deletion", "17", "p") ||
      (a.kind === "isochromosome" &&
        a.chromosomes.includes("17") &&
        bandsInclude(a, "17", "q")),
  },
  {
    id: "trisomy8",
    label: "+8",
    gene: "chr8 gain",
    entity: "Trisomy 8 (non-specific)",
    meaning:
      "One of the most common clonal abnormalities in myeloid neoplasms but not disease-defining on its own. Intermediate risk in AML; supports clonality in MDS.",
    who5: "Not MDS-defining in isolation under WHO5, and not on the AML-MR cytogenetic list (the classic +8/del(20q)/−Y exclusion).",
    icc: "Supports MDS diagnosis in the right context; not AML-MR-defining.",
    eln2022: "intermediate",
    roles: ["diagnostic"],
    supportsClonality: true,
    test: (a) => a.kind === "gain" && a.chromosomes.includes("8"),
  },
  {
    id: "del_20q",
    label: "del(20q)",
    gene: "chr20q dosage",
    entity: "del(20q) (MDS-associated)",
    meaning:
      "A recurrent MDS-associated deletion. Not sufficient alone to diagnose MDS without morphologic dysplasia, but supports clonality. Explicitly excluded from the AML-MR cytogenetic list as too nonspecific.",
    who5: "Supports but does not define MDS; not AML-MR-defining.",
    icc: "Supports MDS; not AML-MR-defining.",
    eln2022: "intermediate",
    roles: ["diagnostic"],
    supportsClonality: true,
    test: (a) => isArmChange(a, "deletion", "20", "q"),
  },
  {
    id: "t_8_16",
    label: "t(8;16)(p11.2;p13.3)",
    gene: "KAT6A::CREBBP",
    entity: "AML with t(8;16) / KAT6A::CREBBP",
    meaning:
      "A rare recurring translocation, often with monocytic differentiation, erythrophagocytosis, and hemophagocytosis. Added to the ELN 2022 adverse-risk cytogenetic list.",
    who5: "A rare recurring translocation (not a core AML-defining entity).",
    icc: "A rare recurring translocation.",
    eln2022: "adverse",
    roles: ["prognostic"],
    test: (a) => isTranslocation(a, "8", "16"),
  },
];

export interface RecurrentMatch {
  abnormality: Abnormality;
  entry: RecurrentAbnormality;
}

/** Identify every recurrent abnormality present in a parsed karyotype. */
export function identifyRecurrent(k: Karyotype): RecurrentMatch[] {
  const matches: RecurrentMatch[] = [];
  const seen = new Set<string>();
  for (const clone of k.clones) {
    for (const abn of clone.abnormalities) {
      for (const entry of RECURRENT_ABNORMALITIES) {
        if (entry.test(abn)) {
          const key = `${entry.id}:${abn.raw}`;
          if (seen.has(key)) continue;
          seen.add(key);
          matches.push({ abnormality: abn, entry });
        }
      }
    }
  }
  return matches;
}
