import { useMemo } from "react";
import type { Cytogenetics } from "../../types/case";
import type { Abnormality } from "../../types/cytogenetics";
import { parseKaryotype } from "../../lib/iscn/parser";
import { identifyRecurrent } from "../../lib/iscn/recurrent";
import {
  ChromosomeSVG,
  IdeogramLegend,
  TranslocationDiagram,
} from "../../lib/ideogram/Ideogram";
import { ElnBadge, PrimerLink, RoleBadge } from "../ui";

// Turns the raw ISCN string into a parsed, plain-English, drawn karyotype and
// links each recurrent abnormality to its entity, gene, and risk.

export function KaryotypePanel({ cyto }: { cyto: Cytogenetics }) {
  const iscn = cyto.karyotypeISCN ?? "";
  const k = useMemo(() => parseKaryotype(iscn), [iscn]);
  const recurrent = useMemo(() => identifyRecurrent(k), [k]);

  const clonePct = (count: number | null) =>
    count !== null && k.totalCells
      ? Math.round((count / k.totalCells) * 100)
      : null;

  const structural = k.clones
    .flatMap((c) => c.abnormalities)
    .filter((a) => a.kind !== "gain" && a.kind !== "loss");

  return (
    <div className="karyo-panel stack">
      <div className="karyo-header">
        <code className="karyo-iscn">{iscn}</code>
        <div className="karyo-flags">
          {k.complexKaryotype && (
            <span className="pill pill-bad">complex (≥3)</span>
          )}
          {k.monosomalKaryotype && (
            <span className="pill pill-bad">monosomal</span>
          )}
          {k.clonalFraction !== null && (
            <span className="pill">
              clonal fraction {Math.round(k.clonalFraction * 100)}%
            </span>
          )}
        </div>
      </div>

      {k.errors.length > 0 && (
        <div className="karyo-errors">
          {k.errors.map((e, i) => (
            <div key={i} className="muted">
              ⚠ {e}
            </div>
          ))}
        </div>
      )}

      {/* Clones */}
      <div className="clones stack">
        {k.clones.map((clone, ci) => (
          <div key={ci} className="clone card card-pad">
            <div className="row spread wrap">
              <div className="row wrap" style={{ gap: 8 }}>
                <span className="pill">{clone.raw}</span>
                <span className="muted">
                  {clone.ploidy}
                  {clone.sex ? ` · ${clone.sex}` : ""}
                </span>
              </div>
              {clone.cellCount !== null && (
                <span className="muted">
                  {clone.composite ? "composite " : ""}
                  {clone.cellCount} cells
                  {clonePct(clone.cellCount) !== null
                    ? ` · ${clonePct(clone.cellCount)}% of scored`
                    : ""}
                </span>
              )}
            </div>
            {clone.isNormal ? (
              <p className="secondary">Normal metaphases — no abnormality.</p>
            ) : (
              <ul className="abn-list">
                {clone.abnormalities.map((a, ai) => (
                  <li key={ai}>
                    <code className="abn-raw">{a.raw}</code>
                    <span className="secondary"> {a.text}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Recurrent abnormality knowledge */}
      {recurrent.length > 0 && (
        <div className="recurrent stack">
          <div className="section-title">Recurrent abnormalities</div>
          {recurrent.map((m, i) => (
            <div key={i} className="recurrent-item card card-pad">
              <div className="row spread wrap">
                <h4>
                  <PrimerLink entity={primerFor(m.entry.gene)}>
                    {m.entry.label} · {m.entry.gene}
                  </PrimerLink>
                </h4>
                <div className="row wrap" style={{ gap: 6 }}>
                  {m.entry.eln2022 && <ElnBadge risk={m.entry.eln2022} />}
                  {m.entry.roles.map((r) => (
                    <RoleBadge key={r} role={r} />
                  ))}
                </div>
              </div>
              <div className="secondary">{m.entry.entity}</div>
              <p>{m.entry.meaning}</p>
              <div className="grid-2">
                {m.entry.who5 && (
                  <div className="mini-note">
                    <span className="mini-note-tag">WHO5</span> {m.entry.who5}
                  </div>
                )}
                {m.entry.icc && (
                  <div className="mini-note">
                    <span className="mini-note-tag">ICC</span> {m.entry.icc}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Ideograms */}
      <div className="ideograms card card-pad stack">
        <div className="section-title">Ideogram</div>
        {structural.length === 0 && (
          <div className="secondary">
            No structural rearrangement to draw
            {k.clones.some((c) => !c.isNormal)
              ? " (numerical changes only)."
              : "."}
          </div>
        )}
        {structural.map((abn, i) => (
          <AbnormalityIdeogram key={i} abn={abn} />
        ))}
        <IdeogramLegend />
      </div>
    </div>
  );
}

function AbnormalityIdeogram({ abn }: { abn: Abnormality }) {
  if (abn.kind === "translocation" && abn.chromosomes.length === 2) {
    const bpA = abn.breakpoints.find((b) => b.chr === abn.chromosomes[0]);
    const bpB = abn.breakpoints.find((b) => b.chr === abn.chromosomes[1]);
    if (bpA?.band && bpB?.band) {
      return (
        <div className="abn-ideo">
          <div className="abn-ideo-title mono">{abn.raw}</div>
          <TranslocationDiagram
            chrA={abn.chromosomes[0]}
            bandA={bpA.band}
            chrB={abn.chromosomes[1]}
            bandB={bpB.band}
          />
        </div>
      );
    }
  }
  // Single-chromosome structural change: show the chromosome with breakpoints.
  const chr = abn.chromosomes[0];
  if (!chr) return null;
  const bands = abn.breakpoints
    .filter((b) => b.chr === chr)
    .map((b) => b.band)
    .filter((b): b is string => Boolean(b));
  return (
    <div className="abn-ideo">
      <div className="abn-ideo-title mono">{abn.raw}</div>
      <div className="ideo-row">
        <ChromosomeSVG chr={chr} highlights={bands} />
      </div>
    </div>
  );
}

function primerFor(gene: string): string | undefined {
  const g = gene.toLowerCase();
  if (g.includes("bcr")) return "bcr-abl1";
  if (g.includes("runx1")) return "runx1";
  if (g.includes("cbfb")) return "cbfb-myh11";
  if (g.includes("pml")) return "pml-rara";
  if (g.includes("kmt2a")) return "kmt2a";
  if (g.includes("mecom")) return "mecom";
  return undefined;
}
