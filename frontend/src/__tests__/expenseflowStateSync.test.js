import {
  buildStatePatch,
  normalizeReports,
  syncSubmittedReports,
} from "../../public/expenseflow/state-sync.js";

describe("expenseflow state sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("filters out the default report", () => {
    const reports = [
      { reportNumber: "ER-2025-1106-001" },
      { reportNumber: "ER-2026-0102-002", purpose: "trip" },
      null,
    ];
    expect(normalizeReports(reports)).toEqual([
      { reportNumber: "ER-2026-0102-002", purpose: "trip" },
    ]);
  });

  it("builds a state patch payload", () => {
    const reports = [{ reportNumber: "ER-2026-0102-002" }];
    expect(buildStatePatch(reports)).toEqual({
      expenseflow: {
        submitted_expense_reports: reports,
      },
    });
  });

  it("syncs submitted reports via PATCH", async () => {
    global.fetch = vi.fn().mockResolvedValue({});
    const reports = [
      { reportNumber: "ER-2025-1106-001" },
      { reportNumber: "ER-2026-0102-002" },
    ];

    await syncSubmittedReports(reports, "sync note");

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe("/api/state");
    expect(options.method).toBe("PATCH");
    expect(options.credentials).toBe("include");
    const body = JSON.parse(options.body);
    expect(body.note).toBe("sync note");
    expect(body.data.expenseflow.submitted_expense_reports).toEqual([
      { reportNumber: "ER-2026-0102-002" },
    ]);
  });
});
