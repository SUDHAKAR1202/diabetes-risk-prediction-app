import { useCallback, useEffect, useState } from "react";
import { API_URL, getSchema, predict } from "./api.js";
import InputForm from "./components/InputForm.jsx";
import RiskStrip from "./components/RiskStrip.jsx";
import RangeChart from "./components/RangeChart.jsx";
import Drivers from "./components/Drivers.jsx";
import History from "./components/History.jsx";

const HISTORY_KEY = "diabetes-dashboard-history-v1";
const THEME_KEY = "diabetes-dashboard-theme-v1";

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}
function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable: history just won't persist */
  }
}

function loadTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "dark" || saved === "light") return saved;
    // Fall back to system preference
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [schema, setSchema] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [values, setValues] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [report, setReport] = useState(null); // { values, result }
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState(loadHistory);
  const [theme, setTheme] = useState(loadTheme);

  // Apply theme to <html> element and persist
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* storage unavailable */
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  };

  const connect = useCallback(async () => {
    setLoadError("");
    try {
      const s = await getSchema();
      setSchema(s);
      setValues((prev) =>
        Object.keys(prev).length
          ? prev
          : Object.fromEntries(s.features.map((f) => [f.name, String(f.default)]))
      );
    } catch (e) {
      setLoadError(e.message);
    }
  }, []);

  useEffect(() => {
    connect();
  }, [connect]);

  const setField = (name, value) => {
    setValues((v) => ({ ...v, [name]: value }));
    setFieldErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };

  const resetToSample = () => {
    setValues(Object.fromEntries(schema.features.map((f) => [f.name, String(f.default)])));
    setFieldErrors({});
  };

  const submit = async () => {
    const errors = {};
    const numeric = {};
    for (const f of schema.features) {
      const raw = values[f.name];
      const n = Number(raw);
      if (raw === "" || raw == null || Number.isNaN(n)) errors[f.name] = "Enter a number.";
      else if (n < f.min || n > f.max) errors[f.name] = `Use a value from ${f.min} to ${f.max}.`;
      else numeric[f.name] = n;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setLoading(true);
    setSubmitError("");
    try {
      const result = await predict(numeric);
      setReport({ values: numeric, result });
      const entry = {
        id: Date.now(),
        at: new Date().toISOString(),
        values: numeric,
        percent: result.percent,
        risk_level: result.risk_level,
      };
      setHistory((h) => {
        const next = [entry, ...h].slice(0, 12);
        saveHistory(next);
        return next;
      });
    } catch (e) {
      setSubmitError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const restore = (entry) => {
    setValues(Object.fromEntries(Object.entries(entry.values).map(([k, v]) => [k, String(v)])));
    setFieldErrors({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <h1>Diabetes risk estimator</h1>
          <p className="lede">
            Enter clinical measurements to see how closely a profile matches people with diabetes in
            the model&rsquo;s training data.
          </p>
        </div>
        <div className="masthead-actions">
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">
                {theme === "dark" ? "🌙" : "☀️"}
              </span>
            </span>
          </button>
          <span className={`status ${schema ? "ok" : loadError ? "down" : ""}`} role="status">
            {schema ? "API connected" : loadError ? "API offline" : "Connecting…"}
          </span>
        </div>
      </header>

      {loadError && (
        <div className="notice error" role="alert">
          <p>{loadError}</p>
          <p className="small">
            From the <code>backend</code> folder run <code>uvicorn main:app --reload --port 8000</code>.
            Expected at <code>{API_URL}</code>.
          </p>
          <button className="btn secondary" onClick={connect}>
            Try again
          </button>
        </div>
      )}

      {schema && (
        <main className="layout">
          <InputForm
            features={schema.features}
            values={values}
            errors={fieldErrors}
            loading={loading}
            onChange={setField}
            onSubmit={submit}
            onSample={resetToSample}
          />

          <div className="results">
            {submitError && (
              <div className="notice error" role="alert">
                <p>{submitError}</p>
              </div>
            )}

            {report ? (
              <>
                <RiskStrip result={report.result} bands={schema.bands} />
                <div className="pair">
                  <RangeChart features={schema.features} values={report.values} />
                  <Drivers drivers={report.result.drivers} />
                </div>
              </>
            ) : (
              <section className="empty">
                <h2>No estimate yet</h2>
                <p>
                  Check the values on the left, then choose <strong>Calculate risk</strong>. The
                  sample values are a starting point; replace them with real measurements.
                </p>
              </section>
            )}

            <History items={history} onRestore={restore} onClear={clearHistory} />

            <p className="disclaimer">
              This is a statistical estimate from a model trained on a research dataset (adult women
              of Pima heritage). It is not a diagnosis. Talk to a clinician about your results and
              any symptoms.
            </p>
          </div>
        </main>
      )}
    </div>
  );
}