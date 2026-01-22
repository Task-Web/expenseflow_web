const DEFAULT_REPORT_NUMBER = "ER-2025-1106-001";

function isLocalHost() {
  const host = window.location && window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1";
}

function resolveApiBase() {
  if (typeof window === "undefined") {
    return "/api";
  }
  if (window.ExpenseApp && window.ExpenseApp.api && window.ExpenseApp.api.getBase) {
    return window.ExpenseApp.api.getBase();
  }
  var base = window.ExpenseFlowApiBase || window.EXPENSEFLOW_API_BASE || "";
  if (!base) {
    try {
      base = window.localStorage
        ? window.localStorage.getItem("expenseflowApiBase") || ""
        : "";
    } catch (error) {
      base = "";
    }
  }
  if (!base && isLocalHost()) {
    return "http://localhost:8000/api";
  }
  if (!base && window.document && window.document.body) {
    base = window.document.body.getAttribute("data-api-base") || "";
  }
  if (base) {
    return String(base).replace(/\/+$/, "");
  }
  if (window.location && window.location.port === "5173") {
    return "http://localhost:8000/api";
  }
  return "/api";
}

function normalizeReports(reports) {
  if (!Array.isArray(reports)) {
    return [];
  }
  return reports.filter((report) => {
    return (
      report &&
      report.reportNumber &&
      report.reportNumber !== DEFAULT_REPORT_NUMBER
    );
  });
}

function buildStatePatch(reports) {
  return {
    expenseflow: {
      submitted_expense_reports: normalizeReports(reports),
    },
  };
}

function syncSubmittedReports(reports, note) {
  if (typeof fetch !== "function") {
    return Promise.resolve(null);
  }
  const payload = {
    data: buildStatePatch(reports),
    note:
      note ||
      "Sync submitted expense reports from ExpenseFlow UI.",
  };
  return fetch(`${resolveApiBase()}/state`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => null);
}

if (typeof window !== "undefined") {
  window.ExpenseFlowStateSync = {
    DEFAULT_REPORT_NUMBER,
    resolveApiBase,
    normalizeReports,
    buildStatePatch,
    syncSubmittedReports,
  };
}

export {
  DEFAULT_REPORT_NUMBER,
  resolveApiBase,
  normalizeReports,
  buildStatePatch,
  syncSubmittedReports,
};
