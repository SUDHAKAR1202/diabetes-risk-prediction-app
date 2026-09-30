export default function InputForm({ features, values, errors, loading, onChange, onSubmit, onSample }) {
  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      noValidate
    >
      <h2>Measurements</h2>
      {features.map((f) => {
        const id = `f-${f.name}`;
        const err = errors[f.name];
        return (
          <div className={`field ${err ? "has-error" : ""}`} key={f.name}>
            <label htmlFor={id}>
              {f.label} <span className="unit">{f.unit}</span>
            </label>
            <div className="control">
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={values[f.name] ?? f.default}
                onChange={(e) => onChange(f.name, e.target.value)}
                aria-label={`${f.label} slider`}
                tabIndex={-1}
              />
              <input
                id={id}
                type="number"
                inputMode="decimal"
                min={f.min}
                max={f.max}
                step={f.step}
                value={values[f.name] ?? ""}
                onChange={(e) => onChange(f.name, e.target.value)}
                aria-describedby={`${id}-hint`}
                aria-invalid={err ? "true" : "false"}
              />
            </div>
            <p className="hint" id={`${id}-hint`}>
              {err || f.hint}
            </p>
          </div>
        );
      })}
      <div className="actions">
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Calculating…" : "Calculate risk"}
        </button>
        <button className="btn secondary" type="button" onClick={onSample}>
          Reset to sample values
        </button>
      </div>
    </form>
  );
}
