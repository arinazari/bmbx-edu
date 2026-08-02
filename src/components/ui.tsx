import { useState, type ReactNode } from "react";
import type { ElnRisk, FindingRole } from "../types/findings";
import { ELN_LABEL, ROLE_LABEL } from "../types/findings";
import type { MarkerExpression } from "../types/case";
import type { Step } from "../lib/classify/types";
import { useApp } from "../context";
import { primerUrl } from "../lib/primers/primers";

export function RoleBadge({ role }: { role: FindingRole }) {
  return (
    <span className={`role-badge role-${role}`} title={ROLE_LABEL[role]}>
      {ROLE_LABEL[role]}
    </span>
  );
}

export function ElnBadge({ risk }: { risk: ElnRisk }) {
  return <span className={`eln-badge eln-${risk}`}>{ELN_LABEL[risk]}</span>;
}

const EXPR_SYMBOL: Record<MarkerExpression, string> = {
  positive: "+",
  bright: "++",
  dim: "dim",
  subset: "±",
  negative: "−",
  aberrant: "!",
};

export function ExprTag({
  expression,
  aberrant,
}: {
  expression: MarkerExpression;
  aberrant?: boolean;
}) {
  return (
    <span
      className={`expr-tag expr-${expression}${aberrant ? " expr-flagged" : ""}`}
    >
      {EXPR_SYMBOL[expression]}
    </span>
  );
}

export function StepList({ steps }: { steps: Step[] }) {
  return (
    <ol className="step-list">
      {steps.map((s, i) => (
        <li key={i} className={s.decisive ? "step decisive" : "step"}>
          <div className="step-label">{s.label}</div>
          <div className="step-detail secondary">{s.detail}</div>
        </li>
      ))}
    </ol>
  );
}

export function Stat({
  label,
  value,
  unit,
  flag,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  flag?: "low" | "high" | "none";
}) {
  return (
    <div className={`stat${flag && flag !== "none" ? ` stat-${flag}` : ""}`}>
      <div className="stat-value">
        {value}
        {unit ? <span className="stat-unit"> {unit}</span> : null}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export function PrimerLink({
  entity,
  children,
}: {
  entity?: string;
  children?: ReactNode;
}) {
  const { primerConfig } = useApp();
  if (!entity) return <>{children}</>;
  const url = primerUrl(entity, primerConfig);
  if (!url) return <>{children}</>;
  return (
    <a
      className="primer-link"
      href={url}
      target="_blank"
      rel="noreferrer"
      title={`Open the ${entity} primer`}
    >
      {children}
      <span className="primer-arrow" aria-hidden>
        ↗
      </span>
    </a>
  );
}

export function Collapsible({
  summary,
  children,
  defaultOpen = false,
  tone,
}: {
  summary: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "flag";
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapsible${tone === "flag" ? " collapsible-flag" : ""}`}>
      <button
        className="collapsible-head"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={`chevron${open ? " open" : ""}`} aria-hidden>
          ▸
        </span>
        <span className="collapsible-summary">{summary}</span>
      </button>
      {open ? <div className="collapsible-body">{children}</div> : null}
    </div>
  );
}
