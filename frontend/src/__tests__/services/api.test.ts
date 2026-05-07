import { employeeApi, insightsApi } from "@/services/api";

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse(body: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

beforeEach(() => mockFetch.mockClear());

describe("employeeApi", () => {
  describe("list", () => {
    it("calls the correct endpoint", async () => {
      mockResponse({ data: [], meta: {} });
      await employeeApi.list({});
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/employees"),
        expect.any(Object),
      );
    });

    it("appends filter params to the URL", async () => {
      mockResponse({ data: [], meta: {} });
      await employeeApi.list({ country: "Germany", page: 2 });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).toContain("country=Germany");
      expect(url).toContain("page=2");
    });

    it("omits undefined and empty string params", async () => {
      mockResponse({ data: [], meta: {} });
      await employeeApi.list({ country: "", job_title: undefined });
      const url = mockFetch.mock.calls[0][0] as string;
      expect(url).not.toContain("country=");
      expect(url).not.toContain("job_title=");
    });
  });

  describe("create", () => {
    it("sends a POST request with employee body", async () => {
      const employee = { full_name: "Alice", job_title: "Dev", country: "US", salary: 80000 };
      mockResponse({ data: { id: 1, ...employee } });
      await employeeApi.create(employee);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/v1/employees");
      expect(opts.method).toBe("POST");
      expect(JSON.parse(opts.body)).toEqual({ employee });
    });
  });

  describe("update", () => {
    it("sends a PATCH request with employee body", async () => {
      mockResponse({ data: { id: 5, salary: 90000 } });
      await employeeApi.update(5, { salary: 90000 });
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/v1/employees/5");
      expect(opts.method).toBe("PATCH");
    });
  });

  describe("delete", () => {
    it("sends a DELETE request", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: () => Promise.resolve(undefined),
      });
      await employeeApi.delete(3);
      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toContain("/api/v1/employees/3");
      expect(opts.method).toBe("DELETE");
    });
  });

  describe("error handling", () => {
    it("throws with errors array message from API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ errors: ["Salary is too low", "Name is blank"] }),
      });
      await expect(
        employeeApi.create({ full_name: "", job_title: "", country: "", salary: 0 }),
      ).rejects.toThrow("Salary is too low, Name is blank");
    });

    it("throws with error string message from API", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "Not found" }),
      });
      await expect(employeeApi.get(999)).rejects.toThrow("Not found");
    });
  });
});

describe("insightsApi", () => {
  it("calls country_salaries endpoint", async () => {
    mockResponse({ data: [] });
    await insightsApi.countrySalaries();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/insights/country_salaries"),
      expect.any(Object),
    );
  });

  it("calls job_title_salaries without country param", async () => {
    mockResponse({ data: [], meta: { country_filter: null } });
    await insightsApi.jobTitleSalaries();
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/v1/insights/job_title_salaries");
    expect(url).not.toContain("country=");
  });

  it("calls job_title_salaries with country param", async () => {
    mockResponse({ data: [], meta: { country_filter: "Germany" } });
    await insightsApi.jobTitleSalaries("Germany");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("country=Germany");
  });

  it("calls salary_percentiles endpoint", async () => {
    mockResponse({ data: [] });
    await insightsApi.salaryPercentiles();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/v1/insights/salary_percentiles"),
      expect.any(Object),
    );
  });

  it("calls top_earners with default limit", async () => {
    mockResponse({ data: [] });
    await insightsApi.topEarners();
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=10"), expect.any(Object));
  });

  it("calls top_earners with custom limit", async () => {
    mockResponse({ data: [] });
    await insightsApi.topEarners(5);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("limit=5"), expect.any(Object));
  });
});
