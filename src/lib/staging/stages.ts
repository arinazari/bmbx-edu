import type { StageId } from "../../types/case";

// The progressive-disclosure spine. Each stage reveals one layer of the workup;
// after most reveals the learner (re)commits a differential, and the engine logs
// the trajectory so the "what changed your mind" story can be reconstructed.

export interface StageMeta {
  id: StageId;
  index: number;
  title: string;
  subtitle: string;
  /** Prompt shown at the commit step for this stage. */
  commitPrompt: string;
  /** Whether the learner records/updates a differential after this reveal. */
  commits: boolean;
}

export const STAGES: StageMeta[] = [
  {
    id: "presentation",
    index: 0,
    title: "Presentation & counts",
    subtitle: "Vignette, CBC, and the blast percentage",
    commitPrompt:
      "From the history and the counts alone, what is your differential? Commit before you see anything else.",
    commits: true,
  },
  {
    id: "morphology",
    index: 1,
    title: "Morphology",
    subtitle: "Peripheral smear and marrow aspirate / core",
    commitPrompt:
      "Did the cells change your mind? If not, say so and move on — but commit to what you expect flow to show.",
    commits: true,
  },
  {
    id: "flow",
    index: 2,
    title: "Flow immunophenotype",
    subtitle: "Lineage assignment and aberrancies",
    commitPrompt:
      "Flow has assigned lineage. Adjust only if it moved you — then predict the karyotype.",
    commits: true,
  },
  {
    id: "cytogenetics",
    index: 3,
    title: "Cytogenetics",
    subtitle: "Karyotype and FISH",
    commitPrompt:
      "Cytogenetics is often the pivot. Did a defining abnormality just appear?",
    commits: true,
  },
  {
    id: "molecular",
    index: 4,
    title: "Molecular (NGS)",
    subtitle: "Mutations, with diagnostic / prognostic / predictive weight",
    commitPrompt:
      "Last call before the integrated answer. Lock in your final diagnosis.",
    commits: true,
  },
  {
    id: "integration",
    index: 5,
    title: "Integrated diagnosis",
    subtitle: "WHO5 vs ICC, ELN / IPSS-R, and the management picture",
    commitPrompt: "",
    commits: false,
  },
];

export function stageMeta(id: StageId): StageMeta {
  return STAGES.find((s) => s.id === id) ?? STAGES[0];
}

export interface Commit {
  stageId: StageId;
  /** The learner's leading diagnosis at this point. */
  leading: string;
  /** The active differential set (includes the leading pick). */
  selected: string[];
  /** Self-rated confidence, 0–100. */
  confidence: number;
  reasoning?: string;
}

export interface CommitDelta {
  added: string[];
  removed: string[];
  leadingChanged: { from: string; to: string } | null;
  confidenceDelta: number;
}

/** Compute what changed between two consecutive commits. */
export function diffCommits(prev: Commit, next: Commit): CommitDelta {
  const prevSet = new Set(prev.selected);
  const nextSet = new Set(next.selected);
  return {
    added: next.selected.filter((d) => !prevSet.has(d)),
    removed: prev.selected.filter((d) => !nextSet.has(d)),
    leadingChanged:
      prev.leading !== next.leading
        ? { from: prev.leading, to: next.leading }
        : null,
    confidenceDelta: next.confidence - prev.confidence,
  };
}

export interface TrajectoryEntry {
  stageId: StageId;
  commit: Commit;
  delta: CommitDelta | null;
}

/** Build the ordered trajectory with per-step deltas. */
export function buildTrajectory(commits: Commit[]): TrajectoryEntry[] {
  return commits.map((commit, i) => ({
    stageId: commit.stageId,
    commit,
    delta: i > 0 ? diffCommits(commits[i - 1], commit) : null,
  }));
}
