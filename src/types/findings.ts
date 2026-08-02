// The clinical role a finding plays. This is the layer that connects
// pathology to management: the same mutation can be diagnostic, prognostic,
// predictive of drug response, and/or trackable as measurable residual disease.

export type FindingRole = "diagnostic" | "prognostic" | "predictive" | "mrd";

export const ROLE_LABEL: Record<FindingRole, string> = {
  diagnostic: "Diagnostic",
  prognostic: "Prognostic",
  predictive: "Predictive",
  mrd: "MRD-trackable",
};

export const ROLE_BLURB: Record<FindingRole, string> = {
  diagnostic: "Helps establish or refine the diagnosis / classification.",
  prognostic: "Shifts expected outcome independent of a specific therapy.",
  predictive: "Predicts response (or resistance) to a specific therapy.",
  mrd: "Can be tracked over time to measure residual disease and relapse.",
};

export type ElnRisk = "favorable" | "intermediate" | "adverse";

export const ELN_LABEL: Record<ElnRisk, string> = {
  favorable: "Favorable",
  intermediate: "Intermediate",
  adverse: "Adverse",
};

/** A single tagged clinical implication attached to a finding. */
export interface RoleTag {
  role: FindingRole;
  /** One-line, concrete implication, e.g. "Targetable with midostaurin". */
  detail: string;
}
