import { useEffect, useState } from "react";
import type { StageId } from "../types/case";
import type { Commit } from "../lib/staging/stages";
import type { Prediction } from "../lib/predict/predictions";

// The commit gate. At the first stage the learner builds a differential from
// scratch. After that the differential carries forward and the gate asks about
// *change* instead of re-asking the same question — one click when nothing
// moved — plus a prediction of what the next layer will show, so a learner who
// is already confident still has work to do.

export function DifferentialCommit({
  stageId,
  isFirst,
  prompt,
  options,
  previous,
  committed,
  prediction,
  predictionPicks,
  onCommit,
}: {
  stageId: StageId;
  isFirst: boolean;
  prompt: string;
  options: string[];
  previous?: Commit;
  committed?: Commit;
  prediction?: Prediction;
  predictionPicks?: string[];
  onCommit: (c: Commit, predictionPicks: string[]) => void;
}) {
  const seed = committed ?? previous;
  const [selected, setSelected] = useState<string[]>(seed?.selected ?? []);
  const [leading, setLeading] = useState<string>(seed?.leading ?? "");
  const [confidence, setConfidence] = useState<number>(seed?.confidence ?? 50);
  const [reasoning, setReasoning] = useState<string>(committed?.reasoning ?? "");
  const [revising, setRevising] = useState<boolean>(isFirst);
  const [picks, setPicks] = useState<string[]>(predictionPicks ?? []);

  // Arriving at a new stage: carry the standing differential forward.
  useEffect(() => {
    const s = committed ?? previous;
    setSelected(s?.selected ?? []);
    setLeading(s?.leading ?? "");
    setConfidence(s?.confidence ?? 50);
    setReasoning(committed?.reasoning ?? "");
    setRevising(isFirst);
    setPicks(predictionPicks ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  const toggle = (dx: string) => {
    const has = selected.includes(dx);
    const next = has ? selected.filter((d) => d !== dx) : [...selected, dx];
    setSelected(next);
    if (has && leading === dx) setLeading(next[0] ?? "");
    else if (!has && !leading) setLeading(dx);
  };

  const togglePick = (id: string) =>
    setPicks((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const effectiveLeading = leading || selected[0] || "";
  const canCommit = selected.length > 0;
  const changed =
    previous !== undefined &&
    (effectiveLeading !== previous.leading ||
      selected.length !== previous.selected.length ||
      selected.some((d) => !previous.selected.includes(d)));

  const submit = () =>
    onCommit(
      {
        stageId,
        leading: effectiveLeading,
        selected,
        confidence,
        reasoning: reasoning.trim() || undefined,
      },
      picks,
    );

  return (
    <div className="commit card card-pad stack">
      <div className="commit-prompt">{prompt}</div>

      {/* Standing differential — the carry-forward summary. */}
      {!isFirst && (
        <div className="standing">
          <div className="standing-main">
            <span className="standing-label">Standing call</span>
            <span className="standing-dx">{effectiveLeading || "—"}</span>
            <span className="muted">
              {selected.length > 1
                ? `+${selected.length - 1} more in differential`
                : "only pick in differential"}
            </span>
          </div>
          <button
            className="btn btn-sm"
            onClick={() => setRevising((r) => !r)}
            aria-expanded={revising}
          >
            {revising ? "Done revising" : "Revise differential"}
          </button>
        </div>
      )}

      {(isFirst || revising) && (
        <div className="dx-options">
          {options.map((dx) => {
            const active = selected.includes(dx);
            const isLead = effectiveLeading === dx;
            return (
              <div key={dx} className={`dx-option${active ? " active" : ""}`}>
                <button
                  className="dx-toggle"
                  onClick={() => toggle(dx)}
                  aria-pressed={active}
                >
                  <span className="dx-check" aria-hidden>
                    {active ? "✓" : ""}
                  </span>
                  {dx}
                </button>
                {active && (
                  <button
                    className={`dx-lead${isLead ? " lead" : ""}`}
                    onClick={() => setLeading(dx)}
                    title="Mark as your leading diagnosis"
                  >
                    {isLead ? "★ leading" : "make leading"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="commit-controls">
        <label className="confidence">
          <span className="secondary">
            Confidence in <strong>{effectiveLeading || "your pick"}</strong>:{" "}
            <strong>{confidence}%</strong>
            {previous && confidence !== previous.confidence && (
              <span
                className={
                  confidence > previous.confidence ? "conf-up" : "conf-down"
                }
              >
                {" "}
                ({confidence > previous.confidence ? "+" : ""}
                {confidence - previous.confidence})
              </span>
            )}
          </span>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
          />
        </label>
        <textarea
          className="reasoning"
          placeholder="Optional: what in this layer moved you? (logged in your trajectory)"
          value={reasoning}
          onChange={(e) => setReasoning(e.target.value)}
          rows={2}
        />
      </div>

      {/* Prediction — makes confidence falsifiable. */}
      {prediction && (
        <div className="predict">
          <div className="predict-head">
            <span className="predict-tag">Before you look</span>
            <span className="predict-q">{prediction.question}</span>
          </div>
          <div className="muted predict-hint">{prediction.hint}</div>
          <div className="predict-options">
            {prediction.options.map((o) => (
              <button
                key={o.id}
                className={`predict-chip${picks.includes(o.id) ? " picked" : ""}`}
                onClick={() => togglePick(o.id)}
                aria-pressed={picks.includes(o.id)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="row spread wrap commit-actions">
        <span className="muted">
          {canCommit
            ? changed
              ? "Differential changed — this will be logged."
              : "No change to your differential."
            : "Pick at least one diagnosis."}
        </span>
        <button className="btn btn-primary" disabled={!canCommit} onClick={submit}>
          {isFirst
            ? "Commit & reveal next"
            : changed
              ? "Update & reveal next →"
              : "Nothing changed — reveal next →"}
        </button>
      </div>
    </div>
  );
}
