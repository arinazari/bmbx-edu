import type { HemeCase } from "../../types/case";

// A case engineered to sit in the 10–19% blast gray zone with MDS-related
// mutations — the clearest illustration of the WHO5 vs ICC structural split.
export const mdsAmlGrayZone: HemeCase = {
  id: "mds-aml-grayzone",
  title: "The 10–19% gray zone",
  teachingSummary:
    "Fourteen percent blasts with MDS-related mutations: WHO5 keeps it MDS (MDS-IB2), ICC calls it MDS/AML. Same biology, different label — and the label can change trial eligibility and whether 'AML' therapy is on the table.",
  vignette:
    "An older adult with several months of progressive macrocytic anemia and transfusion dependence, plus incidental leukopenia. No prior chemotherapy or radiation and no known toxic exposures.",
  demographics: { ageBand: "70s", sex: "M" },
  cbc: { wbc: 2.6, hgb: 8.4, plt: 62, anc: 0.9, mcv: 104 },
  smear:
    "Oval macrocytes, occasional hypogranular neutrophils, and rare pseudo-Pelger–Huët forms; ~2% circulating blasts.",
  differential: [
    { source: "peripheral", blasts: 2 },
    { source: "aspirate", blasts: 14 },
  ],
  cellularity: "Hypercellular for age (~70%)",
  marrowMorphology:
    "Hypercellular marrow with trilineage dysplasia: hypolobated and separated-nuclei megakaryocytes, dyserythropoiesis with nuclear irregularity, and hypogranular maturing myeloid forms. Blasts are ~14% without Auer rods.",
  flow: {
    gate: "CD45-dim blast gate (~13% of events)",
    populationPercent: 13,
    markers: [
      { marker: "CD34", expression: "positive" },
      { marker: "CD117", expression: "positive" },
      { marker: "HLA-DR", expression: "positive" },
      { marker: "CD13", expression: "positive" },
      { marker: "CD33", expression: "positive" },
      { marker: "MPO", expression: "subset", note: "dim/partial" },
      { marker: "CD7", expression: "aberrant", note: "subset of blasts" },
      { marker: "CD56", expression: "negative" },
    ],
    interpretation:
      "An increased CD34-positive myeloblast population with aberrant CD7, on a background of dysplastic maturation.",
  },
  cytogenetics: {
    karyotypeISCN: "46,XY,del(20)(q11.2q13.3)[12]/46,XY[8]",
    fish: [
      { probe: "PML::RARA", result: "negative" },
      { probe: "RUNX1::RUNX1T1", result: "negative" },
      { probe: "-7/del(7q)", result: "negative" },
    ],
    note: "Isolated del(20q) — supports clonality but is not AML-defining.",
  },
  molecular: {
    method: "Myeloid NGS panel (54 genes).",
    variants: [
      {
        gene: "ASXL1",
        protein: "p.Gly646Trpfs*12",
        vaf: 40,
        type: "frameshift",
        significance: "pathogenic",
      },
      {
        gene: "SRSF2",
        protein: "p.Pro95His",
        vaf: 44,
        type: "missense",
        significance: "pathogenic",
      },
      {
        gene: "RUNX1",
        protein: "p.Arg201*",
        vaf: 20,
        type: "nonsense",
        significance: "pathogenic",
      },
    ],
  },
  teachingDiagnosis:
    "WHO5: MDS with increased blasts 2 (MDS-IB2) — WHO5 does not append a 'myelodysplasia-related' qualifier to MDS entities. ICC: MDS/AML. IPSS-R High risk; the secondary-type mutations (ASXL1/SRSF2/RUNX1) make this biologically adverse.",
  teachingPoints: [
    "10–19% marrow blasts is the single most visible WHO5 vs ICC disagreement: MDS-IB2 vs the ICC-only MDS/AML category.",
    "ASXL1, SRSF2, and RUNX1 are MDS-related 'secondary-type' mutations — ELN counts them as adverse in AML, and they anchor risk here.",
    "del(20q) supports a clonal myeloid process but does not by itself define MDS or AML.",
    "For MDS-range disease, IPSS-R (and IPSS-M) drive the transplant and treatment conversation, not ELN.",
  ],
  differentialOptions: [
    "MDS with increased blasts (MDS-IB2)",
    "MDS/AML",
    "AML, myelodysplasia-related",
    "MDS with low blasts",
    "Chronic myelomonocytic leukemia",
    "Aplastic anemia",
  ],
  pivotStage: "molecular",
};
