import type { FlowMarker, FlowResult, MarkerExpression } from "../../types/case";
import type { FlowContext } from "../../types/knowledge";
import { ABERRANCY_RULES, lookupMarker } from "./markers";

// Infers which population is under examination and fires the aberrancy rules
// against a case's phenotype to surface the teaching points automatically.

function has(markers: FlowMarker[], name: string, exprs?: MarkerExpression[]) {
  const m = markers.find(
    (x) => x.marker.toUpperCase() === name.toUpperCase(),
  );
  if (!m) return false;
  return exprs ? exprs.includes(m.expression) : m.expression !== "negative";
}

/** Heuristic population context from the reported phenotype. */
export function inferFlowContext(flow: FlowResult): FlowContext {
  const m = flow.markers;
  if (has(m, "CD138") || has(m, "CD38", ["bright"])) return "plasma";
  if (has(m, "CD3")) return "blast_tcell";
  const bLineage =
    has(m, "CD19") || has(m, "CD79a") || has(m, "PAX5");
  const myeloid = has(m, "MPO") || has(m, "CD13") || has(m, "CD33") || has(m, "CD117");
  if (bLineage && !myeloid) return "blast_bcell";
  const monocytic =
    has(m, "CD14") && !has(m, "CD34");
  if (monocytic && !has(m, "MPO", ["bright", "positive"])) return "monoblast";
  return "myeloblast";
}

export interface FlowFlag {
  marker: string;
  expression: MarkerExpression;
  flag: string;
  significance: string;
}

const CONTEXT_ALIASES: Record<FlowContext, FlowContext[]> = {
  myeloblast: ["myeloblast", "any"],
  monoblast: ["monoblast", "myeloblast", "any"],
  bcell: ["bcell", "any"],
  blast_bcell: ["blast_bcell", "bcell", "any"],
  tcell: ["tcell", "any"],
  blast_tcell: ["blast_tcell", "tcell", "any"],
  plasma: ["plasma", "any"],
  any: ["any"],
};

/** Fire aberrancy rules for the inferred (or given) context. */
export function flagAberrancies(
  flow: FlowResult,
  context?: FlowContext,
): FlowFlag[] {
  const ctx = context ?? inferFlowContext(flow);
  const allowed = new Set(CONTEXT_ALIASES[ctx]);
  const flags: FlowFlag[] = [];
  for (const marker of flow.markers) {
    for (const rule of ABERRANCY_RULES) {
      if (rule.marker.toUpperCase() !== marker.marker.toUpperCase()) continue;
      if (!allowed.has(rule.context)) continue;
      if (!rule.expressions.includes(marker.expression)) continue;
      flags.push({
        marker: marker.marker,
        expression: marker.expression,
        flag: rule.flag,
        significance: rule.significance,
      });
    }
  }
  return flags;
}

/** Which markers in the case are individually flagged (for grid highlighting). */
export function flaggedMarkerSet(flow: FlowResult, context?: FlowContext): Set<string> {
  return new Set(flagAberrancies(flow, context).map((f) => f.marker.toUpperCase()));
}

export function markerLabel(name: string): string {
  const info = lookupMarker(name);
  return info?.marker ?? name;
}
