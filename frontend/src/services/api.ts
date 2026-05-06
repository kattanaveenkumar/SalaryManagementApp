import type {
  CountrySalary,
  Employee,
  EmployeeFilters,
  EmployeeFormData,
  JobTitleSalary,
  PaginatedResponse,
  SalaryPercentile,
  TopEarner,
} from "@/types";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();

  if (!res.ok) {
    const message = Array.isArray(body.errors)
      ? body.errors.join(", ")
      : (body.error ?? `HTTP ${res.status}`);
    throw new Error(message);
  }

  return body;
}

export const employeeApi = {
  list(filters: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    (Object.entries(filters) as [string, string | number | undefined][]).forEach(
      ([k, v]) => {
        if (v !== undefined && v !== "") params.set(k, String(v));
      },
    );
    return request(`/api/v1/employees?${params.toString()}`);
  },

  get(id: number): Promise<{ data: Employee }> {
    return request(`/api/v1/employees/${id}`);
  },

  create(data: EmployeeFormData): Promise<{ data: Employee }> {
    return request("/api/v1/employees", {
      method: "POST",
      body: JSON.stringify({ employee: data }),
    });
  },

  update(
    id: number,
    data: Partial<EmployeeFormData>,
  ): Promise<{ data: Employee }> {
    return request(`/api/v1/employees/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ employee: data }),
    });
  },

  delete(id: number): Promise<void> {
    return request(`/api/v1/employees/${id}`, { method: "DELETE" });
  },
};

export const insightsApi = {
  countrySalaries(): Promise<{ data: CountrySalary[] }> {
    return request("/api/v1/insights/country_salaries");
  },

  jobTitleSalaries(
    country?: string,
  ): Promise<{ data: JobTitleSalary[]; meta: { country_filter: string | null } }> {
    const q = country ? `?country=${encodeURIComponent(country)}` : "";
    return request(`/api/v1/insights/job_title_salaries${q}`);
  },

  salaryPercentiles(): Promise<{ data: SalaryPercentile[] }> {
    return request("/api/v1/insights/salary_percentiles");
  },

  topEarners(limit = 10): Promise<{ data: TopEarner[] }> {
    return request(`/api/v1/insights/top_earners?limit=${limit}`);
  },
};
