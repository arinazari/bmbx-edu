import { describe, expect, it } from "vitest";
import type { HemeCase } from "../../types/case";
import { classifyCase } from "./engine";
import { elnRisk } from "./eln";
import { ipssr, ipssrCytoCategory } from "./ipssr";
import { parseKaryotype } from "../iscn/parser";

function makeCase(partial: Partial<HemeCase>): HemeCase {
  return {
    id: "t",
    title: "test",
    vignette: "",
    differentialOptions: [],
    ...partial,
  };
}

const marrow = (blasts: number) =>
  [{ source: "aspirate" as const, blasts }];

describe("WHO5 vs ICC — APL", () => {
  it("classifies t(15;17) as APL in both systems", () => {
    const c = makeCase({
      differential: marrow(30),
      cytogenetics: { karyotypeISCN: "46,XY,t(15;17)(q24;q21)[20]" },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/promyelocytic/i);
    expect(r.icc.category).toMatch(/promyelocytic/i);
  });
});

describe("WHO5 vs ICC — NPM1", () => {
  it("classifies NPM1-mutated AML with a normal karyotype", () => {
    const c = makeCase({
      differential: marrow(60),
      molecular: { variants: [{ gene: "NPM1", significance: "pathogenic" }] },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/NPM1/);
    expect(r.icc.category).toMatch(/NPM1/);
  });
});

describe("WHO5 vs ICC — the sub-10% genetic AML disagreement", () => {
  it("t(8;21) at 6% blasts: AML by WHO5, below the ICC floor", () => {
    const c = makeCase({
      differential: marrow(6),
      cytogenetics: { karyotypeISCN: "46,XX,t(8;21)(q22;q22)[20]" },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/RUNX1::RUNX1T1/);
    expect(r.icc.category).not.toMatch(/RUNX1::RUNX1T1/);
    expect(r.disagreements.some((d) => /threshold/i.test(d.topic))).toBe(true);
  });

  it("t(8;21) at 12% blasts: both call AML", () => {
    const c = makeCase({
      differential: marrow(12),
      cytogenetics: { karyotypeISCN: "46,XX,t(8;21)(q22;q22)[20]" },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/RUNX1::RUNX1T1/);
    expect(r.icc.category).toMatch(/RUNX1::RUNX1T1/);
  });
});

describe("WHO5 vs ICC — the 10–19% gray zone", () => {
  it("15% blasts, no defining genetics: MDS-IB2 vs MDS/AML", () => {
    const c = makeCase({ differential: marrow(15) });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/MDS-IB2|increased blasts 2/i);
    expect(r.icc.category).toMatch(/MDS\/AML/);
    expect(r.disagreements.some((d) => /gray zone/i.test(d.topic))).toBe(true);
  });
});

describe("WHO5 vs ICC — TP53", () => {
  it("multi-hit TP53 at 3% blasts differs by system wording", () => {
    const c = makeCase({
      differential: marrow(3),
      molecular: {
        variants: [
          { gene: "TP53", vaf: 60, significance: "pathogenic" },
          { gene: "TP53", vaf: 30, significance: "pathogenic" },
        ],
      },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/biallelic TP53/i);
    expect(r.icc.category).toMatch(/TP53/);
    expect(r.disagreements.some((d) => /TP53/.test(d.topic))).toBe(true);
  });
});

describe("ELN 2022", () => {
  it("NPM1 without FLT3-ITD is favorable", () => {
    const c = makeCase({
      differential: marrow(60),
      molecular: { variants: [{ gene: "NPM1" }] },
    });
    expect(elnRisk(c).risk).toBe("favorable");
  });

  it("NPM1 with FLT3-ITD is intermediate", () => {
    const c = makeCase({
      differential: marrow(60),
      molecular: {
        variants: [{ gene: "NPM1" }, { gene: "FLT3", type: "ITD" }],
      },
    });
    expect(elnRisk(c).risk).toBe("intermediate");
  });

  it("TP53 is adverse and overrides", () => {
    const c = makeCase({
      differential: marrow(40),
      molecular: { variants: [{ gene: "NPM1" }, { gene: "TP53", vaf: 45 }] },
    });
    expect(elnRisk(c).risk).toBe("adverse");
  });

  it("a favorable AML is not downgraded by a secondary-type mutation", () => {
    const c = makeCase({
      differential: marrow(40),
      cytogenetics: { karyotypeISCN: "46,XY,inv(16)(p13.1q22)[20]" },
      molecular: { variants: [{ gene: "SRSF2" }] },
    });
    expect(elnRisk(c).risk).toBe("favorable");
  });

  it("an isolated secondary-type mutation is adverse", () => {
    const c = makeCase({
      differential: marrow(40),
      molecular: { variants: [{ gene: "ASXL1" }] },
    });
    expect(elnRisk(c).risk).toBe("adverse");
  });
});

describe("WHO5 vs ICC — RUNX1 is AML-MR for ICC only", () => {
  it("isolated RUNX1 at 40% blasts: differentiation (WHO5) vs AML-MR (ICC)", () => {
    const c = makeCase({
      differential: marrow(40),
      molecular: { variants: [{ gene: "RUNX1", significance: "pathogenic" }] },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/defined by differentiation/i);
    expect(r.icc.category).toMatch(/myelodysplasia-related/i);
    expect(r.disagreements.some((d) => /RUNX1/.test(d.topic))).toBe(true);
  });
});

describe("WHO5 — +8 does not define AML-MR", () => {
  it("isolated +8 at 40% blasts is AML by differentiation, not AML-MR", () => {
    const c = makeCase({
      differential: marrow(40),
      cytogenetics: { karyotypeISCN: "47,XY,+8[20]" },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/defined by differentiation/i);
    expect(r.who5.category).not.toMatch(/myelodysplasia-related/i);
  });
});

describe("WHO5 — multi-hit TP53 supersedes the MDS-IB tiers", () => {
  it("multi-hit TP53 at 15% blasts is MDS-biTP53, not MDS-IB2", () => {
    const c = makeCase({
      differential: marrow(15),
      molecular: {
        variants: [
          { gene: "TP53", vaf: 55 },
          { gene: "TP53", vaf: 20 },
        ],
      },
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/biallelic TP53/i);
  });
});

describe("WHO5/ICC — peripheral-blood blast thresholds", () => {
  it("3% marrow but 6% blood blasts reaches the 10-19% tier", () => {
    const c = makeCase({
      differential: [
        { source: "aspirate", blasts: 3 },
        { source: "peripheral", blasts: 6 },
      ],
    });
    const r = classifyCase(c);
    expect(r.who5.category).toMatch(/MDS-IB2|increased blasts 2/i);
    expect(r.icc.category).toMatch(/MDS\/AML/);
  });
});

describe("classification — monosomy 5 is not the 5q- syndrome", () => {
  it("-5 at low blasts is not labeled isolated del(5q)", () => {
    const c = makeCase({
      differential: marrow(3),
      cytogenetics: { karyotypeISCN: "45,XY,-5[20]" },
    });
    const r = classifyCase(c);
    expect(r.who5.category).not.toMatch(/isolated 5q/i);
  });
});

describe("ELN 2022 — CBF exceptions", () => {
  it("keeps CBF-AML favorable despite a complex/adverse karyotype", () => {
    const c = makeCase({
      differential: marrow(40),
      cytogenetics: {
        karyotypeISCN: "46,XY,inv(16)(p13.1q22),-7,+8,del(20)(q11.2)[20]",
      },
    });
    expect(elnRisk(c).risk).toBe("favorable");
  });

  it("t(9;11) takes precedence over a secondary-type mutation (intermediate)", () => {
    const c = makeCase({
      differential: marrow(40),
      cytogenetics: { karyotypeISCN: "46,XY,t(9;11)(p21.3;q23.3)[20]" },
      molecular: { variants: [{ gene: "ASXL1" }] },
    });
    expect(elnRisk(c).risk).toBe("intermediate");
  });

  it("is not applicable to APL and says why", () => {
    const c = makeCase({
      differential: marrow(40),
      cytogenetics: { karyotypeISCN: "46,XY,t(15;17)(q24;q21)[20]" },
    });
    const r = elnRisk(c);
    expect(r.applicable).toBe(false);
    expect(r.notApplicableReason).toMatch(/APL/);
  });
});

describe("IPSS-R", () => {
  it("computes a low-risk del(5q) MDS", () => {
    const c = makeCase({
      differential: marrow(2),
      cbc: { hgb: 9, plt: 120, anc: 1.5 },
      cytogenetics: { karyotypeISCN: "46,XX,del(5)(q13q33)[20]" },
    });
    const r = ipssr(c);
    expect(r.applicable).toBe(true);
    expect(r.cytoCategory).toBe("Good");
    expect(r.total).toBeCloseTo(2, 5);
    expect(r.risk).toBe("Low");
  });

  it("maps isolated -7 to Poor cytogenetics", () => {
    const k = parseKaryotype("45,XY,-7[20]");
    expect(ipssrCytoCategory(k.clones).category).toBe("Poor");
  });

  it("maps a complex karyotype to Very Poor", () => {
    const k = parseKaryotype("45,XY,-5,-7,+8,del(20)(q11.2),add(17)(p13)[cp10]");
    expect(ipssrCytoCategory(k.clones).category).toBe("Very Poor");
  });

  it("does not apply to AML-range blasts", () => {
    const c = makeCase({
      differential: marrow(40),
      cbc: { hgb: 9, plt: 120 },
    });
    expect(ipssr(c).applicable).toBe(false);
  });

  it("requires a marrow blast count (peripheral-only is not enough)", () => {
    const c = makeCase({
      differential: [{ source: "peripheral", blasts: 2 }],
      cbc: { hgb: 9, plt: 120, anc: 1.5 },
      cytogenetics: { karyotypeISCN: "46,XX[20]" },
    });
    const r = ipssr(c);
    expect(r.applicable).toBe(false);
    expect(r.reason).toMatch(/marrow/i);
  });

  it("tie-breaks a del(5q)+monosomy-7 double to Poor", () => {
    const k = parseKaryotype("44,XX,del(5)(q13q33),-7[20]");
    expect(ipssrCytoCategory(k.clones).category).toBe("Poor");
  });
});
