import type { CBC, HemeCase } from "../../types/case";
import { FlowGrid } from "../panels/FlowGrid";
import { KaryotypePanel } from "../panels/KaryotypePanel";
import { ClassificationPanel } from "../panels/ClassificationPanel";
import { RiskPanel } from "../panels/RiskPanel";
import { FindingsRoles } from "../panels/FindingsRoles";
import { Stat } from "../ui";

export function PresentationView({ case: c }: { case: HemeCase }) {
  const marrow = c.differential?.find((d) => d.source === "aspirate");
  const pb = c.differential?.find((d) => d.source === "peripheral");
  return (
    <div className="stack">
      <div className="vignette card card-pad">
        <div className="row wrap" style={{ gap: 8, marginBottom: 8 }}>
          {c.demographics?.ageBand && (
            <span className="pill">{c.demographics.ageBand}</span>
          )}
          {c.demographics?.sex && c.demographics.sex !== "unknown" && (
            <span className="pill">{c.demographics.sex}</span>
          )}
        </div>
        <p className="vignette-text">{c.vignette}</p>
      </div>

      {c.cbc && <CBCGrid cbc={c.cbc} />}

      {(marrow?.blasts !== undefined || pb?.blasts !== undefined) && (
        <div className="blast-callout card card-pad">
          <div className="section-title">Blast percentage</div>
          <div className="blast-values">
            {pb?.blasts !== undefined && (
              <Stat label="peripheral blood" value={`${pb.blasts}%`} />
            )}
            {marrow?.blasts !== undefined && (
              <Stat label="marrow aspirate" value={`${marrow.blasts}%`} />
            )}
          </div>
          <p className="muted">
            The blast count sets the ceiling on the differential. Commit before
            you see anything else.
          </p>
        </div>
      )}
    </div>
  );
}

function CBCGrid({ cbc }: { cbc: CBC }) {
  return (
    <div className="cbc-grid card card-pad">
      <div className="section-title">CBC</div>
      <div className="stat-row">
        {cbc.wbc !== undefined && (
          <Stat
            label="WBC ×10⁹/L"
            value={cbc.wbc}
            flag={cbc.wbc < 4 ? "low" : cbc.wbc > 11 ? "high" : "none"}
          />
        )}
        {cbc.hgb !== undefined && (
          <Stat
            label="Hgb g/dL"
            value={cbc.hgb}
            flag={cbc.hgb < 12 ? "low" : "none"}
          />
        )}
        {cbc.plt !== undefined && (
          <Stat
            label="Plt ×10⁹/L"
            value={cbc.plt}
            flag={cbc.plt < 150 ? "low" : cbc.plt > 450 ? "high" : "none"}
          />
        )}
        {cbc.anc !== undefined && (
          <Stat
            label="ANC ×10⁹/L"
            value={cbc.anc}
            flag={cbc.anc < 1.5 ? "low" : "none"}
          />
        )}
        {cbc.mcv !== undefined && (
          <Stat
            label="MCV fL"
            value={cbc.mcv}
            flag={cbc.mcv > 100 ? "high" : cbc.mcv < 80 ? "low" : "none"}
          />
        )}
        {cbc.monocytes !== undefined && (
          <Stat label="Monocytes ×10⁹/L" value={cbc.monocytes} />
        )}
      </div>
    </div>
  );
}

export function MorphologyView({ case: c }: { case: HemeCase }) {
  return (
    <div className="stack">
      {c.smear && (
        <div className="card card-pad">
          <div className="section-title">Peripheral smear</div>
          <p>{c.smear}</p>
        </div>
      )}
      <div className="card card-pad">
        <div className="row spread wrap">
          <div className="section-title">Marrow aspirate & core</div>
          {c.cellularity && <span className="pill">{c.cellularity}</span>}
        </div>
        <p>{c.marrowMorphology ?? "No morphology recorded."}</p>
      </div>
    </div>
  );
}

export function FlowView({ case: c }: { case: HemeCase }) {
  if (!c.flow) return <Empty label="No flow cytometry in this case." />;
  return (
    <div className="stack">
      {c.flow.interpretation && (
        <div className="card card-pad">
          <div className="section-title">Report impression</div>
          <p>{c.flow.interpretation}</p>
        </div>
      )}
      <FlowGrid flow={c.flow} />
    </div>
  );
}

export function CytogeneticsView({ case: c }: { case: HemeCase }) {
  const cyto = c.cytogenetics;
  if (!cyto) return <Empty label="No cytogenetics in this case." />;
  return (
    <div className="stack">
      {cyto.karyotypeISCN && <KaryotypePanel cyto={cyto} />}
      {cyto.fish && cyto.fish.length > 0 && (
        <div className="card card-pad">
          <div className="section-title">FISH</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Probe</th>
                <th>Result</th>
                <th>Scoring</th>
              </tr>
            </thead>
            <tbody>
              {cyto.fish.map((f, i) => (
                <tr key={i}>
                  <td className="mono">{f.probe}</td>
                  <td>
                    <span className={`fish-result fish-${f.result}`}>
                      {f.result}
                    </span>
                  </td>
                  <td className="secondary">{f.nuclei ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {cyto.note && <p className="muted">{cyto.note}</p>}
        </div>
      )}
    </div>
  );
}

export function MolecularView({ case: c }: { case: HemeCase }) {
  const mol = c.molecular;
  if (!mol || mol.variants.length === 0)
    return <Empty label="No reportable variants." />;
  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="row spread wrap">
          <div className="section-title">Variants</div>
          {mol.method && <span className="muted">{mol.method}</span>}
        </div>
        <div className="scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Gene</th>
                <th>Change</th>
                <th>Type</th>
                <th>VAF</th>
                <th>Significance</th>
              </tr>
            </thead>
            <tbody>
              {mol.variants.map((v, i) => (
                <tr key={i}>
                  <td className="mono gene-cell">{v.gene}</td>
                  <td className="mono">{v.protein ?? v.hgvs ?? "—"}</td>
                  <td className="secondary">{v.type ?? "—"}</td>
                  <td>{v.vaf !== undefined ? `${v.vaf}%` : "—"}</td>
                  <td>
                    <span className={`sig sig-${v.significance ?? "vus"}`}>
                      {sigLabel(v.significance)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <p className="muted">
        The clinical weight of each variant — diagnostic, prognostic, predictive,
        or MRD — is unpacked in the integrated view.
      </p>
    </div>
  );
}

export function IntegrationView({
  case: c,
  trajectory,
}: {
  case: HemeCase;
  trajectory?: React.ReactNode;
}) {
  return (
    <div className="stack integration">
      {c.teachingDiagnosis && (
        <div className="answer card card-pad">
          <div className="section-title">Integrated diagnosis</div>
          <p className="answer-text">{c.teachingDiagnosis}</p>
        </div>
      )}

      <div className="stack">
        <h3 className="panel-h">Classification — WHO5 vs ICC</h3>
        <ClassificationPanel case={c} />
      </div>

      <div className="stack">
        <h3 className="panel-h">Risk stratification</h3>
        <RiskPanel case={c} />
      </div>

      <div className="stack">
        <h3 className="panel-h">Findings by role</h3>
        <FindingsRoles case={c} />
      </div>

      {c.teachingPoints && c.teachingPoints.length > 0 && (
        <div className="teaching card card-pad">
          <div className="section-title">Teaching points</div>
          <ul className="teaching-list">
            {c.teachingPoints.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {trajectory}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="card card-pad muted">{label}</div>;
}

function sigLabel(s?: string): string {
  switch (s) {
    case "pathogenic":
      return "pathogenic";
    case "likely_pathogenic":
      return "likely path.";
    case "benign":
      return "benign";
    default:
      return "VUS";
  }
}
