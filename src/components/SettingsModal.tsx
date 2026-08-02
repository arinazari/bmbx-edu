import { useState } from "react";
import { useApp } from "../context";
import { KNOWN_PRIMER_ENTITIES, primerUrl } from "../lib/primers/primers";

// Configure the deep-link base for external primers. The brief's idea: don't
// rewrite teaching content — point each entity at the user's own primer library.

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { primerConfig, setPrimerConfig } = useApp();
  const [baseUrl, setBaseUrl] = useState(primerConfig.baseUrl);

  const save = () => {
    setPrimerConfig({ ...primerConfig, baseUrl: baseUrl.trim() });
    onClose();
  };

  const preview = primerUrl("npm1", { ...primerConfig, baseUrl });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="modal-head">
          <h3>Primer deep-links</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="modal-body stack">
          <p className="secondary">
            Entities and genes deep-link to your existing primers instead of
            re-teaching them here. Set the base URL of your primer library; the
            entity anchor (e.g. <code>npm1</code>) is appended.
          </p>
          <label className="field">
            <span className="section-title">Primer base URL</span>
            <input
              type="url"
              placeholder="https://primers.example.edu/heme/"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </label>
          {baseUrl ? (
            <div className="muted">
              Example: NPM1 links to <code>{preview}</code>
            </div>
          ) : (
            <div className="muted">
              Empty base URL disables deep-links (labels render as plain text).
            </div>
          )}
          <details className="anchors">
            <summary className="secondary">Known primer anchors</summary>
            <div className="anchor-chips">
              {KNOWN_PRIMER_ENTITIES.map((e) => (
                <span key={e} className="pill">
                  {e}
                </span>
              ))}
            </div>
          </details>
        </div>
        <div className="modal-foot">
          <button className="btn" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={save}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
