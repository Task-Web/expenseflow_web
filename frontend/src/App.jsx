import { useEffect } from "react";
import { api } from "./apiClient";

const COOKIE_NAME = import.meta.env.VITE_COOKIE_NAME || "user_id";
const COOKIE_MAX_AGE = Number(import.meta.env.VITE_COOKIE_MAX_AGE || 60 * 60 * 24 * 30);
const EXPENSEFLOW_ENTRY = "/expenseflow/index.html";

// this function checks the URL for a "cookie" query parameter,
// sets the cookie accordingly, and reloads the page without the query parameter
// when build on the basesite, the below function should remain unchanged
const applyCookieFromQuery = () => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  const override = url.searchParams.get("cookie");
  if (!override) return false;
  let cookie = `${COOKIE_NAME}=${encodeURIComponent(override)}; Path=/; SameSite=Lax`;
  if (Number.isFinite(COOKIE_MAX_AGE) && COOKIE_MAX_AGE > 0) {
    cookie += `; Max-Age=${Math.floor(COOKIE_MAX_AGE)}`;
  }
  document.cookie = cookie;
  const redirectUrl = url.origin;
  if (window.location.href !== redirectUrl) {
    window.location.replace(redirectUrl);
    return true;
  }
  return false;
};

const redirectApiPath = () => {
  if (typeof window === "undefined") return false;
  const path = window.location.pathname;
  if (!(path === "/api" || path.startsWith("/api/"))) return false;
  const base = api.baseUrl || "/api";
  if (!/^https?:/i.test(base)) return false;
  const suffix = path === "/api" ? "" : path.slice(4);
  const target = `${base.replace(/\/+$/, "")}${suffix}${window.location.search}${window.location.hash}`;
  if (window.location.href !== target) {
    window.location.replace(target);
    return true;
  }
  return false;
};

function App() {
  useEffect(() => {
    if (redirectApiPath()) return;
    const redirected = applyCookieFromQuery();
    if (redirected) return;
    if (!window.location.pathname.startsWith("/expenseflow/")) {
      window.location.replace(EXPENSEFLOW_ENTRY);
    }
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">ExpenseFlow Reports</h1>
      <p className="text-sm text-slate-600">Launching the ExpenseFlow UI...</p>
      <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
        <a
          className="rounded-full border border-slate-300 px-4 py-2 text-slate-700"
          href={EXPENSEFLOW_ENTRY}
        >
          Open ExpenseFlow
        </a>
        <a
          className="rounded-full border border-slate-300 px-4 py-2 text-slate-700"
          href="/state-manage"
        >
          State console
        </a>
      </div>
    </div>
  );
}

export default App;
