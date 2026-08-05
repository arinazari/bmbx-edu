import {
  scorePrediction,
  type Prediction,
} from "../lib/predict/predictions";

// Shown at the top of the layer that resolves a prediction: what you called
// before you looked, and how it held up.

export function PredictionResult({
  prediction,
  picks,
}: {
  prediction: Prediction;
  picks: string[];
}) {
  if (picks.length === 0) return null;
  const s = scorePrediction(prediction, picks);

  const verdict = s.perfect
    ? "You called it exactly."
    : s.anyHit
      ? "Partly right — check what you missed."
      : "This layer did not go the way you expected.";

  const tone = s.perfect ? "perfect" : s.anyHit ? "partial" : "miss";

  return (
    <div className={`predict-result card card-pad ${tone}`}>
      <div className="row spread wrap">
        <span className="section-title">Your prediction</span>
        <span className={`predict-verdict ${tone}`}>{verdict}</span>
      </div>
      <div className="predict-result-grid">
        {s.hits.length > 0 && (
          <div className="predict-col">
            <div className="predict-col-head hit">Called correctly</div>
            <ul>
              {s.hits.map((o) => (
                <li key={o.id}>✓ {o.label}</li>
              ))}
            </ul>
          </div>
        )}
        {s.misses.length > 0 && (
          <div className="predict-col">
            <div className="predict-col-head miss">Present, but you missed</div>
            <ul>
              {s.misses.map((o) => (
                <li key={o.id}>— {o.label}</li>
              ))}
            </ul>
          </div>
        )}
        {s.falseAlarms.length > 0 && (
          <div className="predict-col">
            <div className="predict-col-head false">You expected, but absent</div>
            <ul>
              {s.falseAlarms.map((o) => (
                <li key={o.id}>✗ {o.label}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
