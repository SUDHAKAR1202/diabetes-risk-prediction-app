const LABELS = { low: "Low risk", moderate: "Moderate risk", high: "High risk" };

export default function RiskStrip({ result, bands }) {
  const { percent, risk_level: level } = result;
  const low = bands.low_below * 100;
  const high = bands.high_from * 100;

  return (
    <section className={`strip-panel level-${level}`} aria-labelledby="risk-heading">
      <div className="reading">
        <p className="big" id="risk-heading" aria-live="polite">
          {percent.toFixed(0)}
          <span className="pct">%</span>
        </p>
        <div>
          <p className="level">{LABELS[level]}</p>
          <p className="explain">
            The model puts this profile at a {percent.toFixed(1)}% chance of matching people with
            diabetes in its training data.
          </p>
        </div>
      </div>

      <div className="strip" role="img" aria-label={`Score ${percent.toFixed(1)} percent on a 0 to 100 scale`}>
        <div className="zones">
          <span className="zone z-low" style={{ width: `${low}%` }} />
          <span className="zone z-mod" style={{ width: `${high - low}%` }} />
          <span className="zone z-high" style={{ width: `${100 - high}%` }} />
        </div>
        <div className="ticks" aria-hidden="true">
          {Array.from({ length: 21 }, (_, i) => (
            <i key={i} className={i % 5 === 0 ? "major" : ""} />
          ))}
        </div>
        <div className="marker" style={{ left: `${Math.min(100, Math.max(0, percent))}%` }} />
        <div className="scale" aria-hidden="true">
          <span>0</span>
          <span style={{ left: `${low}%` }}>{low}</span>
          <span style={{ left: `${high}%` }}>{high}</span>
          <span style={{ left: "100%" }}>100</span>
        </div>
      </div>
    </section>
  );
}
