import { useMemo } from "react";
import type { HemeCase } from "../../types/case";
import { elnRisk } from "../../lib/classify/eln";
import { ipssr } from "../../lib/classify/ipssr";
import { ELN_LABEL } from "../../types/findings";
import { ElnBadge, StepList } from "../ui";

// ELN 2022 (for AML) and IPSS-R (for MDS), each showing the derivation.

export function RiskPanel({ case: c }: { case: HemeCase }) {
  const eln = useMemo(() => elnRisk(c), [c]);
  const ipss = useMemo(() => ipssr(c), [c]);

  return (
    <div className="risk-panel grid-2">
      <div className="card card-pad stack">
        <div className="row spread">
          <span className="section-title">ELN 2022 (AML)</span>
          {eln.applicable && <ElnBadge risk={eln.risk} />}
        </div>
        {eln.applicable ? (
          <>
            <div className={`risk-headline eln-${eln.risk}`}>
              {ELN_LABEL[eln.risk]} risk
            </div>
            <StepList steps={eln.steps} />
            {eln.factors.length > 0 && (
              <div className="factor-table">
                {eln.factors.map((f, i) => (
                  <div key={i} className={`factor-row dir-${f.direction}`}>
                    <span className="factor-feature">{f.feature}</span>
                    <span className={`factor-dir eln-${f.direction}`}>
                      {ELN_LABEL[f.direction]}
                    </span>
                    <span className="secondary factor-note">{f.note}</span>
                  </div>
                ))}
              </div>
            )}
            {eln.modifiers.length > 0 && (
              <ul className="modifier-list">
                {eln.modifiers.map((m, i) => (
                  <li key={i} className="secondary">
                    {m}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="muted">
            {eln.notApplicableReason ??
              "ELN 2022 stratifies AML. This case is MDS-range — use IPSS-R / IPSS-M."}
          </p>
        )}
      </div>

      <div className="card card-pad stack">
        <div className="row spread">
          <span className="section-title">IPSS-R (MDS)</span>
          {ipss.applicable && ipss.risk && (
            <span className={`ipssr-badge ipssr-${slug(ipss.risk)}`}>
              {ipss.risk}
            </span>
          )}
        </div>
        {ipss.applicable ? (
          <>
            <div className="risk-headline">
              {ipss.risk} · score {ipss.total}
            </div>
            <StepList steps={ipss.steps} />
            <p className="muted ipssm-note">
              IPSS-M refines this with gene weights (TP53-multihit, FLT3,
              splicing factors, etc.). Its full weighted score needs the official
              calculator — the molecular direction of effect is shown in the
              findings tab.
            </p>
          </>
        ) : (
          <p className="muted">{ipss.reason}</p>
        )}
      </div>
    </div>
  );
}

function slug(risk: string): string {
  return risk.toLowerCase().replace(/\s+/g, "-");
}
