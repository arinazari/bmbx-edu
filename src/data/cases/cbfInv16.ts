import type { HemeCase } from "../../types/case";

// Core-binding-factor AML you can predict from the slide and the flow before
// the karyotype returns: abnormal eosinophils plus aberrant CD2/CD56.
export const cmlCbfInv16: HemeCase = {
  id: "cbf-inv16",
  title: "Flow aberrancy that predicts the karyotype",
  teachingSummary:
    "Abnormal marrow eosinophils plus aberrant CD2 and CD56 on myelomonocytic blasts point to inv(16) before cytogenetics confirms it — a favorable, AML-defining core-binding-factor leukemia.",
  vignette:
    "A young adult presents with fever and fatigue. The CBC shows leukocytosis with circulating blasts and a strikingly increased eosinophil fraction.",
  demographics: { ageBand: "20s", sex: "M" },
  cbc: { wbc: 55, hgb: 9.0, plt: 40, anc: 1.0, mcv: 88 },
  smear:
    "Medium blasts with monocytoid nuclear contours; increased eosinophils, some with abnormal basophilic (purple-violet) granules.",
  differential: [
    { source: "peripheral", blasts: 30 },
    { source: "aspirate", blasts: 45 },
  ],
  cellularity: "Hypercellular",
  marrowMorphology:
    "Myelomonocytic blasts with increased marrow eosinophils showing abnormal immature eosinophilic granules admixed with basophilic granules — the inv(16) eosinophil. Monocytic differentiation is evident.",
  flow: {
    gate: "CD45-dim blast gate with a monocytic tail",
    populationPercent: 45,
    markers: [
      { marker: "CD34", expression: "positive" },
      { marker: "CD117", expression: "positive" },
      { marker: "HLA-DR", expression: "positive" },
      { marker: "CD13", expression: "positive" },
      { marker: "CD33", expression: "bright" },
      { marker: "CD64", expression: "positive", note: "monocytic" },
      { marker: "CD14", expression: "subset" },
      { marker: "MPO", expression: "positive" },
      { marker: "CD2", expression: "aberrant" },
      { marker: "CD56", expression: "aberrant" },
    ],
    interpretation:
      "Myelomonocytic blasts with aberrant CD2 and CD56 — a phenotype that should prompt a hunt for inv(16).",
  },
  cytogenetics: {
    karyotypeISCN: "46,XY,inv(16)(p13.1q22)[18]/46,XY[2]",
    fish: [{ probe: "CBFB (16q22)", result: "positive", nuclei: "170/200 (85%)" }],
    note: "CBFB rearrangement confirmed.",
  },
  molecular: {
    method: "Myeloid NGS panel (54 genes).",
    variants: [
      {
        gene: "KIT",
        protein: "p.Asp816Val",
        vaf: 15,
        type: "missense",
        significance: "pathogenic",
        note: "D816V — modulates risk within core-binding-factor AML.",
      },
      {
        gene: "NRAS",
        protein: "p.Gly12Asp",
        vaf: 18,
        type: "missense",
        significance: "pathogenic",
      },
    ],
  },
  teachingDiagnosis:
    "AML with CBFB::MYH11 (core-binding-factor AML), WHO5 and ICC. ELN favorable; the KIT D816V mutation worsens outcome within the favorable group. CBFB::MYH11 is an excellent MRD target.",
  teachingPoints: [
    "Abnormal marrow eosinophils and aberrant CD2/CD56 are the tell for inv(16) — predictable from morphology and flow.",
    "Core-binding-factor AML is AML-defining at any blast count and is ELN-favorable.",
    "A KIT mutation (especially D816V) is prognostic within CBF-AML and refines the otherwise favorable risk.",
    "Track CBFB::MYH11 by RT-qPCR for measurable residual disease.",
  ],
  differentialOptions: [
    "AML with CBFB::MYH11 (inv(16))",
    "Acute monocytic leukemia",
    "AML with mutated NPM1",
    "AML with RUNX1::RUNX1T1",
    "Chronic myelomonocytic leukemia",
  ],
  pivotStage: "cytogenetics",
};
