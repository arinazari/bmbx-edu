import { describe, expect, it } from "vitest";
import { parseKaryotype } from "./parser";

describe("parseKaryotype — normal", () => {
  it("parses a normal male karyotype", () => {
    const k = parseKaryotype("46,XY[20]");
    expect(k.clones).toHaveLength(1);
    const c = k.clones[0];
    expect(c.modalNumber).toBe(46);
    expect(c.sex).toBe("XY");
    expect(c.ploidy).toBe("diploid");
    expect(c.isNormal).toBe(true);
    expect(c.cellCount).toBe(20);
    expect(k.complexKaryotype).toBe(false);
  });

  it("parses a normal female karyotype", () => {
    const k = parseKaryotype("46,XX");
    expect(k.clones[0].sex).toBe("XX");
    expect(k.clones[0].isNormal).toBe(true);
  });
});

describe("parseKaryotype — the Philadelphia chromosome", () => {
  it("parses t(9;22) with two clones and computes clone size", () => {
    const k = parseKaryotype("46,XY,t(9;22)(q34;q11.2)[18]/46,XY[2]");
    expect(k.clones).toHaveLength(2);

    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("translocation");
    expect(abn.chromosomes).toEqual(["9", "22"]);
    expect(abn.breakpoints).toEqual([
      { chr: "9", band: "q34" },
      { chr: "22", band: "q11.2" },
    ]);
    expect(abn.text).toMatch(/translocation/i);

    expect(k.clones[1].isNormal).toBe(true);
    expect(k.totalCells).toBe(20);
    expect(k.abnormalCells).toBe(18);
    expect(k.clonalFraction).toBeCloseTo(0.9, 5);
  });
});

describe("parseKaryotype — numerical abnormalities", () => {
  it("parses trisomy 8", () => {
    const k = parseKaryotype("47,XY,+8[10]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("gain");
    expect(abn.chromosomes).toEqual(["8"]);
    expect(abn.copyChange).toBe(1);
    expect(abn.text).toMatch(/trisomy 8/i);
    expect(k.clones[0].ploidy).toBe("hyperdiploid");
  });

  it("parses monosomy 7", () => {
    const k = parseKaryotype("45,XX,-7[12]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("loss");
    expect(abn.copyChange).toBe(-1);
    expect(abn.text).toMatch(/monosomy 7/i);
    expect(k.clones[0].ploidy).toBe("hypodiploid");
  });

  it("parses loss of Y", () => {
    const k = parseKaryotype("45,X,-Y[8]/46,XY[12]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("loss");
    expect(abn.chromosomes).toEqual(["Y"]);
    expect(abn.text).toMatch(/Y chromosome/i);
  });
});

describe("parseKaryotype — deletions and inversions", () => {
  it("parses interstitial del(5q)", () => {
    const k = parseKaryotype("46,XX,del(5)(q13q33)[20]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("deletion");
    expect(abn.chromosomes).toEqual(["5"]);
    expect(abn.breakpoints.map((b) => b.band)).toEqual(["q13", "q33"]);
    expect(abn.text).toMatch(/interstitial deletion/i);
  });

  it("parses terminal del(7q)", () => {
    const k = parseKaryotype("46,XY,del(7)(q22)[15]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("deletion");
    expect(abn.breakpoints).toEqual([{ chr: "7", band: "q22" }]);
    expect(abn.text).toMatch(/to the terminus/i);
  });

  it("parses inv(16) as pericentric", () => {
    const k = parseKaryotype("46,XY,inv(16)(p13.1q22)[19]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("inversion");
    expect(abn.breakpoints).toEqual([
      { chr: "16", band: "p13.1" },
      { chr: "16", band: "q22" },
    ]);
    expect(abn.text).toMatch(/pericentric/i);
  });
});

describe("parseKaryotype — isochromosome and additions", () => {
  it("parses i(17)(q10)", () => {
    const k = parseKaryotype("46,XX,i(17)(q10)[11]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("isochromosome");
    expect(abn.chromosomes).toEqual(["17"]);
    expect(abn.text).toMatch(/isochromosome/i);
  });

  it("parses add(19)(p13.3)", () => {
    const k = parseKaryotype("46,XY,add(19)(p13.3)[9]");
    const abn = k.clones[0].abnormalities[0];
    expect(abn.kind).toBe("addition");
    expect(abn.text).toMatch(/unknown origin/i);
  });
});

describe("parseKaryotype — complexity flags", () => {
  it("flags a complex karyotype (>=3 abnormalities)", () => {
    const k = parseKaryotype(
      "45,XY,-5,-7,+8,del(20)(q11.2),add(17)(p13)[cp10]",
    );
    expect(k.complexKaryotype).toBe(true);
    expect(k.clones[0].composite).toBe(true);
    expect(k.clones[0].cellCount).toBe(10);
  });

  it("flags a monosomal karyotype (two autosomal monosomies)", () => {
    const k = parseKaryotype("44,XX,-5,-7[20]");
    expect(k.monosomalKaryotype).toBe(true);
  });

  it("flags monosomal karyotype (monosomy + structural)", () => {
    const k = parseKaryotype("45,XY,-7,t(3;3)(q21;q26.2)[20]");
    expect(k.monosomalKaryotype).toBe(true);
  });

  it("does not flag a single balanced translocation as complex", () => {
    const k = parseKaryotype("46,XY,t(8;21)(q22;q22)[20]");
    expect(k.complexKaryotype).toBe(false);
    expect(k.monosomalKaryotype).toBe(false);
  });
});

describe("parseKaryotype — idem and composite", () => {
  it("expands idem clones from the stemline", () => {
    const k = parseKaryotype("47,XY,+8[10]/48,idem,+21[5]");
    expect(k.clones[1].abnormalities.map((a) => a.raw)).toContain("+8");
    expect(k.clones[1].abnormalities.map((a) => a.raw)).toContain("+21");
  });
});

describe("parseKaryotype — robustness", () => {
  it("never throws on garbage and records an error", () => {
    const k = parseKaryotype("not a karyotype");
    expect(Array.isArray(k.errors)).toBe(true);
    expect(k.clones.length).toBeGreaterThanOrEqual(0);
  });

  it("handles an empty string", () => {
    const k = parseKaryotype("");
    expect(k.errors[0]).toMatch(/empty/i);
  });

  it("carries the uncertainty marker through", () => {
    const k = parseKaryotype("46,XY,t(9;22)(q34;q11.2)?[20]");
    expect(k.clones[0].abnormalities[0].uncertain).toBe(true);
  });
});
