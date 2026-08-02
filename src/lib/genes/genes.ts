import type { GeneInfo } from "../../types/knowledge";

// Gene knowledge base for myeloid neoplasms. Each entry tags the clinical roles
// a lesion plays (diagnostic / prognostic / predictive / MRD) and, where
// relevant, its ELN 2022 risk contribution and targeted-therapy hooks. This is
// the layer that connects a molecular result to a management decision.
//
// The "secondary-type" / MDS-related mutations that ELN 2022 counts as adverse
// in AML are: ASXL1, BCOR, EZH2, RUNX1, SF3B1, SRSF2, STAG2, U2AF1, ZRSR2.

export const GENES: GeneInfo[] = [
  {
    gene: "NPM1",
    fullName: "Nucleophosmin 1",
    category: "nucleophosmin",
    whatItDoes:
      "A nucleolar chaperone; leukemic mutations force cytoplasmic mislocalization (NPM1c).",
    roles: [
      {
        role: "diagnostic",
        detail:
          "AML-defining under WHO5 at any blast count; ICC still applies a ≥10% blast floor.",
      },
      {
        role: "prognostic",
        detail: "Favorable when FLT3-ITD is absent; that benefit is lost with FLT3-ITD.",
      },
      {
        role: "mrd",
        detail:
          "An excellent, stable MRD target by RT-qPCR; post-treatment clearance guides transplant decisions.",
      },
      {
        role: "predictive",
        detail: "Sensitizes to menin inhibitors (e.g. revumenib) in relapsed disease.",
      },
    ],
    eln2022: {
      risk: "favorable",
      context: "Favorable only when FLT3-ITD is absent; NPM1mut + FLT3-ITD is intermediate.",
    },
    mrdMarker: true,
    primerEntity: "npm1",
  },
  {
    gene: "FLT3",
    fullName: "FMS-like tyrosine kinase 3",
    category: "signaling",
    whatItDoes: "A receptor tyrosine kinase driving progenitor proliferation.",
    roles: [
      {
        role: "prognostic",
        detail:
          "ITD worsens prognosis, especially with wild-type NPM1; TKD (D835) is prognostically weaker.",
      },
      {
        role: "predictive",
        detail:
          "Targetable: midostaurin (frontline, FLT3-mut), quizartinib (FLT3-ITD, frontline), gilteritinib (relapsed/refractory FLT3-mut).",
      },
      {
        role: "mrd",
        detail: "ITD can be tracked by NGS, but clonal instability limits it as a sole MRD marker.",
      },
    ],
    eln2022: {
      risk: "intermediate",
      context:
        "ELN 2022 removed the allelic-ratio distinction: FLT3-ITD is intermediate (favorable only via an accompanying favorable lesion). Note: FLT3-ITD does not upgrade to adverse on its own.",
    },
    targetable: [
      { drug: "Midostaurin", note: "Frontline with 7+3 for FLT3-mutated AML." },
      { drug: "Quizartinib", note: "Frontline for FLT3-ITD AML." },
      { drug: "Gilteritinib", note: "Relapsed/refractory FLT3-mutated AML." },
    ],
    primerEntity: "flt3",
  },
  {
    gene: "CEBPA",
    fullName: "CCAAT/enhancer-binding protein alpha",
    category: "transcription",
    whatItDoes: "A master myeloid-differentiation transcription factor.",
    roles: [
      {
        role: "diagnostic",
        detail: "In-frame bZIP-domain mutations define an AML entity under WHO5/ICC.",
      },
      {
        role: "prognostic",
        detail:
          "Favorable specifically for bZIP in-frame mutations (biallelic or single); consider germline CEBPA.",
      },
    ],
    eln2022: {
      risk: "favorable",
      context: "Favorable for in-frame bZIP mutations. Other CEBPA mutations do not qualify.",
    },
    primerEntity: "cebpa",
  },
  {
    gene: "RUNX1",
    fullName: "RUNX family transcription factor 1",
    category: "transcription",
    whatItDoes: "A core-binding-factor subunit essential for definitive hematopoiesis.",
    roles: [
      {
        role: "prognostic",
        detail: "Somatic mutation is an ELN 2022 adverse (secondary-type) marker.",
      },
      {
        role: "diagnostic",
        detail:
          "Germline RUNX1 defines familial platelet disorder with myeloid predisposition — check a non-hematopoietic sample.",
      },
    ],
    eln2022: {
      risk: "adverse",
      context: "Somatic RUNX1 mutation is adverse; suspected germline needs confirmatory testing.",
    },
    primerEntity: "runx1",
  },
  {
    gene: "TP53",
    fullName: "Tumor protein p53",
    category: "tumor_suppressor",
    whatItDoes: "The guardian of the genome — cell-cycle arrest and apoptosis in response to stress.",
    roles: [
      {
        role: "diagnostic",
        detail:
          "Multi-hit TP53 defines MDS with biallelic TP53 inactivation (WHO5). ICC adds a blast-stratified TP53 ladder; at AML level (MDS/AML or AML with mutated TP53) a single TP53 mutation at VAF ≥10% suffices — multi-hit is not required, and WHO5 has no TP53-defined AML entity.",
      },
      {
        role: "prognostic",
        detail:
          "The most adverse molecular context in myeloid neoplasia; dominates IPSS-M and ELN risk.",
      },
      {
        role: "predictive",
        detail:
          "Poor and non-durable responses to intensive chemo and hypomethylating agents; frames the transplant conversation honestly.",
      },
    ],
    eln2022: { risk: "adverse", context: "TP53 mutation is adverse regardless of allele state." },
    primerEntity: "tp53",
  },
  {
    gene: "ASXL1",
    fullName: "ASXL transcriptional regulator 1",
    category: "epigenetic",
    whatItDoes: "A polycomb-associated chromatin regulator.",
    roles: [
      {
        role: "prognostic",
        detail: "ELN 2022 adverse (secondary-type) marker; common in CMML and secondary AML.",
      },
    ],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "asxl1",
  },
  {
    gene: "SRSF2",
    fullName: "Serine and arginine rich splicing factor 2",
    category: "splicing",
    whatItDoes: "A spliceosome component; mutations alter exon recognition.",
    roles: [
      {
        role: "diagnostic",
        detail:
          "Strongly associated with CMML; part of the MDS-related mutation set for AML classification.",
      },
      { role: "prognostic", detail: "ELN 2022 adverse (secondary-type) marker." },
    ],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "srsf2",
  },
  {
    gene: "SF3B1",
    fullName: "Splicing factor 3b subunit 1",
    category: "splicing",
    whatItDoes: "A U2-spliceosome component controlling branch-point recognition.",
    roles: [
      {
        role: "diagnostic",
        detail:
          "Defines MDS with low blasts and SF3B1 mutation — the ring-sideroblast entity, a favorable MDS subtype.",
      },
      {
        role: "prognostic",
        detail:
          "Favorable in MDS (IPSS-M), but counts as an adverse secondary-type marker when it appears in AML.",
      },
    ],
    eln2022: {
      risk: "adverse",
      context: "In AML, SF3B1 is an adverse secondary-type marker — opposite to its favorable role in MDS.",
    },
    primerEntity: "sf3b1",
  },
  {
    gene: "U2AF1",
    fullName: "U2 small nuclear RNA auxiliary factor 1",
    category: "splicing",
    whatItDoes: "A 3'-splice-site recognition factor.",
    roles: [{ role: "prognostic", detail: "ELN 2022 adverse (secondary-type) marker." }],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "u2af1",
  },
  {
    gene: "IDH1",
    fullName: "Isocitrate dehydrogenase 1",
    category: "epigenetic",
    whatItDoes:
      "A metabolic enzyme; the R132 neomorph makes 2-hydroxyglutarate, deranging DNA/histone methylation.",
    roles: [
      {
        role: "predictive",
        detail: "Targetable with ivosidenib (and olutasidenib); a differentiating agent.",
      },
      { role: "mrd", detail: "Trackable by NGS/ddPCR as a response marker." },
    ],
    targetable: [
      { drug: "Ivosidenib", note: "IDH1-R132 inhibitor; frontline (with azacitidine) and relapsed." },
      { drug: "Olutasidenib", note: "IDH1 inhibitor for relapsed/refractory disease." },
    ],
    primerEntity: "idh1",
  },
  {
    gene: "IDH2",
    fullName: "Isocitrate dehydrogenase 2",
    category: "epigenetic",
    whatItDoes: "The mitochondrial isocitrate dehydrogenase; R140/R172 neomorphs make 2-HG.",
    roles: [
      { role: "predictive", detail: "Targetable with enasidenib." },
      { role: "mrd", detail: "Trackable by NGS/ddPCR." },
    ],
    targetable: [{ drug: "Enasidenib", note: "IDH2 inhibitor for relapsed/refractory AML." }],
    primerEntity: "idh2",
  },
  {
    gene: "DNMT3A",
    fullName: "DNA methyltransferase 3 alpha",
    category: "epigenetic",
    whatItDoes: "A de-novo DNA methyltransferase.",
    roles: [
      {
        role: "prognostic",
        detail:
          "A common founding lesion and a frequent clonal-hematopoiesis mutation; persists in remission, so a poor MRD marker.",
      },
    ],
    notes:
      "A classic DTA gene (DNMT3A/TET2/ASXL1): often persists after treatment, so do not use it to call molecular MRD positivity.",
    primerEntity: "dnmt3a",
  },
  {
    gene: "TET2",
    fullName: "Tet methylcytosine dioxygenase 2",
    category: "epigenetic",
    whatItDoes: "Catalyzes 5-methylcytosine oxidation in active demethylation.",
    roles: [
      {
        role: "prognostic",
        detail: "A common founder/CHIP lesion; a DTA gene that is unreliable for MRD.",
      },
    ],
    notes: "Part of the DTA trio that persists in remission.",
    primerEntity: "tet2",
  },
  {
    gene: "KIT",
    fullName: "KIT proto-oncogene, receptor tyrosine kinase",
    category: "signaling",
    whatItDoes: "The stem-cell-factor receptor tyrosine kinase.",
    roles: [
      {
        role: "prognostic",
        detail:
          "In core-binding-factor AML (t(8;21), inv(16)), a KIT mutation (esp. D816) upgrades risk within the favorable group.",
      },
    ],
    primerEntity: "kit",
  },
  {
    gene: "NRAS",
    fullName: "NRAS proto-oncogene",
    category: "signaling",
    whatItDoes: "A RAS-pathway GTPase driving proliferation.",
    roles: [
      {
        role: "prognostic",
        detail: "Often a subclonal, later event; context-dependent and frequently transient.",
      },
    ],
    primerEntity: "ras",
  },
  {
    gene: "KRAS",
    fullName: "KRAS proto-oncogene",
    category: "signaling",
    whatItDoes: "A RAS-pathway GTPase.",
    roles: [
      { role: "prognostic", detail: "Cooperating proliferative lesion; often subclonal." },
    ],
    primerEntity: "ras",
  },
  {
    gene: "PTPN11",
    fullName: "Protein tyrosine phosphatase non-receptor type 11 (SHP2)",
    category: "signaling",
    whatItDoes: "A phosphatase amplifying RAS/MAPK signaling.",
    roles: [
      {
        role: "prognostic",
        detail: "RAS-pathway cooperating lesion; germline drives Noonan syndrome/JMML.",
      },
    ],
    primerEntity: "ptpn11",
  },
  {
    gene: "WT1",
    fullName: "WT1 transcription factor",
    category: "transcription",
    whatItDoes: "A zinc-finger transcription factor with context-dependent roles.",
    roles: [
      { role: "prognostic", detail: "Mutations associated with inferior outcome in AML." },
      {
        role: "mrd",
        detail: "Over-expression is a broad (non-specific) MRD/response marker when no better target exists.",
      },
    ],
    primerEntity: "wt1",
  },
  {
    gene: "DDX41",
    fullName: "DEAD-box helicase 41",
    category: "other",
    whatItDoes: "An RNA helicase involved in RNA processing and innate immunity.",
    roles: [
      {
        role: "diagnostic",
        detail:
          "Germline DDX41 predisposes to late-onset MDS/AML — pursue germline testing; it changes donor selection.",
      },
      { role: "prognostic", detail: "Often a relatively favorable course despite germline predisposition." },
    ],
    notes: "A somatic second-hit (often R525H) on a germline background is the classic pattern.",
    primerEntity: "ddx41",
  },
  {
    gene: "BCOR",
    fullName: "BCL6 corepressor",
    category: "epigenetic",
    whatItDoes: "A transcriptional corepressor.",
    roles: [{ role: "prognostic", detail: "ELN 2022 adverse (secondary-type) marker." }],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "bcor",
  },
  {
    gene: "STAG2",
    fullName: "Stromal antigen 2",
    category: "cohesin",
    whatItDoes: "A cohesin-complex subunit governing chromatid cohesion and gene regulation.",
    roles: [{ role: "prognostic", detail: "ELN 2022 adverse (secondary-type) marker." }],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "stag2",
  },
  {
    gene: "EZH2",
    fullName: "Enhancer of zeste homolog 2",
    category: "epigenetic",
    whatItDoes: "The catalytic H3K27 methyltransferase of PRC2.",
    roles: [{ role: "prognostic", detail: "ELN 2022 adverse (secondary-type) marker." }],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "ezh2",
  },
  {
    gene: "ZRSR2",
    fullName: "Zinc finger CCCH-type, RNA binding motif and serine/arginine rich 2",
    category: "splicing",
    whatItDoes: "A minor-spliceosome component.",
    roles: [{ role: "prognostic", detail: "ELN 2022 adverse (secondary-type) marker." }],
    eln2022: { risk: "adverse", context: "Adverse secondary-type mutation." },
    primerEntity: "zrsr2",
  },
  {
    gene: "JAK2",
    fullName: "Janus kinase 2",
    category: "signaling",
    whatItDoes: "A cytokine-receptor-associated tyrosine kinase; V617F drives MPNs.",
    roles: [
      {
        role: "diagnostic",
        detail: "V617F (or exon 12) is a major criterion for PV, ET, and PMF.",
      },
      { role: "predictive", detail: "MPN disease targetable with JAK inhibitors (e.g. ruxolitinib)." },
    ],
    primerEntity: "jak2",
  },
  {
    gene: "CALR",
    fullName: "Calreticulin",
    category: "signaling",
    whatItDoes: "An ER chaperone; frameshift mutants activate MPL signaling.",
    roles: [
      { role: "diagnostic", detail: "Type 1/2 frameshifts are major criteria for ET and PMF." },
      { role: "prognostic", detail: "Type 1 CALR carries a more favorable course in PMF." },
    ],
    primerEntity: "calr",
  },
  {
    gene: "MPL",
    fullName: "MPL proto-oncogene, thrombopoietin receptor",
    category: "signaling",
    whatItDoes: "The thrombopoietin receptor.",
    roles: [{ role: "diagnostic", detail: "W515 mutations are a major criterion for ET and PMF." }],
    primerEntity: "mpl",
  },
];

const GENE_INDEX = new Map<string, GeneInfo>();
for (const g of GENES) {
  GENE_INDEX.set(g.gene.toUpperCase(), g);
  for (const alias of g.aliases ?? []) GENE_INDEX.set(alias.toUpperCase(), g);
}

export function lookupGene(symbol: string): GeneInfo | undefined {
  return GENE_INDEX.get(symbol.trim().toUpperCase());
}

/**
 * ELN 2022 "secondary-type" / MDS-related mutations that count as adverse in
 * AML. This 9-gene list (including RUNX1) is also the ICC 2022 "AML with
 * myelodysplasia-related gene mutations" set.
 */
export const SECONDARY_TYPE_GENES = [
  "ASXL1",
  "BCOR",
  "EZH2",
  "RUNX1",
  "SF3B1",
  "SRSF2",
  "STAG2",
  "U2AF1",
  "ZRSR2",
];

/**
 * WHO 5th edition "AML, myelodysplasia-related" defining gene mutations. Note
 * WHO5 uses an 8-gene set that EXCLUDES RUNX1 (WHO5 also removed the provisional
 * "AML with mutated RUNX1" entity), whereas ICC and ELN include RUNX1.
 */
export const WHO5_AML_MR_GENES = [
  "ASXL1",
  "BCOR",
  "EZH2",
  "SF3B1",
  "SRSF2",
  "STAG2",
  "U2AF1",
  "ZRSR2",
];
