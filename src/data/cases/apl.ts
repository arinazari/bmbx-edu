import type { HemeCase } from "../../types/case";

// The can't-miss diagnosis. Flow makes the call before cytogenetics returns —
// the pedagogical point is that recognizing the phenotype triggers treatment.
export const apl: HemeCase = {
  id: "apl",
  title: "The can't-miss coagulopathy",
  teachingSummary:
    "CD34-negative, HLA-DR-negative blasts with bright MPO name acute promyelocytic leukemia at the flow stage — start ATRA on suspicion, before the PML::RARA result comes back.",
  vignette:
    "A middle-aged adult presents with a week of fatigue, mucosal bleeding, and prolonged oozing from a venipuncture site. Fibrinogen is low and D-dimer is markedly elevated; PT/aPTT are prolonged.",
  demographics: { ageBand: "30s", sex: "M" },
  cbc: { wbc: 1.6, hgb: 8.8, plt: 22, anc: 0.3, mcv: 90 },
  smear:
    "Abnormal promyelocytes with heavy azurophilic granulation and reniform/bilobed nuclei; occasional cells contain bundles of Auer rods (faggot cells). Schistocytes are absent.",
  differential: [
    { source: "peripheral", blasts: 20, note: "counting abnormal promyelocytes as blast-equivalents" },
    { source: "aspirate", blasts: 85 },
  ],
  cellularity: "Hypercellular",
  marrowMorphology:
    "Sheets of hypergranular abnormal promyelocytes with folded/bilobed nuclei and faggot cells. Normal maturation is obliterated.",
  flow: {
    gate: "High-side-scatter promyelocyte gate",
    populationPercent: 80,
    markers: [
      { marker: "CD34", expression: "negative" },
      { marker: "HLA-DR", expression: "negative" },
      { marker: "CD117", expression: "positive" },
      { marker: "CD33", expression: "bright", note: "homogeneous" },
      { marker: "CD13", expression: "subset", note: "heterogeneous" },
      { marker: "MPO", expression: "bright" },
      { marker: "CD15", expression: "dim" },
      { marker: "CD2", expression: "aberrant", note: "subset" },
      { marker: "CD11b", expression: "negative" },
    ],
    interpretation:
      "CD34-negative, HLA-DR-negative population with bright, homogeneous MPO — the classic APL immunophenotype.",
  },
  cytogenetics: {
    karyotypeISCN: "46,XY,t(15;17)(q24;q21)[19]/46,XY[1]",
    fish: [
      { probe: "PML::RARA", result: "positive", nuclei: "182/200 nuclei (91%)" },
    ],
    note: "Dual-fusion PML::RARA confirmed by FISH.",
  },
  molecular: {
    method: "RT-PCR for PML::RARA (positive); myeloid NGS for co-mutations.",
    variants: [
      {
        gene: "FLT3",
        protein: "internal tandem duplication",
        vaf: 30,
        type: "ITD",
        significance: "pathogenic",
        note: "FLT3-ITD — common in APL, does not remove the favorable prognosis with ATRA/ATO.",
      },
    ],
  },
  teachingDiagnosis:
    "Acute promyelocytic leukemia with PML::RARA (WHO5 and ICC). APL is excluded from ELN genetic risk stratification and is managed under separate APL-specific (ATRA / arsenic trioxide) guidelines. An oncologic emergency because of the DIC-type coagulopathy.",
  teachingPoints: [
    "HLA-DR-negative + CD34-negative + bright MPO is APL until proven otherwise.",
    "The coagulopathy kills before the leukemia does — start ATRA the moment APL is suspected, do not wait for confirmation.",
    "Confirm with PML::RARA by FISH/RT-PCR; the t(15;17) karyotype and dual-fusion FISH seal it.",
    "FLT3-ITD is common in APL but does not change the favorable outlook under ATRA + arsenic trioxide.",
  ],
  differentialOptions: [
    "Acute promyelocytic leukemia",
    "AML with mutated NPM1",
    "AML with maturation",
    "Acute monocytic leukemia",
    "AML, myelodysplasia-related",
  ],
  pivotStage: "flow",
};
