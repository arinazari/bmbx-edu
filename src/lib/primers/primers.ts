// Deep-link registry for external primers. The idea from the brief: don't
// rewrite teaching content — link each entity/gene to the user's existing
// primers. The base URL and per-entity slugs are configurable so this points at
// a real primer library; a sensible default is provided and can be overridden
// at runtime (persisted to localStorage) via the settings panel.

export interface PrimerConfig {
  /** Base URL; the entity slug is appended. Empty disables deep links. */
  baseUrl: string;
  /** Optional explicit overrides: entity anchor -> full URL. */
  overrides: Record<string, string>;
}

const STORAGE_KEY = "marrow.primerConfig";

export const DEFAULT_PRIMER_CONFIG: PrimerConfig = {
  // Placeholder: swap for your primer library's base, e.g.
  // "https://primers.example.edu/heme/". The entity anchor is appended.
  baseUrl: "",
  overrides: {},
};

export function loadPrimerConfig(): PrimerConfig {
  if (typeof localStorage === "undefined") return DEFAULT_PRIMER_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PRIMER_CONFIG;
    const parsed = JSON.parse(raw) as Partial<PrimerConfig>;
    return {
      baseUrl: parsed.baseUrl ?? DEFAULT_PRIMER_CONFIG.baseUrl,
      overrides: parsed.overrides ?? {},
    };
  } catch {
    return DEFAULT_PRIMER_CONFIG;
  }
}

export function savePrimerConfig(config: PrimerConfig): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

/** Resolve an entity anchor to a primer URL, or null if none configured. */
export function primerUrl(entity: string, config: PrimerConfig): string | null {
  if (config.overrides[entity]) return config.overrides[entity];
  if (!config.baseUrl) return null;
  const sep = config.baseUrl.endsWith("/") ? "" : "/";
  return `${config.baseUrl}${sep}${encodeURIComponent(entity)}`;
}

/** Human labels for known primer anchors, for the settings panel. */
export const KNOWN_PRIMER_ENTITIES = [
  "npm1",
  "flt3",
  "cebpa",
  "runx1",
  "tp53",
  "asxl1",
  "srsf2",
  "sf3b1",
  "u2af1",
  "idh1",
  "idh2",
  "dnmt3a",
  "tet2",
  "kit",
  "ras",
  "wt1",
  "ddx41",
  "jak2",
  "calr",
  "mpl",
];
