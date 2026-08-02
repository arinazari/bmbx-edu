import type { AberrancyRule, MarkerInfo } from "../../types/knowledge";
import type { Lineage } from "../../types/case";

// Flow-cytometry marker knowledge base. Each marker carries what it is and
// where it is normally expressed; the aberrancy rules encode the classic
// teaching points (CD7 on myeloblasts, CD56 aberrancy, dim-CD45 blast gate...)
// that the flow grid auto-flags from a case's phenotype.

export const MARKERS: MarkerInfo[] = [
  // --- Blast / stem ---------------------------------------------------------
  {
    marker: "CD34",
    lineages: ["stem"],
    whatItIs:
      "A sialomucin adhesion molecule on hematopoietic stem and progenitor cells.",
    normalExpression:
      "Early progenitors and blasts; lost with maturation. A workhorse blast marker.",
  },
  {
    marker: "CD117",
    aliases: ["c-KIT"],
    lineages: ["stem", "myeloid"],
    whatItIs: "The stem-cell-factor receptor tyrosine kinase (KIT).",
    normalExpression:
      "Myeloid progenitors/blasts, mast cells, and a subset of early erythroid cells.",
  },
  {
    marker: "HLA-DR",
    lineages: ["stem", "b", "monocytic"],
    whatItIs: "MHC class II molecule.",
    normalExpression:
      "Most myeloid/monocytic blasts, B cells, monocytes — but characteristically ABSENT on APL promyelocytes.",
  },
  {
    marker: "TdT",
    aliases: ["terminal deoxynucleotidyl transferase"],
    lineages: ["stem", "b", "t"],
    whatItIs: "A template-independent DNA polymerase marking lymphoid immaturity.",
    normalExpression:
      "Lymphoblasts (B and T) and a minor fraction of myeloblasts; hematogones.",
  },
  {
    marker: "CD38",
    lineages: ["stem", "plasma", "t"],
    whatItIs: "An ectoenzyme / activation antigen.",
    normalExpression: "Progenitors, activated lymphocytes, and (bright) plasma cells.",
  },

  // --- Myeloid --------------------------------------------------------------
  {
    marker: "MPO",
    aliases: ["myeloperoxidase"],
    lineages: ["myeloid"],
    whatItIs: "The azurophilic-granule enzyme myeloperoxidase (cytoplasmic).",
    normalExpression:
      "Granulocytic lineage from promyelocyte on. Its presence defines myeloid lineage for acute leukemia.",
  },
  {
    marker: "CD13",
    lineages: ["myeloid", "monocytic"],
    whatItIs: "Aminopeptidase N.",
    normalExpression: "Granulocytes and monocytes across maturation.",
  },
  {
    marker: "CD33",
    lineages: ["myeloid", "monocytic"],
    whatItIs: "A sialic-acid-binding lectin (Siglec-3); the gemtuzumab target.",
    normalExpression: "Myelomonocytic cells; bright on monocytes.",
  },
  {
    marker: "CD15",
    lineages: ["myeloid", "monocytic"],
    whatItIs: "A carbohydrate (Lewis-x) adhesion antigen.",
    normalExpression: "Maturing granulocytes and monocytes.",
  },
  {
    marker: "CD11b",
    lineages: ["myeloid", "monocytic", "nk"],
    whatItIs: "Integrin alpha-M (part of CR3).",
    normalExpression: "Maturing granulocytes, monocytes, NK cells.",
  },
  {
    marker: "CD65",
    lineages: ["myeloid"],
    whatItIs: "A ceramide-dodecasaccharide myeloid antigen.",
    normalExpression: "Maturing granulocytes.",
  },

  // --- Monocytic ------------------------------------------------------------
  {
    marker: "CD14",
    lineages: ["monocytic"],
    whatItIs: "The LPS co-receptor; the most specific mature-monocyte marker.",
    normalExpression: "Mature monocytes; often negative on monoblasts.",
  },
  {
    marker: "CD64",
    lineages: ["monocytic", "myeloid"],
    whatItIs: "High-affinity Fc-gamma receptor I.",
    normalExpression: "Monocytes (bright), maturing neutrophils, monoblasts.",
  },
  {
    marker: "CD11c",
    lineages: ["monocytic", "b"],
    whatItIs: "Integrin alpha-X.",
    normalExpression: "Monocytes, dendritic cells, hairy-cell leukemia.",
  },
  {
    marker: "CD36",
    lineages: ["monocytic", "erythroid", "megakaryocytic"],
    whatItIs: "A scavenger receptor / thrombospondin receptor.",
    normalExpression: "Monocytes, erythroid precursors, platelets/megakaryocytes.",
  },

  // --- Erythroid ------------------------------------------------------------
  {
    marker: "CD235a",
    aliases: ["glycophorin A"],
    lineages: ["erythroid"],
    whatItIs: "Glycophorin A, the major red-cell membrane sialoglycoprotein.",
    normalExpression: "Erythroid precursors from the polychromatophilic stage on.",
  },
  {
    marker: "CD71",
    aliases: ["transferrin receptor"],
    lineages: ["erythroid"],
    whatItIs: "The transferrin receptor, marking iron-avid dividing cells.",
    normalExpression: "Erythroid precursors (bright) and other proliferating cells.",
  },
  {
    marker: "E-cadherin",
    lineages: ["erythroid"],
    whatItIs: "An epithelial-type adhesion molecule aberrantly useful in heme.",
    normalExpression: "Early erythroid precursors — a helpful pure-erythroid marker.",
  },

  // --- Megakaryocytic -------------------------------------------------------
  {
    marker: "CD41",
    aliases: ["GPIIb"],
    lineages: ["megakaryocytic"],
    whatItIs: "Integrin alpha-IIb of the platelet fibrinogen receptor.",
    normalExpression: "Megakaryocytes and platelets; beware platelet adherence artifact.",
  },
  {
    marker: "CD61",
    aliases: ["GPIIIa"],
    lineages: ["megakaryocytic"],
    whatItIs: "Integrin beta-3.",
    normalExpression: "Megakaryocytes and platelets.",
  },
  {
    marker: "CD42b",
    aliases: ["GPIb"],
    lineages: ["megakaryocytic"],
    whatItIs: "The von Willebrand factor receptor.",
    normalExpression: "More mature megakaryocytes and platelets.",
  },

  // --- B lymphoid -----------------------------------------------------------
  {
    marker: "CD19",
    lineages: ["b"],
    whatItIs: "A pan-B-cell signaling co-receptor.",
    normalExpression:
      "B cells from the pro-B stage on; normal/reactive plasma cells retain dim CD19 (and are CD45+, CD56−). Neoplastic plasma cells characteristically lose CD19 — the basis for flow detection of clonal plasma cells.",
  },
  {
    marker: "CD20",
    lineages: ["b"],
    whatItIs: "A B-cell membrane channel; the rituximab target.",
    normalExpression: "B cells from late pre-B on; negative on early precursors and PCs.",
  },
  {
    marker: "CD79a",
    lineages: ["b"],
    whatItIs: "The Ig-alpha signaling chain of the B-cell receptor (cytoplasmic).",
    normalExpression: "B lineage from the earliest stage; an early, specific B marker.",
  },
  {
    marker: "CD10",
    aliases: ["CALLA"],
    lineages: ["b"],
    whatItIs: "Neutral endopeptidase (CALLA).",
    normalExpression: "Hematogones/precursor B cells, germinal-center B cells, granulocytes.",
  },
  {
    marker: "PAX5",
    lineages: ["b"],
    whatItIs: "The master B-cell transcription factor (nuclear).",
    normalExpression: "B cells (not plasma cells). Aberrantly seen in t(8;21) AML.",
  },
  {
    marker: "kappa",
    lineages: ["b", "plasma"],
    whatItIs: "Immunoglobulin kappa light chain.",
    normalExpression: "Polytypic on normal B cells/plasma cells; restriction implies clonality.",
  },
  {
    marker: "lambda",
    lineages: ["b", "plasma"],
    whatItIs: "Immunoglobulin lambda light chain.",
    normalExpression: "Polytypic on normal B cells/plasma cells; restriction implies clonality.",
  },

  // --- T / NK ---------------------------------------------------------------
  {
    marker: "CD2",
    lineages: ["t", "nk"],
    whatItIs: "An early T/NK adhesion molecule (LFA-2).",
    normalExpression: "T cells, NK cells; aberrantly on APL and inv(16) blasts.",
  },
  {
    marker: "CD3",
    lineages: ["t"],
    whatItIs: "The T-cell-receptor signaling complex; cytoplasmic CD3 is lineage-defining.",
    normalExpression: "Surface on mature T cells; cytoplasmic in T-lymphoblasts.",
  },
  {
    marker: "CD5",
    lineages: ["t"],
    whatItIs: "A T-cell receptor-modulating molecule.",
    normalExpression: "Most T cells and a small normal B subset; aberrant on CLL/MCL.",
  },
  {
    marker: "CD7",
    lineages: ["t", "nk"],
    whatItIs: "An early T/NK antigen.",
    normalExpression:
      "T/NK cells; the most common lymphoid antigen aberrantly expressed on myeloblasts.",
  },
  {
    marker: "CD4",
    lineages: ["t", "monocytic"],
    whatItIs: "MHC-II co-receptor.",
    normalExpression: "Helper T cells (bright), monocytes/blasts (dim).",
  },
  {
    marker: "CD8",
    lineages: ["t", "nk"],
    whatItIs: "MHC-I co-receptor.",
    normalExpression: "Cytotoxic T cells, NK subset.",
  },
  {
    marker: "CD1a",
    lineages: ["t"],
    whatItIs: "A cortical-thymocyte antigen.",
    normalExpression: "Cortical thymocytes; marks cortical T-ALL and Langerhans cells.",
  },
  {
    marker: "CD16",
    lineages: ["nk", "myeloid"],
    whatItIs: "Low-affinity Fc-gamma receptor III.",
    normalExpression: "NK cells and mature neutrophils.",
  },
  {
    marker: "CD57",
    lineages: ["nk", "t"],
    whatItIs: "A terminal-differentiation carbohydrate antigen.",
    normalExpression: "NK cells and terminally differentiated cytotoxic T cells.",
  },

  // --- Plasma cell ----------------------------------------------------------
  {
    marker: "CD138",
    aliases: ["syndecan-1"],
    lineages: ["plasma"],
    whatItIs: "A heparan-sulfate proteoglycan; the classic plasma-cell marker.",
    normalExpression: "Plasma cells (normal and neoplastic).",
  },

  // --- Shared / gating ------------------------------------------------------
  {
    marker: "CD45",
    aliases: ["leukocyte common antigen", "LCA"],
    lineages: ["stem", "myeloid", "monocytic", "b", "t", "nk"],
    whatItIs: "The leukocyte common antigen (a phosphatase); the backbone of gating.",
    normalExpression:
      "All leukocytes with maturation-dependent intensity; dim on blasts — the basis of the CD45-dim/low-SSC blast gate.",
  },
  {
    marker: "CD56",
    aliases: ["NCAM"],
    lineages: ["nk", "plasma", "myeloid"],
    whatItIs: "Neural cell adhesion molecule.",
    normalExpression:
      "NK cells; aberrant on myeloblasts and on neoplastic plasma cells (normal PCs are CD56-).",
  },
  {
    marker: "CD25",
    lineages: ["t", "myeloid"],
    whatItIs: "The IL-2 receptor alpha chain.",
    normalExpression:
      "Activated T cells, Tregs, hairy-cell leukemia, mast cells; on myeloblasts it tracks with FLT3-ITD.",
  },
];

export const ABERRANCY_RULES: AberrancyRule[] = [
  {
    marker: "CD7",
    context: "myeloblast",
    expressions: ["positive", "aberrant", "dim", "subset"],
    flag: "CD7 on myeloblasts",
    significance:
      "The most common cross-lineage (lymphoid) antigen on myeloblasts. Not lineage-defining, but marks an aberrant, clonal blast population and helps separate blasts from normal progenitors.",
  },
  {
    marker: "CD56",
    context: "myeloblast",
    expressions: ["positive", "aberrant", "bright"],
    flag: "CD56 aberrancy on blasts",
    significance:
      "Aberrant CD56 on myeloblasts is associated with t(8;21) AML and, in several series, inferior outcome; it also helps distinguish neoplastic blasts from normal progenitors.",
  },
  {
    marker: "CD19",
    context: "myeloblast",
    expressions: ["positive", "aberrant", "subset"],
    flag: "CD19 on myeloblasts",
    significance:
      "Aberrant B-antigen expression classically accompanies t(8;21)/RUNX1::RUNX1T1 AML (the CD34+/CD19+/CD56+ triad, often with PAX5).",
  },
  {
    marker: "CD2",
    context: "myeloblast",
    expressions: ["positive", "aberrant"],
    flag: "CD2 on blasts",
    significance:
      "Aberrant CD2 is a recognized clue to the microgranular variant of APL and to inv(16) AML.",
  },
  {
    marker: "HLA-DR",
    context: "myeloblast",
    expressions: ["negative"],
    flag: "HLA-DR negative",
    significance:
      "HLA-DR-negative blasts with bright MPO and CD34-negativity are the hallmark immunophenotype of acute promyelocytic leukemia — a same-day, act-on-it finding.",
  },
  {
    marker: "CD34",
    context: "myeloblast",
    expressions: ["negative"],
    flag: "CD34 negative blasts",
    significance:
      "CD34-negative blasts occur in APL and in NPM1-mutated / monocytic AML; do not let CD34-negativity talk you out of an acute leukemia.",
  },
  {
    marker: "CD25",
    context: "myeloblast",
    expressions: ["positive", "aberrant"],
    flag: "CD25 on blasts",
    significance:
      "Aberrant CD25 on myeloblasts is enriched in FLT3-ITD-mutated AML.",
  },
  {
    marker: "TdT",
    context: "myeloblast",
    expressions: ["positive", "subset"],
    flag: "TdT on myeloblasts",
    significance:
      "Marks blast immaturity; when strong and combined with other lymphoid antigens, prompts consideration of mixed-phenotype acute leukemia.",
  },
  {
    marker: "CD56",
    context: "plasma",
    expressions: ["positive", "aberrant", "bright"],
    flag: "CD56 on plasma cells",
    significance:
      "Normal plasma cells are CD56-negative; CD56 expression supports a neoplastic (myeloma) plasma-cell population.",
  },
  {
    marker: "CD19",
    context: "plasma",
    expressions: ["negative"],
    flag: "CD19 loss on plasma cells",
    significance:
      "Normal plasma cells retain CD19; its loss (with CD56 gain and light-chain restriction) marks a clonal plasma-cell population.",
  },
  {
    marker: "CD117",
    context: "plasma",
    expressions: ["positive", "aberrant"],
    flag: "CD117 on plasma cells",
    significance: "Aberrant CD117 supports a neoplastic plasma-cell phenotype.",
  },
  {
    marker: "CD5",
    context: "bcell",
    expressions: ["positive", "aberrant"],
    flag: "CD5+ B cells",
    significance:
      "A CD5-positive clonal B population narrows the differential to CLL/SLL and mantle-cell lymphoma.",
  },
];

// --- Lookups ---------------------------------------------------------------

const MARKER_INDEX = new Map<string, MarkerInfo>();
for (const m of MARKERS) {
  MARKER_INDEX.set(m.marker.toUpperCase(), m);
  for (const alias of m.aliases ?? []) MARKER_INDEX.set(alias.toUpperCase(), m);
}

export function lookupMarker(name: string): MarkerInfo | undefined {
  return MARKER_INDEX.get(name.trim().toUpperCase());
}

export function markersForLineage(lineage: Lineage): MarkerInfo[] {
  return MARKERS.filter((m) => m.lineages.includes(lineage));
}
