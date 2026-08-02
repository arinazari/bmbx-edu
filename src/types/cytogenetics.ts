// Structured representation of a parsed ISCN karyotype. The parser in
// src/lib/iscn turns a string like
//   46,XY,t(9;22)(q34;q11.2)[18]/46,XY[2]
// into this shape, which the ideogram and interpretation layers consume.

export type AbnormalityKind =
  | "gain" // +8, trisomy
  | "loss" // -7, monosomy
  | "translocation" // t(...)
  | "deletion" // del(...)
  | "inversion" // inv(...)
  | "duplication" // dup(...)
  | "addition" // add(...) — extra material of unknown origin
  | "isochromosome" // i(...)
  | "insertion" // ins(...)
  | "derivative" // der(...)
  | "dicentric" // dic(...) / idic(...)
  | "ring" // r(...)
  | "marker" // +mar
  | "double_minute" // dmin
  | "iso_dicentric"
  | "other"
  | "unknown";

export interface Breakpoint {
  /** Chromosome as written, e.g. "9", "22", "X". */
  chr: string;
  /** Band designation, e.g. "q34", "p13.1", or undefined when whole-arm. */
  band?: string;
}

export interface Abnormality {
  /** The exact substring from the karyotype. */
  raw: string;
  kind: AbnormalityKind;
  /** Chromosomes involved, in order written. */
  chromosomes: string[];
  /** Breakpoints, paired to chromosomes where the notation provides them. */
  breakpoints: Breakpoint[];
  /** Net copy change for numerical abnormalities (+1, -1, +2, ...). */
  copyChange?: number;
  /** Plain-English rendering. */
  text: string;
  /** True if the notation carried a "?" uncertainty marker. */
  uncertain: boolean;
}

export type Ploidy =
  | "haploid"
  | "diploid"
  | "hypodiploid"
  | "hyperdiploid"
  | "near-triploid"
  | "near-tetraploid"
  | "unknown";

export interface Clone {
  /** The exact clone substring. */
  raw: string;
  /** Modal chromosome number, or null when a range was given. */
  modalNumber: number | null;
  modalRange?: [number, number];
  ploidy: Ploidy;
  /** Sex-chromosome constitution, e.g. "XY", "X", "XXY". */
  sex: string;
  abnormalities: Abnormality[];
  /** Number of cells carrying this clone, from the [n] bracket. */
  cellCount: number | null;
  /** True for composite karyotypes ([cpN]). */
  composite: boolean;
  /** True when the clone has no abnormalities (a normal metaphase clone). */
  isNormal: boolean;
}

export interface Karyotype {
  raw: string;
  clones: Clone[];
  /** Sum of all clone cell counts, when every clone reported one. */
  totalCells: number | null;
  /** Cells in abnormal (non-normal) clones. */
  abnormalCells: number | null;
  /** abnormalCells / totalCells, 0..1, when computable. */
  clonalFraction: number | null;
  /**
   * True when any single clone carries >=3 independent abnormalities — the
   * threshold used by ELN/WHO/ICC for "complex karyotype".
   */
  complexKaryotype: boolean;
  /**
   * True when a clone has a monosomy plus one other monosomy or one structural
   * abnormality (monosomal karyotype, a poor-risk marker).
   */
  monosomalKaryotype: boolean;
  /** Parser warnings — never thrown, always surfaced for teaching. */
  errors: string[];
}
