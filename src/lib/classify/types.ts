export interface Step {
  label: string;
  detail: string;
  /** True for the step that determined the final category. */
  decisive?: boolean;
}

export type ClassSystem = "WHO5" | "ICC2022";

export interface SystemResult {
  system: ClassSystem;
  /** The final classification label. */
  category: string;
  /** Short note on the blast threshold that applied. */
  thresholdNote: string;
  steps: Step[];
}

export interface Disagreement {
  topic: string;
  who5: string;
  icc: string;
  why: string;
}

export interface ClassificationResult {
  who5: SystemResult;
  icc: SystemResult;
  disagreements: Disagreement[];
  /** True when there is not enough data to classify (e.g. no blast count). */
  insufficient: boolean;
}
