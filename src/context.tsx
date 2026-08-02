import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_PRIMER_CONFIG,
  loadPrimerConfig,
  savePrimerConfig,
  type PrimerConfig,
} from "./lib/primers/primers";

type Theme = "light" | "dark" | "system";

interface AppContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  primerConfig: PrimerConfig;
  setPrimerConfig: (c: PrimerConfig) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const THEME_KEY = "marrow.theme";

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof localStorage === "undefined") return "system";
    return (localStorage.getItem(THEME_KEY) as Theme) ?? "system";
  });
  const [primerConfig, setPrimerConfigState] = useState<PrimerConfig>(() =>
    typeof window === "undefined" ? DEFAULT_PRIMER_CONFIG : loadPrimerConfig(),
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const value = useMemo<AppContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      primerConfig,
      setPrimerConfig: (c) => {
        setPrimerConfigState(c);
        savePrimerConfig(c);
      },
    }),
    [theme, primerConfig],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
