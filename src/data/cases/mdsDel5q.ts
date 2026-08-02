import type { HemeCase } from "../../types/case";

// The 5q- syndrome — the one deletion that is also a drug target, and a clean
// IPSS-R teaching case. The trap is the co-occurring TP53 mutation.
export const mdsDel5q: HemeCase = {
  id: "mds-del5q",
  title: "The 5q− syndrome (and its trap)",
  teachingSummary:
    "Isolated del(5q) with hypolobated megakaryocytes and preserved-to-high platelets is the 5q− syndrome — the one deletion that is predictive of lenalidomide response. Always exclude a TP53 mutation, which flips the prognosis and the drug response.",
  vignette:
    "An older adult with months of macrocytic anemia and transfusion dependence, incidentally noted to have a high-normal platelet count. Otherwise well; no cytotoxic exposures.",
  demographics: { ageBand: "60s", sex: "F" },
  cbc: { wbc: 4.8, hgb: 8.6, plt: 420, anc: 2.2, mcv: 106 },
  smear:
    "Macro-ovalocytic anemia with adequate-to-increased platelets and no significant granulocytic dysplasia on the smear.",
  differential: [
    { source: "peripheral", blasts: 0 },
    { source: "aspirate", blasts: 2 },
  ],
  cellularity: "Normocellular for age",
  marrowMorphology:
    "Erythroid hypoplasia with numerous normal-sized to small megakaryocytes showing single, round, hypolobated/non-lobated nuclei — the classic 5q− megakaryocyte. Blasts are <5%; no Auer rods; ring sideroblasts are not increased.",
  flow: {
    gate: "CD45-dim blast gate (~2%)",
    populationPercent: 2,
    markers: [
      { marker: "CD34", expression: "subset", note: "small, ~2% of events" },
      { marker: "CD117", expression: "subset" },
      { marker: "CD13", expression: "positive" },
      { marker: "CD33", expression: "positive" },
    ],
    interpretation: "No increase in blasts; no aberrant phenotype identified.",
  },
  cytogenetics: {
    karyotypeISCN: "46,XX,del(5)(q13q33)[18]/46,XX[2]",
    fish: [{ probe: "EGR1 (5q31)", result: "positive", nuclei: "160/200 (80%)" }],
    note: "Isolated interstitial 5q deletion.",
  },
  molecular: {
    method: "Myeloid NGS panel (54 genes) — specifically interrogated for TP53.",
    variants: [],
  },
  teachingDiagnosis:
    "MDS with low blasts and isolated 5q deletion (WHO5) / MDS with del(5q) (ICC). IPSS-R Low. del(5q) is predictive of lenalidomide response; TP53 was negative here — its presence would change everything.",
  teachingPoints: [
    "Isolated del(5q) + hypolobated megakaryocytes + preserved/high platelets = the 5q− syndrome.",
    "del(5q) is one of the few predictive cytogenetic findings: it forecasts response to lenalidomide.",
    "A TP53 mutation (present in a meaningful minority of del(5q) MDS) predicts lenalidomide resistance and poor outcome — test for it before treating.",
    "For IPSS-R, isolated del(5q) sits in the 'Good' cytogenetic group.",
  ],
  differentialOptions: [
    "MDS with isolated del(5q)",
    "MDS with low blasts",
    "Myeloproliferative neoplasm",
    "MDS/MPN overlap",
    "Reactive or nutritional anemia",
  ],
  pivotStage: "cytogenetics",
};
