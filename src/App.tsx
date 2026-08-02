import { useState } from "react";
import type { HemeCase } from "./types/case";
import { AppProvider } from "./context";
import { AppHeader } from "./components/AppHeader";
import { CaseLoader } from "./components/CaseLoader";
import { Workspace } from "./components/Workspace";
import { SettingsModal } from "./components/SettingsModal";

function AppInner() {
  const [activeCase, setActiveCase] = useState<HemeCase | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app">
      <AppHeader
        caseTitle={activeCase?.title}
        onNewCase={activeCase ? () => setActiveCase(null) : undefined}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <main className="app-main">
        {activeCase ? (
          <div className="container">
            <Workspace key={activeCase.id} case={activeCase} />
          </div>
        ) : (
          <CaseLoader onLoad={setActiveCase} />
        )}
      </main>
      <footer className="app-footer">
        <div className="container muted">
          Educational tool for hematopathology training. Not for clinical use;
          verify against current WHO, ICC, ELN, and IPSS references. All input is
          assumed de-identified.
        </div>
      </footer>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
