export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

async function request(path, options) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(`Can't reach the API at ${API_URL}. Start the backend and try again.`);
  }
  if (!res.ok) {
    let message = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (Array.isArray(body.detail)) {
        message = body.detail
          .map((d) => `${d.loc?.slice(-1)[0] ?? "input"}: ${d.msg}`)
          .join("; ");
      } else if (body.detail) {
        message = String(body.detail);
      }
    } catch {
      /* keep default message */
    }
    throw new Error(message);
  }
  return res.json();
}

export const getSchema = () => request("/schema");

export const predict = (values) =>
  request("/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });
