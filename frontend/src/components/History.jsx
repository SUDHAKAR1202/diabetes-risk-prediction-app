const LABELS = { low: "Low", moderate: "Moderate", high: "High" };

export default function History({ items, onRestore, onClear }) {
  return (
    <section className="panel history" aria-labelledby="history-heading">
      <div className="row-head">
        <h2 id="history-heading">Recent estimates</h2>
        {items.length > 0 && (
          <button className="link" type="button" onClick={onClear}>
            Clear history
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="small">Your last estimates will appear here. They stay in this browser only.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Score</th>
                <th scope="col">Level</th>
                <th scope="col">Glucose</th>
                <th scope="col">BMI</th>
                <th scope="col">Age</th>
                <th scope="col">
                  <span className="sr">Action</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((h) => (
                <tr key={h.id}>
                  <td>
                    {new Date(h.at).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="num">{h.percent.toFixed(0)}%</td>
                  <td>
                    <span className={`chip ${h.risk_level}`}>{LABELS[h.risk_level]}</span>
                  </td>
                  <td className="num">{h.values.Glucose}</td>
                  <td className="num">{h.values.BMI}</td>
                  <td className="num">{h.values.Age}</td>
                  <td>
                    <button className="link" type="button" onClick={() => onRestore(h)}>
                      Load values
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
