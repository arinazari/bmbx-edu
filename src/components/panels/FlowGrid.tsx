import { useMemo, useState } from "react";
import type { FlowResult } from "../../types/case";
import { LINEAGE_LABEL, LINEAGE_ORDER, type Lineage } from "../../types/case";
import { lookupMarker, markersForLineage } from "../../lib/flow/markers";
import {
  flagAberrancies,
  flaggedMarkerSet,
  inferFlowContext,
} from "../../lib/flow/teaching";
import { ExprTag } from "../ui";

// The lineage grid: markers as a clickable matrix organized by lineage, each
// cell showing the case's expression, with auto-flagged teaching points.

export function FlowGrid({ flow }: { flow: FlowResult }) {
  const [selected, setSelected] = useState<string | null>(null);

  const context = useMemo(() => inferFlowContext(flow), [flow]);
  const flags = useMemo(() => flagAberrancies(flow, context), [flow, context]);
  const flagged = useMemo(
    () => flaggedMarkerSet(flow, context),
    [flow, context],
  );

  // Map case readings by marker for quick lookup.
  const readings = useMemo(() => {
    const map = new Map<string, FlowResult["markers"][number]>();
    for (const m of flow.markers) map.set(m.marker.toUpperCase(), m);
    return map;
  }, [flow]);

  // Only show lineage columns that have at least one tested marker, plus the
  // core myeloid/stem columns for orientation.
  const lineages = LINEAGE_ORDER.filter((lin) =>
    markersForLineage(lin).some((m) => readings.has(m.marker.toUpperCase())),
  );

  const selectedInfo = selected ? lookupMarker(selected) : null;
  const selectedReading = selected
    ? readings.get(selected.toUpperCase())
    : null;
  const selectedFlag = selected
    ? flags.find((f) => f.marker.toUpperCase() === selected.toUpperCase())
    : null;

  return (
    <div className="flow-grid-wrap stack">
      <div className="flow-gate">
        <span className="section-title">Blast gate</span>
        <div className="secondary">
          {flow.gate ?? "Not specified"}
          {flow.populationPercent !== undefined
            ? ` · ${flow.populationPercent}% of events`
            : ""}
        </div>
        <div className="muted flow-context">
          Inferred population: <strong>{contextLabel(context)}</strong>
        </div>
      </div>

      {flags.length > 0 && (
        <div className="flow-flags card card-pad">
          <div className="section-title">Auto-flagged teaching points</div>
          <ul className="flag-list">
            {flags.map((f, i) => (
              <li key={i} className="flag-item">
                <span className="flag-name">
                  {f.flag} <ExprTag expression={f.expression} aberrant />
                </span>
                <span className="secondary">{f.significance}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="scroll-x">
        <div className="lineage-grid">
          {lineages.map((lin) => (
            <LineageColumn
              key={lin}
              lineage={lin}
              readings={readings}
              flagged={flagged}
              selected={selected}
              onSelect={setSelected}
            />
          ))}
        </div>
      </div>

      {selectedInfo && (
        <div className="marker-detail card card-pad">
          <div className="row spread wrap">
            <h4>
              {selectedInfo.marker}
              {selectedInfo.aliases?.length
                ? ` · ${selectedInfo.aliases.join(", ")}`
                : ""}
            </h4>
            {selectedReading ? (
              <span className="pill">
                this case: {selectedReading.expression}
                {selectedReading.note ? ` (${selectedReading.note})` : ""}
              </span>
            ) : null}
          </div>
          <p className="secondary">{selectedInfo.whatItIs}</p>
          <p>
            <strong>Normal expression.</strong> {selectedInfo.normalExpression}
          </p>
          {selectedFlag && (
            <div className="marker-flag">
              <strong>Why it is flagged here.</strong> {selectedFlag.significance}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function contextLabel(ctx: string): string {
  const map: Record<string, string> = {
    myeloblast: "myeloblasts",
    monoblast: "monoblasts",
    bcell: "B cells",
    blast_bcell: "B lymphoblasts",
    tcell: "T cells",
    blast_tcell: "T lymphoblasts",
    plasma: "plasma cells",
    any: "unspecified",
  };
  return map[ctx] ?? ctx;
}

function LineageColumn({
  lineage,
  readings,
  flagged,
  selected,
  onSelect,
}: {
  lineage: Lineage;
  readings: Map<string, FlowResult["markers"][number]>;
  flagged: Set<string>;
  selected: string | null;
  onSelect: (m: string) => void;
}) {
  const markers = markersForLineage(lineage);
  return (
    <div className="lineage-col">
      <div className={`lineage-head lin-${lineage}`}>
        {LINEAGE_LABEL[lineage]}
      </div>
      <div className="lineage-markers">
        {markers.map((m) => {
          const key = m.marker.toUpperCase();
          const reading = readings.get(key);
          const isFlagged = flagged.has(key);
          const isSelected = selected?.toUpperCase() === key;
          return (
            <button
              key={m.marker}
              className={`marker-cell${reading ? "" : " untested"}${
                isFlagged ? " flagged" : ""
              }${isSelected ? " selected" : ""}`}
              onClick={() => onSelect(m.marker)}
              title={m.whatItIs}
            >
              <span className="marker-name">{m.marker}</span>
              {reading ? (
                <ExprTag expression={reading.expression} aberrant={isFlagged} />
              ) : (
                <span className="expr-tag expr-untested">·</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
