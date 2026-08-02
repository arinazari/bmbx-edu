// The case model. A HemeCase is the single source of truth for a bone marrow
// workup: it holds the layered findings (CBC, morphology, flow, cytogenetics,
// molecular) that the staged-reasoning engine reveals one layer at a time.
// All content is assumed de-identified before it ever reaches this app.

export type Sex = "M" | "F" | "unknown";

/** Hematopoietic lineages used to organize flow markers into a grid. */
export type Lineage =
  | "stem" // blast / progenitor markers: CD34, CD117, HLA-DR, TdT
  | "myeloid" // granulocytic: MPO, CD13, CD33, CD15, CD65, CD11b
  | "monocytic" // CD14, CD64, CD11c, CD36, lysozyme
  | "erythroid" // CD235a (glycophorin A), CD71, E-cadherin
  | "megakaryocytic" // CD41, CD61, CD42b
  | "b" // CD19, CD20, CD22, CD79a, CD10, PAX5, sIg
  | "t" // CD2, CD3, CD5, CD7, CD4, CD8, CD1a
  | "nk" // CD16, CD56, CD57
  | "plasma"; // CD138, CD38, CD56, cytoplasmic light chain

export const LINEAGE_ORDER: Lineage[] = [
  "stem",
  "myeloid",
  "monocytic",
  "erythroid",
  "megakaryocytic",
  "b",
  "t",
  "nk",
  "plasma",
];

export const LINEAGE_LABEL: Record<Lineage, string> = {
  stem: "Blast / stem",
  myeloid: "Myeloid",
  monocytic: "Monocytic",
  erythroid: "Erythroid",
  megakaryocytic: "Megakaryocytic",
  b: "B lymphoid",
  t: "T lymphoid",
  nk: "NK",
  plasma: "Plasma cell",
};

/** How strongly a marker is expressed on the population of interest. */
export type MarkerExpression =
  | "positive"
  | "bright"
  | "dim"
  | "subset" // partial / a subpopulation is positive
  | "negative"
  | "aberrant"; // expressed where it is not normally seen (lineage infidelity)

export interface FlowMarker {
  /** Antigen name, canonical form, e.g. "CD34", "MPO", "HLA-DR". */
  marker: string;
  expression: MarkerExpression;
  /** Optional case-specific note, e.g. "on ~40% of blasts". */
  note?: string;
}

export interface FlowResult {
  /** How the abnormal population was gated. */
  gate?: string;
  /** Percent of total events falling in the abnormal/blast gate. */
  populationPercent?: number;
  markers: FlowMarker[];
  /** Free-text summary line from the report. */
  interpretation?: string;
}

export interface CBC {
  /** White blood cells, x10^9/L. */
  wbc?: number;
  hgb?: number; // g/dL
  hct?: number; // %
  plt?: number; // x10^9/L
  anc?: number; // absolute neutrophils, x10^9/L
  mcv?: number; // fL
  rdw?: number; // %
  retic?: number; // %
  monocytes?: number; // absolute, x10^9/L (relevant for CMML)
}

export interface CellDifferential {
  source: "peripheral" | "aspirate";
  /** Blast percentage — the single most consequential number in the workup. */
  blasts?: number;
  /** Additional differential counts keyed by cell name, all in percent. */
  counts?: Record<string, number>;
  /** Aspirate quality / adequacy note. */
  note?: string;
}

export interface FishProbe {
  /** Probe target, e.g. "BCR::ABL1", "KMT2A (11q23)", "-7/del(7q)". */
  probe: string;
  result: "positive" | "negative" | "equivocal";
  /** Scoring, e.g. "182/200 nuclei (91%)". */
  nuclei?: string;
  interpretation?: string;
}

export interface Cytogenetics {
  /** Raw ISCN karyotype string, parsed by the ISCN engine at render time. */
  karyotypeISCN?: string;
  fish?: FishProbe[];
  note?: string;
}

export type VariantSignificance =
  | "pathogenic"
  | "likely_pathogenic"
  | "vus"
  | "benign";

export interface Variant {
  /** Gene symbol, HGNC form, e.g. "NPM1", "FLT3", "TP53". */
  gene: string;
  /** Coding change, e.g. "c.1810_1811insTCTG". */
  hgvs?: string;
  /** Protein change, e.g. "p.Trp288Cysfs*12". */
  protein?: string;
  /** Variant allele fraction, percent. */
  vaf?: number;
  /** Variant class, e.g. "ITD", "missense", "frameshift", "nonsense". */
  type?: string;
  significance?: VariantSignificance;
  note?: string;
}

export interface Molecular {
  variants: Variant[];
  /** Assay description, e.g. "Myeloid NGS panel (54 genes), PCR for FLT3-ITD". */
  method?: string;
}

/** The ordered stages of progressive disclosure. */
export type StageId =
  | "presentation"
  | "morphology"
  | "flow"
  | "cytogenetics"
  | "molecular"
  | "integration";

export interface HemeCase {
  id: string;
  title: string;
  /** De-identified clinical vignette shown at presentation. */
  vignette: string;
  demographics?: { ageBand?: string; sex?: Sex };
  cbc?: CBC;
  /** Peripheral smear morphology description. */
  smear?: string;
  differential?: CellDifferential[];
  /** Aspirate + core biopsy morphology. */
  marrowMorphology?: string;
  cellularity?: string;
  flow?: FlowResult;
  cytogenetics?: Cytogenetics;
  molecular?: Molecular;

  // --- Teaching metadata (drives the pedagogy, not the report) -------------
  /** The integrated diagnosis revealed at the end. */
  teachingDiagnosis?: string;
  /** One-line summary of why this case is instructive. */
  teachingSummary?: string;
  teachingPoints?: string[];
  /**
   * Candidate diagnoses the learner ranks at each commit step. Should be a
   * realistic differential for the presentation, including the right answer.
   */
  differentialOptions: string[];
  /** Which stage's reveal is the "aha" that should reshape the differential. */
  pivotStage?: StageId;
}
