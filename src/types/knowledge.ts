import type { Lineage, MarkerExpression } from "./case";
import type { ElnRisk, RoleTag } from "./findings";

// Type contracts for the flow-marker and gene knowledge bases. Data modules
// (src/lib/flow/markers.ts, src/lib/genes/genes.ts) conform to these; the UI
// joins case findings against them.

export interface MarkerInfo {
  /** Canonical antigen name, e.g. "CD34". */
  marker: string;
  aliases?: string[];
  /** Lineage columns this marker belongs to (a marker can span several). */
  lineages: Lineage[];
  /** One or two sentences: what the antigen is. */
  whatItIs: string;
  /** Where it is normally expressed in hematopoiesis. */
  normalExpression: string;
}

/** Which population is under the microscope when an aberrancy rule fires. */
export type FlowContext =
  | "myeloblast"
  | "monoblast"
  | "bcell"
  | "blast_bcell" // B lymphoblasts
  | "tcell"
  | "blast_tcell" // T lymphoblasts
  | "plasma"
  | "any";

/**
 * A teaching rule: on the given population, this marker showing one of these
 * expressions is a recognized aberrancy or diagnostic clue worth flagging.
 */
export interface AberrancyRule {
  marker: string;
  context: FlowContext;
  expressions: MarkerExpression[];
  /** Short flag shown in the auto-flag panel. */
  flag: string;
  /** Why it matters. */
  significance: string;
}

export type GeneCategory =
  | "signaling"
  | "transcription"
  | "splicing"
  | "epigenetic"
  | "tumor_suppressor"
  | "cohesin"
  | "nucleophosmin"
  | "other";

export interface Targetable {
  drug: string;
  note: string;
}

export interface GeneInfo {
  /** HGNC gene symbol, e.g. "NPM1". */
  gene: string;
  aliases?: string[];
  fullName: string;
  category: GeneCategory;
  /** What the gene/protein normally does, briefly. */
  whatItDoes: string;
  /** Tagged clinical roles (diagnostic / prognostic / predictive / MRD). */
  roles: RoleTag[];
  /** ELN 2022 contribution, when applicable, with the context that qualifies it. */
  eln2022?: { risk: ElnRisk; context: string };
  /** Targeted-therapy hooks. */
  targetable?: Targetable[];
  /** True if commonly used as a measurable-residual-disease marker. */
  mrdMarker?: boolean;
  notes?: string;
  /** Anchor used to deep-link to an external primer. */
  primerEntity?: string;
}
