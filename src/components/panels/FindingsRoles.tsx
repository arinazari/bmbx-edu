import { useMemo } from "react";
import type { HemeCase } from "../../types/case";
import { collectFindings, groupByRole } from "../../lib/findings/roles";
import { ipssmModifiers } from "../../lib/classify/ipssm";
import { ROLE_BLURB, ROLE_LABEL, type FindingRole } from "../../types/findings";
import { PrimerLink, RoleBadge } from "../ui";

// Every finding tagged by the role it plays — the layer that connects pathology
// to management. Rendered both as a per-finding list and as a by-role matrix.

const ROLE_ORDER: FindingRole[] = [
  "diagnostic",
  "prognostic",
  "predictive",
  "mrd",
];

export function FindingsRoles({ case: c }: { case: HemeCase }) {
  const findings = useMemo(() => collectFindings(c), [c]);
  const grouped = useMemo(() => groupByRole(findings), [findings]);
  const ipssm = useMemo(() => ipssmModifiers(c), [c]);

  if (findings.length === 0) {
    return (
      <div className="card card-pad muted">
        No taggable molecular or cytogenetic findings in this case.
      </div>
    );
  }

  return (
    <div className="findings stack">
      {/* By-role matrix */}
      <div className="role-matrix">
        {ROLE_ORDER.map((role) => (
          <div key={role} className={`role-col role-col-${role}`}>
            <div className="role-col-head">
              <RoleBadge role={role} />
              <span className="muted role-blurb">{ROLE_BLURB[role]}</span>
            </div>
            {grouped[role].length ? (
              <ul className="role-col-list">
                {grouped[role].map((f, i) => (
                  <li key={i}>
                    <span className="role-finding">{f.finding}</span>
                    <span className="secondary role-finding-detail">
                      {f.detail}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="muted role-empty">— none —</div>
            )}
          </div>
        ))}
      </div>

      {/* Per-finding cards with drugs + primers */}
      <div className="stack">
        <div className="section-title">Findings in detail</div>
        {findings.map((f, i) => (
          <div key={i} className="finding-card card card-pad">
            <div className="row spread wrap">
              <h4>
                <PrimerLink entity={f.primerEntity}>{f.finding}</PrimerLink>
              </h4>
              <div className="row wrap" style={{ gap: 6 }}>
                <span className="pill pill-source">{f.source}</span>
                {f.roles.map((r) => (
                  <RoleBadge key={r.role} role={r.role} />
                ))}
              </div>
            </div>
            <p className="secondary">{f.detail}</p>
            {f.roles.length > 0 && (
              <ul className="role-detail-list">
                {f.roles.map((r, ri) => (
                  <li key={ri}>
                    <strong>{ROLE_LABEL[r.role]}:</strong> {r.detail}
                  </li>
                ))}
              </ul>
            )}
            {f.drugs && f.drugs.length > 0 && (
              <div className="drugs">
                <span className="section-title">Targeted options</span>
                <div className="drug-chips">
                  {f.drugs.map((d, di) => (
                    <span key={di} className="drug-chip" title={d.note}>
                      {d.drug}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* IPSS-M direction of effect */}
      {ipssm.length > 0 && (
        <div className="ipssm card card-pad stack">
          <div className="section-title">IPSS-M molecular direction of effect</div>
          <p className="muted">
            The full IPSS-M is a weighted score; here is which way each mutation
            moves it. Use the official calculator for the exact value.
          </p>
          <div className="factor-table">
            {ipssm.map((m, i) => (
              <div key={i} className={`factor-row dir-${m.direction}`}>
                <span className="factor-feature">{m.feature}</span>
                <span className={`factor-dir dir-tag-${m.direction}`}>
                  {m.direction === "adverse"
                    ? "↑ risk"
                    : m.direction === "favorable"
                      ? "↓ risk"
                      : "context"}
                </span>
                <span className="secondary factor-note">{m.note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
