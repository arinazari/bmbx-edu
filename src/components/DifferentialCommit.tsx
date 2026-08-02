import { useEffect, useState } from "react";
import type { StageId } from "../types/case";
import type { Commit } from "../lib/staging/stages";

// The commit gate: the learner ranks a differential, names a leading diagnosis,
// rates confidence, and (optionally) says why — before the next layer is shown.

export function DifferentialCommit({
  stageId,
  prompt,
  options,
  previous,
  committed,
  onCommit,
}: {
  stageId: StageId;
  prompt: string;
  options: string[];
  previous?: Commit;
  committed?: Commit;
  onCommit: (c: Commit) => void;
}) {
  const seed = committed ?? previous;
  const [selected, setSelected] = useState<string[]>(seed?.selected ?? []);
  const [leading, setLeading] = useState<string>(seed?.leading ?? "");
  const [confidence, setConfidence] = useState<number>(seed?.confidence ?? 50);
  const [reasoning, setReasoning] = useState<string>(committed?.reasoning ?? "");

  // When arriving at a new stage, carry the previous differential forward.
  useEffect(() => {
    const s = committed ?? previous;
    setSelected(s?.selected ?? []);
    setLeading(s?.leading ?? "");
    setConfidence(s?.confidence ?? 50);
    setReasoning(committed?.reasoning ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  const toggle = (dx: string) => {
    const has = selected.includes(dx);
    const next = has ? selected.filter((d) => d !== dx) : [...selected, dx];
    setSelected(next);
    if (has && leading === dx) setLeading(next[0] ?? "");
    else if (!has && !leading) setLeading(dx);
  };

  const effectiveLeading = leading || selected[0] || "";
  const canCommit = selected.length > 0;

  return (
    <div className="commit card card-pad stack">
      <div className="commit-prompt">{prompt}</div>

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

      <div className="commit-controls">
        <label className="confidence">
          <span className="secondary">
            Confidence in your leading pick: <strong>{confidence}%</strong>
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

      <div className="row spread wrap">
        <span className="muted">
          {effectiveLeading ? (
            <>
              Leading: <strong>{effectiveLeading}</strong> · {selected.length} in
              differential
            </>
          ) : (
            "Pick at least one diagnosis."
          )}
        </span>
        <button
          className="btn btn-primary"
          disabled={!canCommit}
          onClick={() =>
            onCommit({
              stageId,
              leading: effectiveLeading,
              selected,
              confidence,
              reasoning: reasoning.trim() || undefined,
            })
          }
        >
          {committed ? "Update commit" : "Commit & reveal next"}
        </button>
      </div>
    </div>
  );
}
