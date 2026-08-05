import { useMemo, useState } from "react";
import type { HemeCase, StageId } from "../types/case";
import { STAGES } from "../lib/staging/stages";
import type { Commit } from "../lib/staging/stages";
import {
  buildPredictions,
  predictionAskedAt,
  predictionResolvedAt,
} from "../lib/predict/predictions";
import { DifferentialCommit } from "./DifferentialCommit";
import { PredictionResult } from "./PredictionResult";
import { Trajectory } from "./Trajectory";
import {
  CytogeneticsView,
  FlowView,
  IntegrationView,
  MolecularView,
  MorphologyView,
  PresentationView,
} from "./stages/StageViews";

export function Workspace({ case: c }: { case: HemeCase }) {
  const [commits, setCommits] = useState<Record<string, Commit>>({});
  const [predictions, setPredictions] = useState<Record<string, string[]>>({});
  const [maxRevealed, setMaxRevealed] = useState(0);
  const [current, setCurrent] = useState(0);

  const stage = STAGES[current];
  const isLast = current === STAGES.length - 1;

  const allPredictions = useMemo(() => buildPredictions(c), [c]);
  const askHere = predictionAskedAt(allPredictions, stage.id);
  const resolveHere = predictionResolvedAt(allPredictions, stage.id);

  // Ordered commits (by stage order) for the trajectory.
  const orderedCommits = useMemo(
    () =>
      STAGES.map((s) => commits[s.id]).filter((x): x is Commit => Boolean(x)),
    [commits],
  );

  // The most recent commit strictly before the current stage.
  const previousCommit = useMemo(() => {
    for (let i = current - 1; i >= 0; i--) {
      const s = STAGES[i];
      if (commits[s.id]) return commits[s.id];
    }
    return undefined;
  }, [commits, current]);

  const handleCommit = (commit: Commit, picks: string[]) => {
    setCommits((prev) => ({ ...prev, [commit.stageId]: commit }));
    if (askHere) {
      setPredictions((prev) => ({ ...prev, [askHere.askAt]: picks }));
    }
    if (current === maxRevealed && current < STAGES.length - 1) {
      setMaxRevealed(current + 1);
      setCurrent(current + 1);
    }
  };

  const canAdvance =
    !stage.commits || Boolean(commits[stage.id]) || current < maxRevealed;

  return (
    <div className="workspace">
      <ol className="stepper" role="tablist">
        {STAGES.map((s, i) => {
          const done = Boolean(commits[s.id]);
          const reachable = i <= maxRevealed;
          const active = i === current;
          return (
            <li key={s.id} className="stepper-item">
              <button
                className={`stepper-btn${active ? " active" : ""}${
                  done ? " done" : ""
                }${reachable ? "" : " locked"}`}
                disabled={!reachable}
                onClick={() => reachable && setCurrent(i)}
                role="tab"
                aria-selected={active}
              >
                <span className="stepper-index">
                  {done ? "✓" : i + 1}
                </span>
                <span className="stepper-label">{s.title}</span>
              </button>
              {i < STAGES.length - 1 && <span className="stepper-line" />}
            </li>
          );
        })}
      </ol>

      <div className="stage-head">
        <h2 className="stage-title">{stage.title}</h2>
        <p className="muted stage-subtitle">{stage.subtitle}</p>
      </div>

      {resolveHere && predictions[resolveHere.askAt] && (
        <PredictionResult
          prediction={resolveHere}
          picks={predictions[resolveHere.askAt]}
        />
      )}

      <div className="stage-content">
        <StageBody
          stageId={stage.id}
          case={c}
          trajectory={
            isLast ? <Trajectory commits={orderedCommits} case={c} /> : undefined
          }
        />
      </div>

      {stage.commits && (
        <DifferentialCommit
          stageId={stage.id}
          isFirst={current === 0}
          prompt={stage.commitPrompt}
          options={c.differentialOptions}
          previous={previousCommit}
          committed={commits[stage.id]}
          prediction={askHere}
          predictionPicks={predictions[stage.id]}
          onCommit={handleCommit}
        />
      )}

      <div className="stage-nav">
        <button
          className="btn"
          disabled={current === 0}
          onClick={() => setCurrent((i) => Math.max(0, i - 1))}
        >
          ← Back
        </button>
        {!isLast && (
          <button
            className="btn btn-primary"
            disabled={!canAdvance}
            onClick={() => {
              const next = Math.min(STAGES.length - 1, current + 1);
              setMaxRevealed((m) => Math.max(m, next));
              setCurrent(next);
            }}
            title={
              canAdvance
                ? "Reveal the next layer"
                : "Commit a differential to reveal the next layer"
            }
          >
            Reveal next layer →
          </button>
        )}
      </div>
    </div>
  );
}

function StageBody({
  stageId,
  case: c,
  trajectory,
}: {
  stageId: StageId;
  case: HemeCase;
  trajectory?: React.ReactNode;
}) {
  switch (stageId) {
    case "presentation":
      return <PresentationView case={c} />;
    case "morphology":
      return <MorphologyView case={c} />;
    case "flow":
      return <FlowView case={c} />;
    case "cytogenetics":
      return <CytogeneticsView case={c} />;
    case "molecular":
      return <MolecularView case={c} />;
    case "integration":
      return <IntegrationView case={c} trajectory={trajectory} />;
  }
}
