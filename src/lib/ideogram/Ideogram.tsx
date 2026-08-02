import { Fragment, useId } from "react";
import { CYTOBANDS, type CytoBand } from "./cytobands";
import { resolveBand, stainVar } from "./geometry";

// SVG ideogram rendering. Chromosomes are drawn vertically (pter at top),
// bands filled by Giemsa stain via CSS variables so they adapt to light/dark
// themes. Breakpoints are marked; translocations get a schematic of both
// derivative chromosomes with origin-tinted segments.

const DEFAULT_HEIGHT = 300;
const CHR_WIDTH = 30;

interface BandRectsProps {
  chr: string;
  /** ISCN coord range to draw (defaults to whole chromosome). */
  from?: number;
  to?: number;
  /** Pixel range to map the coord range onto. */
  y0: number;
  y1: number;
  width: number;
  clipId: string;
}

/** Draw the band rects for a chromosome (or a sub-range) into a pixel span. */
function BandRects({ chr, from, to, y0, y1, width, clipId }: BandRectsProps) {
  const ideo = CYTOBANDS[chr];
  if (!ideo) return null;
  const lo = from ?? 0;
  const hi = to ?? ideo.length;
  const scale = (y1 - y0) / (hi - lo);
  const bands = ideo.bands.filter((b) => b.stop > lo && b.start < hi);
  return (
    <g clipPath={`url(#${clipId})`}>
      {bands.map((b) => {
        const bStart = Math.max(b.start, lo);
        const bStop = Math.min(b.stop, hi);
        const ry0 = y0 + (bStart - lo) * scale;
        const ry1 = y0 + (bStop - lo) * scale;
        return (
          <rect
            key={b.name}
            x={0}
            y={ry0}
            width={width}
            height={Math.max(0.6, ry1 - ry0)}
            fill={stainVar(b.stain)}
          />
        );
      })}
    </g>
  );
}

interface ChromosomeSVGProps {
  chr: string;
  height?: number;
  width?: number;
  /** Band labels to mark with a breakpoint line, e.g. ["q34"]. */
  highlights?: string[];
  label?: string;
  /** Draw arm/band ticks on the left. */
  showScale?: boolean;
}

/** A single, whole chromosome with optional breakpoint markers. */
export function ChromosomeSVG({
  chr,
  height = DEFAULT_HEIGHT,
  width = CHR_WIDTH,
  highlights = [],
  label,
  showScale = true,
}: ChromosomeSVGProps) {
  const ideo = CYTOBANDS[chr];
  const uid = useId().replace(/:/g, "");
  const clipId = `clip-${uid}`;
  if (!ideo) {
    return <div className="ideo-missing">No ideogram for chr {chr}</div>;
  }

  const scale = height / ideo.length;
  const ycen = ideo.centromere * scale;
  const rx = width * 0.5;
  const padTop = 22;
  const svgW = width + 108;
  const svgH = height + padTop + 18;

  const marks = highlights
    .map((h) => resolveBand(chr, h))
    .filter((b): b is NonNullable<typeof b> => b !== null);

  return (
    <svg
      className="ideo-chr"
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      role="img"
      aria-label={`Ideogram of chromosome ${chr}${
        marks.length ? `, breakpoint at ${marks.map((m) => m.query).join(", ")}` : ""
      }`}
    >
      <text x={width / 2} y={14} className="ideo-label" textAnchor="middle">
        {label ?? chr}
      </text>
      <g transform={`translate(0, ${padTop})`}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={width} height={height} rx={rx} ry={rx} />
          </clipPath>
        </defs>

        <BandRects chr={chr} y0={0} y1={height} width={width} clipId={clipId} />

        {/* Centromere pinch — two notches biting into the sides. */}
        <path
          d={`M0 ${ycen - 5} L${width * 0.32} ${ycen} L0 ${ycen + 5} Z`}
          className="ideo-notch"
        />
        <path
          d={`M${width} ${ycen - 5} L${width * 0.68} ${ycen} L${width} ${
            ycen + 5
          } Z`}
          className="ideo-notch"
        />

        {/* Outline. */}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={rx}
          ry={rx}
          className="ideo-outline"
        />

        {/* p/q arm labels. */}
        {showScale && (
          <>
            <text x={-6} y={ycen / 2} className="ideo-arm" textAnchor="end">
              p
            </text>
            <text
              x={-6}
              y={ycen + (height - ycen) / 2}
              className="ideo-arm"
              textAnchor="end"
            >
              q
            </text>
          </>
        )}

        {/* Breakpoint markers. */}
        {marks.map((m) => {
          const y = m.mid * scale;
          return (
            <g key={m.query} className="ideo-break">
              <line x1={width + 2} y1={y} x2={width + 16} y2={y} />
              <polygon
                points={`${width + 2},${y} ${width + 9},${y - 4} ${width + 9},${
                  y + 4
                }`}
              />
              <text x={width + 20} y={y + 3.5} className="ideo-break-label">
                {chr}
                {m.query}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}

interface Segment {
  chr: string;
  from: number;
  to: number;
  origin: "a" | "b";
}

function DerivativeSVG({
  segments,
  label,
  height,
  width = CHR_WIDTH,
}: {
  segments: Segment[];
  label: string;
  height: number;
  width?: number;
}) {
  const uid = useId().replace(/:/g, "");
  const clipId = `clip-der-${uid}`;
  const totalLen = segments.reduce((s, seg) => s + (seg.to - seg.from), 0);
  const scale = height / totalLen;
  const rx = width * 0.5;
  const padTop = 22;
  const svgW = width + 40;
  const svgH = height + padTop + 18;

  let cursor = 0;
  const placed = segments.map((seg) => {
    const h = (seg.to - seg.from) * scale;
    const y0 = cursor;
    cursor += h;
    return { seg, y0, y1: cursor };
  });

  return (
    <svg
      className="ideo-chr"
      width={svgW}
      height={svgH}
      viewBox={`0 0 ${svgW} ${svgH}`}
      role="img"
      aria-label={`Derivative chromosome ${label}`}
    >
      <text x={width / 2} y={14} className="ideo-label" textAnchor="middle">
        {label}
      </text>
      <g transform={`translate(0, ${padTop})`}>
        <defs>
          <clipPath id={clipId}>
            <rect x={0} y={0} width={width} height={height} rx={rx} ry={rx} />
          </clipPath>
        </defs>
        {placed.map(({ seg, y0, y1 }, i) => (
          <Fragment key={i}>
            <BandRects
              chr={seg.chr}
              from={seg.from}
              to={seg.to}
              y0={y0}
              y1={y1}
              width={width}
              clipId={clipId}
            />
            <rect
              x={0}
              y={y0}
              width={width}
              height={y1 - y0}
              clipPath={`url(#${clipId})`}
              className={`ideo-origin ideo-origin-${seg.origin}`}
            />
          </Fragment>
        ))}
        {/* Fusion junctions. */}
        {placed.slice(1).map(({ y0 }, i) => (
          <line
            key={i}
            x1={-2}
            y1={y0}
            x2={width + 2}
            y2={y0}
            className="ideo-fusion"
          />
        ))}
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          rx={rx}
          ry={rx}
          className="ideo-outline"
        />
      </g>
    </svg>
  );
}

/** Full translocation schematic: normal A, normal B, der(A), der(B). */
export function TranslocationDiagram({
  chrA,
  bandA,
  chrB,
  bandB,
}: {
  chrA: string;
  bandA: string;
  chrB: string;
  bandB: string;
}) {
  const a = resolveBand(chrA, bandA);
  const b = resolveBand(chrB, bandB);
  const ideoA = CYTOBANDS[chrA];
  const ideoB = CYTOBANDS[chrB];
  if (!a || !b || !ideoA || !ideoB) {
    return (
      <div className="ideo-missing">
        Cannot draw t({chrA};{chrB}) — unresolved breakpoint.
      </div>
    );
  }

  const H = 300;
  const derA: Segment[] = [
    { chr: chrA, from: 0, to: a.mid, origin: "a" },
    { chr: chrB, from: b.mid, to: ideoB.length, origin: "b" },
  ];
  const derB: Segment[] = [
    { chr: chrB, from: 0, to: b.mid, origin: "b" },
    { chr: chrA, from: a.mid, to: ideoA.length, origin: "a" },
  ];

  return (
    <div className="ideo-translocation">
      <div className="ideo-group">
        <div className="ideo-group-title">Normal homologs</div>
        <div className="ideo-row">
          <ChromosomeSVG chr={chrA} highlights={[bandA]} height={H} />
          <ChromosomeSVG chr={chrB} highlights={[bandB]} height={H} />
        </div>
      </div>
      <div className="ideo-arrow" aria-hidden>
        →
      </div>
      <div className="ideo-group">
        <div className="ideo-group-title">Derivatives</div>
        <div className="ideo-row">
          <DerivativeSVG
            segments={derA}
            label={`der(${chrA})`}
            height={
              H *
              ((a.mid + (ideoB.length - b.mid)) /
                Math.max(ideoA.length, ideoB.length))
            }
          />
          <DerivativeSVG
            segments={derB}
            label={`der(${chrB})`}
            height={
              H *
              ((b.mid + (ideoA.length - a.mid)) /
                Math.max(ideoA.length, ideoB.length))
            }
          />
        </div>
      </div>
    </div>
  );
}

/** Stain legend. */
export function IdeogramLegend() {
  const items: { stain: CytoBand["stain"]; label: string }[] = [
    { stain: "gneg", label: "gneg" },
    { stain: "gpos25", label: "gpos25" },
    { stain: "gpos50", label: "gpos50" },
    { stain: "gpos75", label: "gpos75" },
    { stain: "gpos100", label: "gpos100" },
    { stain: "acen", label: "centromere" },
    { stain: "gvar", label: "variable" },
  ];
  return (
    <div className="ideo-legend">
      {items.map((it) => (
        <span key={it.stain} className="ideo-legend-item">
          <span
            className="ideo-legend-swatch"
            style={{ background: stainVar(it.stain) }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}
