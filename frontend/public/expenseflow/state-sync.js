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

let lastReportsByNumber = {};

function syncSubmittedReports(reports) {
  if (typeof fetch !== "function") {
    return Promise.resolve(null);
  }
  const current = Object.fromEntries(
    normalizeReports(reports).map((report) => [report.reportNumber, report])
  );
  const requests = [];
  Object.values(current).forEach((report) => {
    if (JSON.stringify(report) === JSON.stringify(lastReportsByNumber[report.reportNumber])) {
      return;
    }
    const reportPayload = {
      ...report,
      attachments: (Array.isArray(report.attachments) ? report.attachments : [])
        .filter((item) => item && item.id && item.filename)
        .map((item) => ({ id: item.id, filename: item.filename })),
    };
    requests.push(fetch(`${resolveApiBase()}/expenseflow/reports`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reportPayload),
    }));
  });
  Object.keys(lastReportsByNumber).forEach((reportNumber) => {
    if (current[reportNumber]) return;
    requests.push(fetch(
      `${resolveApiBase()}/expenseflow/reports/${encodeURIComponent(reportNumber)}`,
      { method: "DELETE", credentials: "include" }
    ));
  });
  lastReportsByNumber = current;
  return Promise.all(requests).catch(() => null);
}

if (typeof window !== "undefined") {
  window.ExpenseFlowStateSync = {
    DEFAULT_REPORT_NUMBER,
    resolveApiBase,
    normalizeReports,
    syncSubmittedReports,
  };
}

export {
  DEFAULT_REPORT_NUMBER,
  resolveApiBase,
  normalizeReports,
  syncSubmittedReports,
};
