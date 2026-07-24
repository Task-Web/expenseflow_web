const FALLBACK_API_BASE = "http://localhost:8000/api";
const normalizeBase = (value) => String(value || "").replace(/\/+$/, "");
const isLocalHost = () => {
  if (typeof window === "undefined") {
    return false;
  }
  const host = window.location && window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
};
const API_BASE = (() => {
  const envBase = import.meta.env.VITE_API_BASE;
  if (typeof window !== "undefined") {
    const runtimeBase =
      window.ExpenseFlowApiBase ||
      window.EXPENSEFLOW_API_BASE ||
      (typeof window.localStorage !== "undefined" &&
        window.localStorage.getItem("expenseflowApiBase"));
    if (runtimeBase) {
      return normalizeBase(runtimeBase);
    }
    if (envBase) {
      return normalizeBase(envBase);
    }
    if (isLocalHost()) {
      return FALLBACK_API_BASE;
    }
    const dataBase =
      typeof document !== "undefined" &&
      document.body &&
      document.body.getAttribute("data-api-base");
    if (dataBase) {
      return normalizeBase(dataBase);
    }
  }
  return normalizeBase(envBase || FALLBACK_API_BASE);
})();

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.detail || response.statusText || "Request failed";
    throw new Error(message);
  }

  return response.json();
}

export const api = {
  baseUrl: API_BASE,
  getInfo: () => request("/info"),
  listFiles: () => request("/files"),
  uploadFiles: (files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    return request("/files", { method: "POST", body: formData });
  },
};
