import type { HemeCase } from "../../types/case";
import type { FindingRole, RoleTag } from "../../types/findings";
import { lookupGene } from "../genes/genes";
import { identifyRecurrent } from "../iscn/recurrent";
import { parseKaryotype } from "../iscn/parser";

// Aggregates every case finding and tags it by clinical role
// (diagnostic / prognostic / predictive / MRD). This is the layer that turns a
// list of results into a management-relevant picture.

export type FindingSource = "molecular" | "cytogenetic" | "phenotype";

export interface TaggedFinding {
  finding: string;
  source: FindingSource;
  detail: string;
  roles: RoleTag[];
  primerEntity?: string;
  /** Targeted-therapy hooks, when any. */
  drugs?: { drug: string; note: string }[];
}

export function collectFindings(c: HemeCase): TaggedFinding[] {
  const out: TaggedFinding[] = [];

  // --- Molecular ----------------------------------------------------------
  for (const v of c.molecular?.variants ?? []) {
    const info = lookupGene(v.gene);
    const label = variantLabel(v.gene, v);
    if (info) {
      out.push({
        finding: label,
        source: "molecular",
        detail: info.whatItDoes,
        roles: info.roles,
        primerEntity: info.primerEntity,
        drugs: info.targetable,
      });
    } else {
      out.push({
        finding: label,
        source: "molecular",
        detail: "Not in the local gene knowledge base.",
        roles: [],
      });
    }
  }

  // --- Cytogenetic --------------------------------------------------------
  const iscn = c.cytogenetics?.karyotypeISCN;
  if (iscn) {
    const k = parseKaryotype(iscn);
    for (const m of identifyRecurrent(k)) {
      out.push({
        finding: `${m.entry.label} · ${m.entry.gene}`,
        source: "cytogenetic",
        detail: m.entry.meaning,
        roles: m.entry.roles.map((r) => ({ role: r, detail: roleDetail(r, m.entry.gene) })),
      });
    }
  }

  return out;
}

function variantLabel(gene: string, v: { protein?: string; hgvs?: string; type?: string }): string {
  const change = v.protein ?? v.hgvs ?? v.type ?? "mutation";
  return `${gene} ${change}`;
}

function roleDetail(role: FindingRole, gene: string): string {
  switch (role) {
    case "diagnostic":
      return `Contributes to the diagnosis (${gene}).`;
    case "prognostic":
      return `Carries prognostic weight (${gene}).`;
    case "predictive":
      return `May predict therapy response (${gene}).`;
    case "mrd":
      return `Can serve as an MRD marker (${gene}).`;
  }
}

/** Group tagged findings by the role they play, for the role matrix. */
export function groupByRole(
  findings: TaggedFinding[],
): Record<FindingRole, { finding: string; detail: string }[]> {
  const groups: Record<FindingRole, { finding: string; detail: string }[]> = {
    diagnostic: [],
    prognostic: [],
    predictive: [],
    mrd: [],
  };
  for (const f of findings) {
    for (const r of f.roles) {
      groups[r.role].push({ finding: f.finding, detail: r.detail });
    }
  }
  return groups;
}
