import type { HemeCase } from "../../types/case";

// A normal-karyotype AML where the molecular layer both classifies and risk-
// stratifies — the archetype for "cytogenetics normal, don't stop there."
export const amlNpm1Flt3: HemeCase = {
  id: "aml-npm1-flt3",
  title: "Normal karyotype, molecular pivot",
  teachingSummary:
    "A normal karyotype withholds the diagnosis; NPM1 classifies the disease, FLT3-ITD cancels the favorable prognosis, and FLT3 becomes a drug target — all from the last layer.",
  vignette:
    "A previously well adult presents with two weeks of fatigue, gum bleeding, and easy bruising. No prior cytotoxic chemotherapy or radiation, no antecedent cytopenias.",
  demographics: { ageBand: "50s", sex: "F" },
  cbc: { wbc: 42, hgb: 8.1, plt: 28, anc: 0.4, mcv: 92 },
  smear:
    "Leukoerythroblastic blood with ~55% circulating blasts: fine chromatin, high N:C ratio, and occasional cup-shaped nuclear invaginations. No definite Auer rods.",
  differential: [
    { source: "peripheral", blasts: 55 },
    { source: "aspirate", blasts: 72 },
  ],
  cellularity: "Markedly hypercellular (~95%)",
  marrowMorphology:
    "Hypercellular marrow effaced by monomorphic medium-sized blasts with dispersed chromatin and cup-like nuclear invaginations. Residual maturing myeloid and erythroid elements are markedly reduced. No increase in ring sideroblasts; megakaryocytes are scant.",
  flow: {
    gate: "CD45-dim / low-SSC blast gate (~70% of events)",
    populationPercent: 70,
    markers: [
      { marker: "CD34", expression: "subset", note: "partial, ~40% of blasts" },
      { marker: "CD117", expression: "positive" },
      { marker: "HLA-DR", expression: "positive" },
      { marker: "CD33", expression: "bright" },
      { marker: "CD13", expression: "positive" },
      { marker: "MPO", expression: "positive", note: "cytoplasmic" },
      { marker: "CD7", expression: "aberrant", note: "on the blast population" },
      { marker: "CD11b", expression: "negative" },
      { marker: "CD14", expression: "negative" },
      { marker: "CD56", expression: "negative" },
    ],
    interpretation:
      "Myeloid blasts, CD34-partial, MPO-positive, with aberrant CD7 — an abnormal myeloblast population.",
  },
  cytogenetics: {
    karyotypeISCN: "46,XX[20]",
    fish: [
      { probe: "BCR::ABL1", result: "negative" },
      { probe: "PML::RARA", result: "negative" },
      { probe: "KMT2A (11q23.3)", result: "negative" },
    ],
    note: "Normal female karyotype in all 20 metaphases.",
  },
  molecular: {
    method: "Myeloid NGS panel (54 genes) with dedicated FLT3-ITD fragment analysis.",
    variants: [
      {
        gene: "NPM1",
        hgvs: "c.860_863dup",
        protein: "p.Trp288Cysfs*12",
        vaf: 42,
        type: "insertion",
        significance: "pathogenic",
      },
      {
        gene: "FLT3",
        protein: "internal tandem duplication",
        vaf: 38,
        type: "ITD",
        significance: "pathogenic",
        note: "FLT3-ITD",
      },
      {
        gene: "DNMT3A",
        protein: "p.Arg882His",
        vaf: 45,
        type: "missense",
        significance: "pathogenic",
      },
    ],
  },
  teachingDiagnosis:
    "AML with mutated NPM1 (WHO5 and ICC). ELN 2022 intermediate risk (NPM1mut with FLT3-ITD). FLT3 is targetable; NPM1 is the MRD marker.",
  teachingPoints: [
    "Cup-shaped nuclei and CD34-partial/negativity are classic morphologic and phenotypic hints of NPM1-mutated AML.",
    "NPM1 without FLT3-ITD is ELN-favorable; the co-occurring FLT3-ITD downgrades it to intermediate (ELN 2022 no longer uses the ITD allelic ratio).",
    "DNMT3A is a DTA gene — it persists in remission, so it is a poor MRD marker. Track NPM1 instead.",
    "FLT3-ITD opens targeted therapy: midostaurin or quizartinib frontline, gilteritinib at relapse.",
  ],
  differentialOptions: [
    "AML with mutated NPM1",
    "AML, myelodysplasia-related",
    "Acute promyelocytic leukemia",
    "Mixed-phenotype acute leukemia",
    "AML with CEBPA mutation",
    "B-lymphoblastic leukemia/lymphoma",
  ],
  pivotStage: "molecular",
};
