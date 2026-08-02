import { useApp } from "../context";

export function AppHeader({
  caseTitle,
  onNewCase,
  onOpenSettings,
}: {
  caseTitle?: string;
  onNewCase?: () => void;
  onOpenSettings: () => void;
}) {
  const { theme, setTheme } = useApp();
  const cycleTheme = () =>
    setTheme(theme === "system" ? "light" : theme === "light" ? "dark" : "system");
  const themeIcon = theme === "light" ? "☀" : theme === "dark" ? "☾" : "◐";

  return (
    <header className="app-header">
      <div className="app-header-inner container">
        <div className="brand">
          <span className="brand-mark" aria-hidden>
            ⬡
          </span>
          <div className="brand-text">
            <span className="brand-name">Marrow</span>
            <span className="brand-tag muted">staged bone-marrow reasoning</span>
          </div>
        </div>

        {caseTitle && (
          <div className="header-case">
            <span className="muted">case</span>{" "}
            <span className="header-case-title">{caseTitle}</span>
          </div>
        )}

        <div className="header-actions">
          {onNewCase && (
            <button className="btn btn-sm" onClick={onNewCase}>
              New case
            </button>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={onOpenSettings}
            title="Primer deep-link settings"
          >
            Primers
          </button>
          <button
            className="btn btn-ghost btn-sm theme-toggle"
            onClick={cycleTheme}
            title={`Theme: ${theme}`}
            aria-label={`Theme: ${theme}. Click to change.`}
          >
            {themeIcon}
          </button>
        </div>
      </div>
    </header>
  );
}
