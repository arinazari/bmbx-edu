import type { HemeCase } from "../types/case";
import { buildTrajectory, type Commit } from "../lib/staging/stages";
import { stageMeta } from "../lib/staging/stages";

// Reconstructs the "what changed your mind" story from the logged commits: at
// each layer, what entered the differential, what left, whether the leading
// diagnosis flipped, and how confidence moved.

export function Trajectory({
  commits,
  case: c,
}: {
  commits: Commit[];
  case: HemeCase;
}) {
  if (commits.length === 0) return null;
  const entries = buildTrajectory(commits);
  const final = commits[commits.length - 1];
  const matchedAnswer =
    c.teachingDiagnosis &&
    normalize(c.teachingDiagnosis).includes(normalize(final.leading));

  return (
    <div className="trajectory card card-pad stack">
      <div className="section-title">Your reasoning trajectory</div>
      <ol className="traj-list">
        {entries.map((e, i) => {
          const meta = stageMeta(e.stageId);
          return (
            <li key={i} className="traj-entry">
              <div className="traj-stage">{meta.title}</div>
              <div className="traj-body">
                <div className="traj-leading">
                  Leading: <strong>{e.commit.leading}</strong>
                  <span className="muted"> · {e.commit.confidence}%</span>
                </div>
                {e.delta && (
                  <div className="traj-delta">
                    {e.delta.leadingChanged && (
                      <span className="delta-chip delta-flip">
                        switched from {e.delta.leadingChanged.from}
                      </span>
                    )}
                    {e.delta.added.map((d) => (
                      <span key={`a${d}`} className="delta-chip delta-add">
                        +{d}
                      </span>
                    ))}
                    {e.delta.removed.map((d) => (
                      <span key={`r${d}`} className="delta-chip delta-remove">
                        −{d}
                      </span>
                    ))}
                    {e.delta.confidenceDelta !== 0 && (
                      <span
                        className={`delta-chip ${
                          e.delta.confidenceDelta > 0
                            ? "delta-up"
                            : "delta-down"
                        }`}
                      >
                        confidence {e.delta.confidenceDelta > 0 ? "+" : ""}
                        {e.delta.confidenceDelta}%
                      </span>
                    )}
                  </div>
                )}
                {e.commit.reasoning && (
                  <div className="traj-reason secondary">
                    “{e.commit.reasoning}”
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <div className={`traj-verdict ${matchedAnswer ? "match" : "diverge"}`}>
        {matchedAnswer ? (
          <>
            Your final leading diagnosis — <strong>{final.leading}</strong> —
            lines up with the integrated answer.
          </>
        ) : (
          <>
            Your final leading diagnosis was <strong>{final.leading}</strong>.
            Compare it against the integrated diagnosis above and see which layer
            should have moved you.
          </>
        )}
      </div>
    </div>
  );
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
