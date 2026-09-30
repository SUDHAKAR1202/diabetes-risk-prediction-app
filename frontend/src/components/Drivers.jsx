export default function Drivers({ drivers }) {
  const max = Math.max(5, ...drivers.map((d) => Math.abs(d.impact)));
  return (
    <section className="panel" aria-labelledby="drivers-heading">
      <h2 id="drivers-heading">What is moving this score</h2>
      <p className="small lead">
        Each bar shows how many percentage points the score would change if that input were at a
        low-risk reference value. Bars on the right are pushing the score up.
      </p>
      <ul className="drivers">
        {drivers.map((d) => {
          const w = (Math.abs(d.impact) / max) * 50;
          const up = d.impact > 0;
          return (
            <li key={d.feature}>
              <span className="name">{d.label}</span>
              <span className="bar" aria-hidden="true">
                <span className="axis" />
                {d.impact !== 0 && (
                  <span
                    className={`fill ${up ? "up" : "down"}`}
                    style={up ? { left: "50%", width: `${w}%` } : { right: "50%", width: `${w}%` }}
                  />
                )}
              </span>
              <span className="num">
                {d.impact > 0 ? "+" : ""}
                {d.impact.toFixed(0)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="small">
        Estimates change one input at a time, so they will not add up exactly to the total.
      </p>
    </section>
  );
}
