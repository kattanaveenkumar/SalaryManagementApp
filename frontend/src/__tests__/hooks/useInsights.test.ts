import { renderHook, waitFor } from "@testing-library/react";
import { useInsights } from "@/hooks/useInsights";
import { insightsApi } from "@/services/api";
import type { CompanyKPIs, TopEarner } from "@/types";

jest.mock("@/services/api");
const mockApi = insightsApi as jest.Mocked<typeof insightsApi>;

const kpis: CompanyKPIs = {
  total_headcount: 10,
  active_headcount: 8,
  avg_salary: 85000,
  median_salary: 80000,
  total_payroll: 680000,
  on_probation: 1,
  on_leave: 1,
  reviews_due_90d: 2,
  dept_breakdown: [],
  status_breakdown: [],
  type_breakdown: [],
  dept_avg_salary: [],
};

const topEarners: TopEarner[] = [
  {
    id: 1,
    employee_id: null,
    full_name: "Alice",
    display_name: "Alice",
    initials: "A",
    job_title: "CTO",
    department: null,
    country: "US",
    salary: 300000,
    currency: null,
    employment_status: null,
    job_level: null,
  },
];

beforeEach(() => {
  mockApi.companyKpis.mockResolvedValue({ data: kpis });
  mockApi.topEarners.mockResolvedValue({ data: topEarners });
});

afterEach(() => jest.clearAllMocks());

describe("useInsights", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useInsights());
    expect(result.current.loading).toBe(true);
  });

  it("loads kpis and top earners on mount", async () => {
    const { result } = renderHook(() => useInsights());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.kpis).toEqual(kpis);
    expect(result.current.topEarners).toEqual(topEarners);
    expect(result.current.error).toBeNull();
  });

  it("calls companyKpis and topEarners endpoints", async () => {
    const { result } = renderHook(() => useInsights());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(mockApi.companyKpis).toHaveBeenCalledTimes(1);
    expect(mockApi.topEarners).toHaveBeenCalledTimes(1);
  });

  it("sets error state when an API call fails", async () => {
    mockApi.companyKpis.mockRejectedValueOnce(new Error("Server error"));
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
