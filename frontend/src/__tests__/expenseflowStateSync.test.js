import {
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

  it("creates and withdraws submitted reports through report resources", async () => {
    global.fetch = vi.fn().mockResolvedValue({});
    const reports = [
      { reportNumber: "ER-2025-1106-001" },
      { reportNumber: "ER-2026-0102-002" },
    ];

    await syncSubmittedReports(reports);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toMatch(/\/api\/expenseflow\/reports$/);
    expect(options.method).toBe("POST");
    expect(options.credentials).toBe("include");
    const body = JSON.parse(options.body);
    expect(body).toEqual({ reportNumber: "ER-2026-0102-002", attachments: [] });

    await syncSubmittedReports([]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.fetch.mock.calls[1][0]).toMatch(
      /\/api\/expenseflow\/reports\/ER-2026-0102-002$/
    );
    expect(global.fetch.mock.calls[1][1].method).toBe("DELETE");
  });
});
