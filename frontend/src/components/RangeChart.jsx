function status(value, typical) {
  if (!typical) return null;
  if (value < typical[0]) return { text: "below typical range", cls: "off" };
  if (value > typical[1]) return { text: "above typical range", cls: "off" };
  return { text: "within typical range", cls: "in" };
}

export default function RangeChart({ features, values }) {
  return (
    <section className="panel" aria-labelledby="range-heading">
      <h2 id="range-heading">Your values against typical ranges</h2>
      <ul className="ranges">
        {features.map((f) => {
          const v = values[f.name];
          const span = f.max - f.min;
          const pos = ((v - f.min) / span) * 100;
          const st = status(v, f.typical);
          return (
            <li key={f.name}>
              <div className="row-head">
                <span>{f.label}</span>
                <span className="val">
                  {v} <span className="unit">{f.unit}</span>
                </span>
              </div>
              <div className="track">
                {f.typical && (
                  <span
                    className="band"
                    style={{
                      left: `${((f.typical[0] - f.min) / span) * 100}%`,
                      width: `${((f.typical[1] - f.typical[0]) / span) * 100}%`,
                    }}
                  />
                )}
                <span className={`dot ${st ? st.cls : ""}`} style={{ left: `${pos}%` }} />
              </div>
              <p className="sub">
                {st ? `${st.text} (${f.typical[0]} to ${f.typical[1]})` : "No standard range for this measure"}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="small">Ranges are general adult guides for context, not a diagnosis.</p>
    </section>
  );
}
