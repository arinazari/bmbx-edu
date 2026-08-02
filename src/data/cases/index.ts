import type { HemeCase } from "../../types/case";
import { amlNpm1Flt3 } from "./amlNpm1Flt3";
import { apl } from "./apl";
import { mdsAmlGrayZone } from "./mdsAmlGrayZone";
import { cmlCbfInv16 } from "./cbfInv16";
import { mdsDel5q } from "./mdsDel5q";

export const SAMPLE_CASES: HemeCase[] = [
  apl,
  amlNpm1Flt3,
  cmlCbfInv16,
  mdsAmlGrayZone,
  mdsDel5q,
];

export function caseById(id: string): HemeCase | undefined {
  return SAMPLE_CASES.find((c) => c.id === id);
}
