import type {
  Abnormality,
  AbnormalityKind,
  Breakpoint,
  Clone,
  Karyotype,
  Ploidy,
} from "../../types/cytogenetics";

// A pragmatic ISCN parser. It targets the constitutional + acquired karyotypes
// seen in routine heme-onc reporting (numerical changes and the common
// structural rearrangements), degrades gracefully on notation it does not
// model, and never throws — anything it cannot parse becomes a warning in
// `errors` so the UI can teach around it rather than crash.

const STRUCTURAL_OPS: Record<string, AbnormalityKind> = {
  t: "translocation",
  del: "deletion",
  inv: "inversion",
  dup: "duplication",
  add: "addition",
  i: "isochromosome",
  idic: "iso_dicentric",
  ins: "insertion",
  der: "derivative",
  dic: "dicentric",
  r: "ring",
  trp: "duplication",
  dmin: "double_minute",
};

/** Split on separators that are NOT inside () or []. */
function splitTopLevel(input: string, sep: string): string[] {
  const out: string[] = [];
  let depthParen = 0;
  let depthBracket = 0;
  let cur = "";
  for (const ch of input) {
    if (ch === "(") depthParen++;
    else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
    else if (ch === "[") depthBracket++;
    else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
    if (ch === sep && depthParen === 0 && depthBracket === 0) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

const CHR_TOKEN = /^(?:[1-9]|1\d|2[0-2]|X|Y)$/;

function isChromosome(token: string): boolean {
  return CHR_TOKEN.test(token);
}

/** Pull every band designation (p/q arm + number) out of a segment. */
function extractBands(segment: string, chr: string): Breakpoint[] {
  const bands: Breakpoint[] = [];
  const re = /([pq])(\d+(?:\.\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(segment)) !== null) {
    bands.push({ chr, band: `${m[1]}${m[2]}` });
  }
  if (bands.length === 0 && segment.trim()) {
    // e.g. "q10" already captured; whole-arm markers like "q" alone
    const arm = segment.trim().match(/^[pq]/);
    if (arm) bands.push({ chr, band: arm[0] });
  }
  return bands;
}

function ordinal(chr: string): string {
  return chr === "X" || chr === "Y" ? `chromosome ${chr}` : `chromosome ${chr}`;
}

function armName(band?: string): string {
  if (!band) return "";
  if (band.startsWith("p")) return "short arm (p)";
  if (band.startsWith("q")) return "long arm (q)";
  return "";
}

function describeStructural(
  kind: AbnormalityKind,
  chromosomes: string[],
  breakpoints: Breakpoint[],
): string {
  const bp = (chr: string) =>
    breakpoints
      .filter((b) => b.chr === chr)
      .map((b) => b.band)
      .filter(Boolean)
      .join(" and ");

  switch (kind) {
    case "translocation": {
      if (chromosomes.length >= 2) {
        const parts = chromosomes.map((c) => {
          const b = bp(c);
          return b ? `${ordinal(c)} at band ${b}` : ordinal(c);
        });
        return `Reciprocal translocation exchanging material between ${parts.join(
          " and ",
        )}.`;
      }
      return "Translocation.";
    }
    case "deletion": {
      const c = chromosomes[0];
      const b = breakpoints.filter((x) => x.chr === c).map((x) => x.band);
      if (b.length >= 2)
        return `Interstitial deletion of the ${armName(
          b[0],
        )} of ${ordinal(c)} between bands ${b[0]} and ${b[1]}.`;
      if (b.length === 1)
        return `Deletion of the ${armName(b[0])} of ${ordinal(
          c,
        )} from band ${b[0]} to the terminus.`;
      return `Deletion involving ${ordinal(c)}.`;
    }
    case "inversion": {
      const c = chromosomes[0];
      const b = breakpoints.filter((x) => x.chr === c).map((x) => x.band);
      const pericentric =
        b.length === 2 && b[0]?.startsWith("p") && b[1]?.startsWith("q");
      return `${
        pericentric ? "Pericentric" : "Paracentric"
      } inversion of ${ordinal(c)}${
        b.length ? ` with breakpoints at ${b.join(" and ")}` : ""
      }.`;
    }
    case "duplication": {
      const c = chromosomes[0];
      const b = breakpoints.filter((x) => x.chr === c).map((x) => x.band);
      return `Duplication within ${ordinal(c)}${
        b.length ? ` (${b.join("→")})` : ""
      }.`;
    }
    case "addition": {
      const c = chromosomes[0];
      const b = bp(c);
      return `Additional material of unknown origin attached to ${ordinal(
        c,
      )}${b ? ` at band ${b}` : ""}.`;
    }
    case "isochromosome": {
      const c = chromosomes[0];
      const b = bp(c);
      return `Isochromosome of ${ordinal(c)}${
        b ? ` (${b})` : ""
      } — one arm lost and the other mirror-duplicated.`;
    }
    case "iso_dicentric":
      return `Isodicentric chromosome involving ${chromosomes
        .map(ordinal)
        .join(" and ")}.`;
    case "insertion":
      return `Insertion involving ${chromosomes.map(ordinal).join(" and ")}.`;
    case "derivative":
      return `Derivative ${ordinal(
        chromosomes[0],
      )} — a structurally rearranged chromosome, from the events in the following brackets.`;
    case "dicentric":
      return `Dicentric chromosome fusing ${chromosomes
        .map(ordinal)
        .join(" and ")}.`;
    case "ring":
      return `Ring chromosome derived from ${ordinal(chromosomes[0])}.`;
    case "double_minute":
      return `Double-minute chromosomes (extrachromosomal amplified DNA).`;
    default:
      return "Structural rearrangement.";
  }
}

function parseAbnormality(raw: string): Abnormality {
  const field = raw.trim();
  const uncertain = field.includes("?");
  const clean = field.replace(/\?/g, "");

  // Numerical gain/loss: +8, -7, +21, -Y, +mar, +der(...)
  if (clean.startsWith("+") || clean.startsWith("-")) {
    const sign = clean[0] === "+" ? 1 : -1;
    const rest = clean.slice(1);

    if (rest === "mar") {
      return {
        raw: field,
        kind: "marker",
        chromosomes: [],
        breakpoints: [],
        copyChange: sign,
        text:
          sign > 0
            ? "Gain of a marker chromosome — a structurally abnormal chromosome whose origin cannot be identified by banding."
            : "Loss of a marker chromosome.",
        uncertain,
      };
    }

    // +der(...) / -der(...): numerical change of a derivative chromosome
    const structMatch = rest.match(/^([a-z]+)\(/);
    if (structMatch) {
      const inner = parseAbnormality(rest);
      return {
        ...inner,
        raw: field,
        copyChange: sign,
        text: `${sign > 0 ? "Gain" : "Loss"} of ${inner.text
          .charAt(0)
          .toLowerCase()}${inner.text.slice(1)}`,
        uncertain: uncertain || inner.uncertain,
      };
    }

    if (isChromosome(rest)) {
      const isSex = rest === "X" || rest === "Y";
      const text =
        sign > 0
          ? `Gain of ${ordinal(rest)} (trisomy ${rest}).`
          : `Loss of ${ordinal(rest)} (monosomy ${rest}).`;
      return {
        raw: field,
        kind: sign > 0 ? "gain" : "loss",
        chromosomes: [rest],
        breakpoints: [],
        copyChange: sign,
        text: isSex
          ? sign > 0
            ? `Gain of the ${rest} chromosome.`
            : `Loss of the ${rest} chromosome.`
          : text,
        uncertain,
      };
    }

    return {
      raw: field,
      kind: "unknown",
      chromosomes: [],
      breakpoints: [],
      copyChange: sign,
      text: `Copy-number change: ${field}.`,
      uncertain,
    };
  }

  // Structural: op(chrGroup)(bandGroup)? ... possibly extra der brackets
  const opMatch = clean.match(/^([a-z]+)\(([^)]*)\)(?:\(([^)]*)\))?/);
  if (opMatch) {
    const op = opMatch[1];
    const kind = STRUCTURAL_OPS[op] ?? "other";
    const chrGroup = opMatch[2] ?? "";
    const bandGroup = opMatch[3];

    const chromosomes = splitTopLevel(chrGroup, ";")
      .map((c) => c.trim())
      .filter(Boolean);

    const breakpoints: Breakpoint[] = [];
    if (bandGroup !== undefined) {
      const bandSegs = splitTopLevel(bandGroup, ";").map((b) => b.trim());
      if (bandSegs.length === chromosomes.length) {
        chromosomes.forEach((chr, i) => {
          breakpoints.push(...extractBands(bandSegs[i], chr));
        });
      } else {
        // Single-chromosome op with a band range, e.g. del(5)(q13q33)
        const chr = chromosomes[0] ?? "?";
        bandSegs.forEach((seg) => breakpoints.push(...extractBands(seg, chr)));
      }
    }

    return {
      raw: field,
      kind,
      chromosomes,
      breakpoints,
      text: describeStructural(kind, chromosomes, breakpoints),
      uncertain,
    };
  }

  // Bare tokens: mar, inc, dmin, etc.
  if (clean === "mar")
    return {
      raw: field,
      kind: "marker",
      chromosomes: [],
      breakpoints: [],
      text: "A marker chromosome of unidentifiable origin.",
      uncertain,
    };

  return {
    raw: field,
    kind: "unknown",
    chromosomes: [],
    breakpoints: [],
    text: `Unparsed element: ${field}.`,
    uncertain,
  };
}

function classifyPloidy(modal: number | null): Ploidy {
  if (modal === null) return "unknown";
  if (modal <= 34) return "haploid";
  if (modal >= 35 && modal <= 45) return "hypodiploid";
  if (modal === 46) return "diploid";
  if (modal >= 47 && modal <= 57) return "hyperdiploid";
  if (modal >= 58 && modal <= 68) return "near-triploid";
  if (modal >= 69 && modal <= 80) return "near-tetraploid";
  return "unknown";
}

function parseCellCount(clone: string): {
  body: string;
  count: number | null;
  composite: boolean;
} {
  const m = clone.match(/\[(cp)?(\d+)\]\s*$/i);
  if (!m) return { body: clone, count: null, composite: false };
  return {
    body: clone.slice(0, m.index).trim(),
    count: Number(m[2]),
    composite: Boolean(m[1]),
  };
}

function parseClone(cloneRaw: string, previous: Clone | null): Clone {
  const raw = cloneRaw.trim();
  const { body, count, composite } = parseCellCount(raw);
  const fields = splitTopLevel(body, ",").map((f) => f.trim());

  // Modal number (may be a range like 45~47).
  let modalNumber: number | null = null;
  let modalRange: [number, number] | undefined;
  const modalField = fields[0] ?? "";
  const rangeMatch = modalField.match(/^(\d+)\s*[~-]\s*(\d+)$/);
  if (rangeMatch) {
    modalRange = [Number(rangeMatch[1]), Number(rangeMatch[2])];
    modalNumber = null;
  } else if (/^\d+$/.test(modalField)) {
    modalNumber = Number(modalField);
  }

  // Sex constitution is the next field when it looks like sex chromosomes.
  let sex = "";
  let abnStart = 1;
  const sexField = fields[1] ?? "";
  if (/^[XY]+$/.test(sexField) || sexField === "") {
    sex = sexField;
    abnStart = 2;
  } else {
    abnStart = 1; // sex omitted; treat remaining as abnormalities
  }

  const abnormalities: Abnormality[] = [];

  // "idem" copies the stemline's abnormalities.
  const rest = fields.slice(abnStart);
  for (const field of rest) {
    if (!field) continue;
    if (field === "idem" && previous) {
      abnormalities.push(...previous.abnormalities.map((a) => ({ ...a })));
      continue;
    }
    if (field === "inc") {
      abnormalities.push({
        raw: field,
        kind: "unknown",
        chromosomes: [],
        breakpoints: [],
        text: "Incomplete karyotype — additional abnormalities may be present.",
        uncertain: true,
      });
      continue;
    }
    abnormalities.push(parseAbnormality(field));
  }

  return {
    raw,
    modalNumber,
    modalRange,
    ploidy: classifyPloidy(modalNumber),
    sex,
    abnormalities,
    cellCount: count,
    composite,
    isNormal: abnormalities.length === 0,
  };
}

function isMonosomal(clone: Clone): boolean {
  const autosomalMonosomies = clone.abnormalities.filter(
    (a) => a.kind === "loss" && a.chromosomes.some((c) => c !== "X" && c !== "Y"),
  ).length;
  const structural = clone.abnormalities.filter((a) =>
    [
      "translocation",
      "deletion",
      "inversion",
      "duplication",
      "addition",
      "isochromosome",
      "derivative",
      "dicentric",
      "ring",
      "iso_dicentric",
    ].includes(a.kind),
  ).length;
  if (autosomalMonosomies >= 2) return true;
  if (autosomalMonosomies >= 1 && structural >= 1) return true;
  return false;
}

export function parseKaryotype(raw: string): Karyotype {
  const errors: string[] = [];
  const trimmed = (raw ?? "").trim();

  if (!trimmed) {
    return {
      raw,
      clones: [],
      totalCells: null,
      abnormalCells: null,
      clonalFraction: null,
      complexKaryotype: false,
      monosomalKaryotype: false,
      errors: ["Empty karyotype string."],
    };
  }

  const cloneStrings = splitTopLevel(trimmed, "/").map((c) => c.trim());
  const clones: Clone[] = [];
  let previous: Clone | null = null;
  for (const cs of cloneStrings) {
    if (!cs) continue;
    const clone = parseClone(cs, previous);
    if (clone.modalNumber === null && !clone.modalRange) {
      errors.push(`Could not read a modal chromosome number in "${cs}".`);
    }
    clones.push(clone);
    previous = clone;
  }

  const counts = clones.map((c) => c.cellCount);
  const totalCells = counts.every((c) => c !== null)
    ? counts.reduce((a, b) => a! + b!, 0)
    : null;
  const abnormalCells = clones.every((c) => c.cellCount !== null)
    ? clones
        .filter((c) => !c.isNormal)
        .reduce((a, c) => a + (c.cellCount ?? 0), 0)
    : null;
  const clonalFraction =
    totalCells && abnormalCells !== null ? abnormalCells / totalCells : null;

  const complexKaryotype = clones.some(
    (c) => !c.isNormal && c.abnormalities.length >= 3,
  );
  const monosomalKaryotype = clones.some((c) => !c.isNormal && isMonosomal(c));

  return {
    raw,
    clones,
    totalCells,
    abnormalCells,
    clonalFraction,
    complexKaryotype,
    monosomalKaryotype,
    errors,
  };
}
