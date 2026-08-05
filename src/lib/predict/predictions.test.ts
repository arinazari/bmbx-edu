import { describe, expect, it } from "vitest";
import {
  buildPredictions,
  predictionAskedAt,
  predictionResolvedAt,
  scorePrediction,
} from "./predictions";
import { apl } from "../../data/cases/apl";
import { amlNpm1Flt3 } from "../../data/cases/amlNpm1Flt3";
import { mdsDel5q } from "../../data/cases/mdsDel5q";
import type { HemeCase } from "../../types/case";

describe("buildPredictions — coverage", () => {
  it("builds flow, cytogenetics, and molecular predictions for a full case", () => {
    const p = buildPredictions(apl);
    expect(p.map((x) => x.resolveAt).sort()).toEqual([
      "cytogenetics",
      "flow",
      "molecular",
    ]);
  });

  it("asks each prediction one stage before it resolves", () => {
    for (const p of buildPredictions(apl)) {
      expect(p.askAt).not.toBe(p.resolveAt);
    }
    expect(predictionAskedAt(buildPredictions(apl), "morphology")?.resolveAt).toBe(
      "flow",
    );
    expect(
      predictionResolvedAt(buildPredictions(apl), "cytogenetics")?.askAt,
    ).toBe("flow");
  });

  it("always offers at least one correct and one incorrect option", () => {
    for (const c of [apl, amlNpm1Flt3, mdsDel5q]) {
      for (const p of buildPredictions(c)) {
        expect(p.options.some((o) => o.correct)).toBe(true);
        expect(p.options.some((o) => !o.correct)).toBe(true);
      }
    }
  });

  it("produces no duplicate option labels", () => {
    for (const p of buildPredictions(apl)) {
      const labels = p.options.map((o) => o.label.toLowerCase());
      expect(new Set(labels).size).toBe(labels.length);
    }
  });

  it("is deterministic across calls", () => {
    const a = buildPredictions(apl).map((p) => p.options.map((o) => o.id));
    const b = buildPredictions(apl).map((p) => p.options.map((o) => o.id));
    expect(a).toEqual(b);
  });
});

describe("buildPredictions — medically meaningful content", () => {
  it("marks the APL phenotype features as correct on the flow question", () => {
    const flow = buildPredictions(apl).find((p) => p.resolveAt === "flow")!;
    const correct = flow.options.filter((o) => o.correct).map((o) => o.label);
    expect(correct.some((l) => /HLA-DR negative/i.test(l))).toBe(true);
    expect(correct.some((l) => /CD34 negative/i.test(l))).toBe(true);
    // And the opposite is offered as a wrong answer.
    const wrong = flow.options.filter((o) => !o.correct).map((o) => o.label);
    expect(wrong.some((l) => /HLA-DR positive|CD34 positive/i.test(l))).toBe(true);
  });

  it("marks t(15;17)/PML::RARA correct on the APL karyotype question", () => {
    const cyto = buildPredictions(apl).find((p) => p.resolveAt === "cytogenetics")!;
    const correct = cyto.options.filter((o) => o.correct).map((o) => o.label);
    expect(correct.some((l) => /PML::RARA/.test(l))).toBe(true);
    const wrong = cyto.options.filter((o) => !o.correct).map((o) => o.label);
    expect(wrong.some((l) => /RUNX1::RUNX1T1|CBFB::MYH11/.test(l))).toBe(true);
  });

  it("treats a normal karyotype as the correct answer when there is one", () => {
    const cyto = buildPredictions(amlNpm1Flt3).find(
      (p) => p.resolveAt === "cytogenetics",
    )!;
    const correct = cyto.options.filter((o) => o.correct).map((o) => o.label);
    expect(correct).toContain("Normal karyotype");
  });

  it("marks the actual mutations correct on the molecular question", () => {
    const mol = buildPredictions(amlNpm1Flt3).find(
      (p) => p.resolveAt === "molecular",
    )!;
    const correct = mol.options.filter((o) => o.correct).map((o) => o.label);
    expect(correct.some((l) => /NPM1/.test(l))).toBe(true);
    expect(correct.some((l) => /FLT3/.test(l))).toBe(true);
  });

  it("uses 'No reportable mutation' when the panel is negative", () => {
    const mol = buildPredictions(mdsDel5q).find(
      (p) => p.resolveAt === "molecular",
    )!;
    const correct = mol.options.filter((o) => o.correct).map((o) => o.label);
    expect(correct).toContain("No reportable mutation");
  });
});

describe("buildPredictions — degrades safely", () => {
  const bare: HemeCase = {
    id: "bare",
    title: "bare",
    vignette: "",
    differentialOptions: ["A", "B"],
  };

  it("returns nothing when the case has no layers to predict", () => {
    expect(buildPredictions(bare)).toEqual([]);
  });

  it("skips only the missing layer", () => {
    const partial: HemeCase = {
      ...bare,
      cytogenetics: { karyotypeISCN: "46,XY[20]" },
    };
    const p = buildPredictions(partial);
    expect(p).toHaveLength(1);
    expect(p[0].resolveAt).toBe("cytogenetics");
  });
});

describe("scorePrediction", () => {
  const flow = buildPredictions(apl).find((p) => p.resolveAt === "flow")!;
  const correctIds = flow.options.filter((o) => o.correct).map((o) => o.id);
  const wrongIds = flow.options.filter((o) => !o.correct).map((o) => o.id);

  it("scores a perfect prediction", () => {
    const s = scorePrediction(flow, correctIds);
    expect(s.perfect).toBe(true);
    expect(s.anyHit).toBe(true);
    expect(s.misses).toHaveLength(0);
    expect(s.falseAlarms).toHaveLength(0);
  });

  it("counts misses when a correct feature was not picked", () => {
    const s = scorePrediction(flow, [correctIds[0]]);
    expect(s.anyHit).toBe(true);
    expect(s.perfect).toBe(false);
    expect(s.misses.length).toBe(correctIds.length - 1);
  });

  it("counts false alarms and is not perfect", () => {
    const s = scorePrediction(flow, [...correctIds, wrongIds[0]]);
    expect(s.falseAlarms).toHaveLength(1);
    expect(s.perfect).toBe(false);
  });

  it("reports no hits when everything picked was wrong", () => {
    const s = scorePrediction(flow, [wrongIds[0]]);
    expect(s.anyHit).toBe(false);
    expect(s.hits).toHaveLength(0);
  });
});
