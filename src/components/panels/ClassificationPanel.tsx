import { useMemo } from "react";
import type { HemeCase } from "../../types/case";
import { classifyCase } from "../../lib/classify/engine";
import type { SystemResult } from "../../lib/classify/types";
import { StepList } from "../ui";

// WHO 5th edition and ICC 2022 shown side by side, with their disagreements
// pulled out — the "shows its work" classification view.

export function ClassificationPanel({ case: c }: { case: HemeCase }) {
  const result = useMemo(() => classifyCase(c), [c]);

  if (result.insufficient) {
    return (
      <div className="card card-pad muted">
        A blast percentage is needed to classify on the AML/MDS axis. Add a
        marrow or peripheral blast count.
      </div>
    );
  }

  return (
    <div className="classify stack">
      <div className="classify-cols">
        <SystemCard result={result.who5} label="WHO 5th edition (2022)" />
        <SystemCard result={result.icc} label="ICC 2022" />
      </div>

      {result.disagreements.length > 0 && (
        <div className="disagreements card card-pad stack">
          <div className="section-title">Where they disagree</div>
          {result.disagreements.map((d, i) => (
            <div key={i} className="disagreement">
              <div className="disagreement-topic">{d.topic}</div>
              <div className="disagreement-cols">
                <div className="disagreement-side">
                  <span className="side-tag who5">WHO5</span>
                  <span>{d.who5}</span>
                </div>
                <div className="disagreement-side">
                  <span className="side-tag icc">ICC</span>
                  <span>{d.icc}</span>
                </div>
              </div>
              <div className="muted disagreement-why">{d.why}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SystemCard({ result, label }: { result: SystemResult; label: string }) {
  return (
    <div className="system-card card">
      <div className="system-card-head">
        <span className="section-title">{label}</span>
        <h3 className="system-category">{result.category}</h3>
        <div className="muted system-threshold">{result.thresholdNote}</div>
      </div>
      <div className="system-card-body">
        <StepList steps={result.steps} />
      </div>
    </div>
  );
}
