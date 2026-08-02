import { useState } from "react";
import type { HemeCase } from "../types/case";
import { SAMPLE_CASES } from "../data/cases";
import { parseReport, type ParsedReport } from "../lib/report/parseReport";

// Entry point: pick a curated sample case, or paste a de-identified report and
// let the parser extract what it can before you start the staged review.

const DEFAULT_DIFFERENTIAL = [
  "AML with a defining genetic abnormality",
  "AML with mutated NPM1",
  "AML, myelodysplasia-related",
  "Acute promyelocytic leukemia",
  "MDS with increased blasts (MDS-IB2)",
  "MDS/AML",
  "MDS with low blasts",
  "B-lymphoblastic leukemia/lymphoma",
  "Chronic myelomonocytic leukemia",
  "Reactive / no neoplasm",
];

export function CaseLoader({ onLoad }: { onLoad: (c: HemeCase) => void }) {
  const [mode, setMode] = useState<"samples" | "paste">("samples");

  return (
    <div className="loader container">
      <div className="loader-hero">
        <h1 className="loader-title">Reason through a marrow, one layer at a time.</h1>
        <p className="loader-sub secondary">
          Commit a differential from the counts, then watch it update as
          morphology, flow, cytogenetics, and NGS are revealed. The tool parses
          the karyotype, draws the chromosomes, runs the flow aberrancies, and
          classifies WHO5 vs ICC — showing its work at every step.
        </p>
      </div>

      <div className="loader-tabs">
        <button
          className={`loader-tab${mode === "samples" ? " active" : ""}`}
          onClick={() => setMode("samples")}
        >
          Sample cases
        </button>
        <button
          className={`loader-tab${mode === "paste" ? " active" : ""}`}
          onClick={() => setMode("paste")}
        >
          Paste a report
        </button>
      </div>

      {mode === "samples" ? (
        <div className="sample-grid">
          {SAMPLE_CASES.map((c) => (
            <button
              key={c.id}
              className="sample-card card"
              onClick={() => onLoad(c)}
            >
              <div className="sample-card-title">{c.title}</div>
              <div className="secondary sample-card-summary">
                {c.teachingSummary}
              </div>
              <div className="sample-card-foot">
                {c.demographics?.ageBand && (
                  <span className="pill">{c.demographics.ageBand}</span>
                )}
                <span className="sample-start">Start review →</span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <PasteReport onLoad={onLoad} />
      )}
    </div>
  );
}

function PasteReport({ onLoad }: { onLoad: (c: HemeCase) => void }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<ParsedReport | null>(null);
  const [vignette, setVignette] = useState("");
  const [marrowBlasts, setMarrowBlasts] = useState("");
  const [pbBlasts, setPbBlasts] = useState("");
  const [karyotype, setKaryotype] = useState("");
  const [differential, setDifferential] = useState(
    DEFAULT_DIFFERENTIAL.join("\n"),
  );

  const runParse = () => {
    const p = parseReport(text);
    setParsed(p);
    const m = p.draft.differential?.find((d) => d.source === "aspirate");
    const pb = p.draft.differential?.find((d) => d.source === "peripheral");
    if (m?.blasts !== undefined) setMarrowBlasts(String(m.blasts));
    if (pb?.blasts !== undefined) setPbBlasts(String(pb.blasts));
    if (p.draft.cytogenetics?.karyotypeISCN)
      setKaryotype(p.draft.cytogenetics.karyotypeISCN);
  };

  const start = () => {
    if (!parsed) return;
    const differentialOptions = differential
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const diffs: HemeCase["differential"] = [];
    if (pbBlasts) diffs.push({ source: "peripheral", blasts: Number(pbBlasts) });
    if (marrowBlasts)
      diffs.push({ source: "aspirate", blasts: Number(marrowBlasts) });

    const c: HemeCase = {
      id: "pasted",
      title: "Pasted report",
      vignette: vignette || "(No clinical vignette provided.)",
      differentialOptions: differentialOptions.length
        ? differentialOptions
        : DEFAULT_DIFFERENTIAL,
      differential: diffs.length ? diffs : parsed.draft.differential,
      cbc: parsed.draft.cbc,
      flow: parsed.draft.flow,
      molecular: parsed.draft.molecular,
      cytogenetics: karyotype
        ? { ...parsed.draft.cytogenetics, karyotypeISCN: karyotype }
        : parsed.draft.cytogenetics,
    };
    onLoad(c);
  };

  return (
    <div className="paste stack">
      <div className="card card-pad stack">
        <div className="row spread wrap">
          <span className="section-title">De-identified report text</span>
          <span className="muted">PHI must already be removed.</span>
        </div>
        <textarea
          className="paste-input mono"
          rows={9}
          placeholder="Paste the bone marrow / flow / cytogenetics / NGS report here…"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="row">
          <button
            className="btn btn-primary"
            onClick={runParse}
            disabled={!text.trim()}
          >
            Parse report
          </button>
          {parsed && (
            <span className="muted">Review below, correct anything, then start.</span>
          )}
        </div>
      </div>

      {parsed && (
        <div className="card card-pad stack">
          <div className="section-title">What the parser found</div>
          <ul className="parse-notes">
            {parsed.notes.map((n, i) => (
              <li key={i} className="secondary">
                {n}
              </li>
            ))}
          </ul>

          <div className="divider" />

          <label className="field">
            <span className="section-title">Clinical vignette (optional)</span>
            <textarea
              rows={2}
              value={vignette}
              onChange={(e) => setVignette(e.target.value)}
              placeholder="One or two lines of de-identified history."
            />
          </label>

          <div className="paste-fields">
            <label className="field">
              <span className="section-title">Marrow blasts %</span>
              <input
                value={marrowBlasts}
                onChange={(e) => setMarrowBlasts(e.target.value)}
                inputMode="decimal"
              />
            </label>
            <label className="field">
              <span className="section-title">Peripheral blasts %</span>
              <input
                value={pbBlasts}
                onChange={(e) => setPbBlasts(e.target.value)}
                inputMode="decimal"
              />
            </label>
          </div>

          <label className="field">
            <span className="section-title">Karyotype (ISCN)</span>
            <input
              className="mono"
              value={karyotype}
              onChange={(e) => setKaryotype(e.target.value)}
              placeholder="46,XY,t(9;22)(q34;q11.2)[20]"
            />
          </label>

          <label className="field">
            <span className="section-title">Differential options (one per line)</span>
            <textarea
              rows={5}
              value={differential}
              onChange={(e) => setDifferential(e.target.value)}
            />
          </label>

          <div className="row spread">
            <span className="muted">
              Flow markers and variants carry over from the parse.
            </span>
            <button className="btn btn-primary" onClick={start}>
              Start staged review →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
