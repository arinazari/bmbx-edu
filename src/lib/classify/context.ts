import type { HemeCase } from "../../types/case";
import type { Karyotype } from "../../types/cytogenetics";
import { parseKaryotype } from "../iscn/parser";
import { identifyRecurrent, type RecurrentMatch } from "../iscn/recurrent";
import { SECONDARY_TYPE_GENES, WHO5_AML_MR_GENES } from "../genes/genes";

// Normalizes a HemeCase into the specific facts the classification and risk
// engines reason over, so each engine reads flags rather than re-deriving them.

export interface ClinicalContext {
  marrowBlasts: number | null;
  peripheralBlasts: number | null;
  /** The operative blast %: the higher of marrow and peripheral. */
  blasts: number | null;

  karyotype: Karyotype | null;
  recurrent: RecurrentMatch[];
  amlDefining: RecurrentMatch[];
  mdsRelatedCytogenetics: boolean;
  complexKaryotype: boolean;
  monosomalKaryotype: boolean;
  seventeenPLoss: boolean;

  mutatedGenes: string[];
  npm1: boolean;
  flt3ITD: boolean;
  flt3TKD: boolean;
  cebpaBZIP: boolean;
  tp53Count: number;
  tp53MaxVaf: number | null;
  tp53MultiHit: boolean;
  /** ELN 2022 / ICC AML-MR secondary-type mutations present (9-gene list, incl. RUNX1). */
  secondaryTypeMutations: string[];
  /** WHO5 AML-MR defining mutations present (8-gene list, excludes RUNX1). */
  who5MrMutations: string[];
  /** CBF (t(8;21) or inv(16)/t(16;16)) present — excludes complex/adverse override in ELN. */
  hasCbf: boolean;
}

function blastFromDifferential(
  c: HemeCase,
  source: "aspirate" | "peripheral",
): number | null {
  const d = c.differential?.find((x) => x.source === source);
  return d?.blasts ?? null;
}

export function buildContext(c: HemeCase): ClinicalContext {
  const marrowBlasts = blastFromDifferential(c, "aspirate");
  const peripheralBlasts = blastFromDifferential(c, "peripheral");
  const blasts =
    marrowBlasts !== null || peripheralBlasts !== null
      ? Math.max(marrowBlasts ?? 0, peripheralBlasts ?? 0)
      : null;

  const iscn = c.cytogenetics?.karyotypeISCN;
  const karyotype = iscn ? parseKaryotype(iscn) : null;
  const recurrent = karyotype ? identifyRecurrent(karyotype) : [];
  const amlDefining = recurrent.filter((m) => m.entry.amlDefining);
  // AML-MR is driven only by the true MDS-related defining cytogenetics
  // (del(5q)/-5, -7/del(7q), del(17p)/-17/i(17q), ...) plus complex karyotype —
  // NOT by nonspecific lesions like +8 or del(20q).
  const mdsRelatedCytogenetics =
    recurrent.some((m) => m.entry.amlMrDefining) ||
    (karyotype?.complexKaryotype ?? false);
  const hasCbf = recurrent.some(
    (m) => m.entry.id === "t_8_21" || m.entry.id === "inv_16",
  );

  const seventeenPLoss =
    recurrent.some((m) => m.entry.id === "abn_17p") ||
    (karyotype?.clones.some((cl) =>
      cl.abnormalities.some(
        (a) =>
          (a.kind === "loss" && a.chromosomes.includes("17")) ||
          (a.kind === "deletion" &&
            a.chromosomes.includes("17") &&
            a.breakpoints.some((b) => b.band?.startsWith("p"))),
      ),
    ) ??
      false);

  const variants = c.molecular?.variants ?? [];
  const pathogenic = variants.filter(
    (v) =>
      v.significance === undefined ||
      v.significance === "pathogenic" ||
      v.significance === "likely_pathogenic",
  );
  const mutatedGenes = [...new Set(pathogenic.map((v) => v.gene.toUpperCase()))];

  const has = (g: string) => mutatedGenes.includes(g);

  const flt3Variants = pathogenic.filter((v) => v.gene.toUpperCase() === "FLT3");
  const flt3ITD = flt3Variants.some(
    (v) => (v.type ?? "").toUpperCase().includes("ITD") || /itd/i.test(v.note ?? ""),
  );
  const flt3TKD = flt3Variants.some(
    (v) =>
      (v.type ?? "").toUpperCase().includes("TKD") ||
      /d835|tkd|i836/i.test(`${v.protein ?? ""} ${v.note ?? ""}`),
  );

  const cebpaVariants = pathogenic.filter((v) => v.gene.toUpperCase() === "CEBPA");
  const cebpaBZIP = cebpaVariants.some(
    (v) => /bzip/i.test(`${v.type ?? ""} ${v.note ?? ""}`),
  );

  const tp53Variants = pathogenic.filter((v) => v.gene.toUpperCase() === "TP53");
  const tp53Count = tp53Variants.length;
  const tp53Vafs = tp53Variants
    .map((v) => v.vaf)
    .filter((v): v is number => typeof v === "number");
  const tp53MaxVaf = tp53Vafs.length ? Math.max(...tp53Vafs) : null;
  // Multi-hit: two TP53 hits, or one hit with 17p loss, or a single hit at VAF >=50%.
  const tp53MultiHit =
    tp53Count >= 2 ||
    (tp53Count >= 1 && seventeenPLoss) ||
    (tp53Count >= 1 && (tp53MaxVaf ?? 0) >= 50);

  const secondaryTypeMutations = SECONDARY_TYPE_GENES.filter((g) => has(g));
  const who5MrMutations = WHO5_AML_MR_GENES.filter((g) => has(g));

  return {
    marrowBlasts,
    peripheralBlasts,
    blasts,
    karyotype,
    recurrent,
    amlDefining,
    mdsRelatedCytogenetics,
    complexKaryotype: karyotype?.complexKaryotype ?? false,
    monosomalKaryotype: karyotype?.monosomalKaryotype ?? false,
    seventeenPLoss,
    mutatedGenes,
    npm1: has("NPM1"),
    flt3ITD,
    flt3TKD,
    cebpaBZIP,
    tp53Count,
    tp53MaxVaf,
    tp53MultiHit,
    secondaryTypeMutations,
    who5MrMutations,
    hasCbf,
  };
}
