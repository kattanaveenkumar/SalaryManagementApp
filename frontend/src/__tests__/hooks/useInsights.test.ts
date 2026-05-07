import { renderHook, waitFor } from "@testing-library/react";
import { useInsights } from "@/hooks/useInsights";
import { insightsApi } from "@/services/api";

jest.mock("@/services/api");
const mockApi = insightsApi as jest.Mocked<typeof insightsApi>;

const countrySalaries = [
  { country: "US", employee_count: 5, min_salary: 50000, max_salary: 120000, avg_salary: 85000 },
];
const jobTitleSalaries = [
  { job_title: "Engineer", country: "US", employee_count: 3, avg_salary: 90000 },
];
const percentiles = [{ country: "US", p25: 60000, p50: 80000, p75: 100000, p90: 115000 }];
const topEarners = [{ id: 1, full_name: "Alice", job_title: "CTO", country: "US", salary: 300000 }];

beforeEach(() => {
  mockApi.countrySalaries.mockResolvedValue({ data: countrySalaries });
  mockApi.jobTitleSalaries.mockResolvedValue({
    data: jobTitleSalaries,
    meta: { country_filter: null },
  });
  mockApi.salaryPercentiles.mockResolvedValue({ data: percentiles });
  mockApi.topEarners.mockResolvedValue({ data: topEarners });
});

afterEach(() => jest.clearAllMocks());

describe("useInsights", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useInsights());
    expect(result.current.loading).toBe(true);
  });

  it("loads all insights data on mount", async () => {
    const { result } = renderHook(() => useInsights());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.countrySalaries).toEqual(countrySalaries);
    expect(result.current.jobTitleSalaries).toEqual(jobTitleSalaries);
    expect(result.current.percentiles).toEqual(percentiles);
    expect(result.current.topEarners).toEqual(topEarners);
    expect(result.current.error).toBeNull();
  });

  it("calls all four API endpoints", async () => {
    const { result } = renderHook(() => useInsights());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.countrySalaries).toHaveBeenCalledTimes(1);
    expect(mockApi.jobTitleSalaries).toHaveBeenCalledTimes(1);
    expect(mockApi.salaryPercentiles).toHaveBeenCalledTimes(1);
    expect(mockApi.topEarners).toHaveBeenCalledTimes(1);
  });

  it("sets error state when any API call fails", async () => {
    mockApi.countrySalaries.mockRejectedValueOnce(new Error("Server error"));
    const { result } = renderHook(() => useInsights());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Server error");
  });

  it("uses fallback error message for non-Error rejections", async () => {
    mockApi.topEarners.mockRejectedValueOnce("unexpected");
    const { result } = renderHook(() => useInsights());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Failed to load insights");
  });
});
