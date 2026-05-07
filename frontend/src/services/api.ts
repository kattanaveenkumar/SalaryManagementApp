import type {
  AuthResponse,
  CompanyKPIs,
  CountrySalary,
  Employee,
  EmployeeFilters,
  EmployeeFormData,
  JobTitleSalary,
  PaginatedResponse,
  SalaryPercentile,
  TopEarner,
} from "@/types";

// Empty string → relative URL → Next.js rewrite proxies to backend (Docker mode).
// Non-empty → direct URL for local dev outside Docker.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json();

  if (!res.ok) {
    const message = Array.isArray(body.errors)
      ? body.errors.join(", ")
      : (body.error ?? `HTTP ${res.status}`);

    // Only auto-redirect on 401 for protected API calls (not auth endpoints).
    // Auth endpoints legitimately return 401 for wrong credentials.
    if (res.status === 401 && !path.includes("/auth/")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");
        window.location.href = "/login";
      }
    }
    throw new Error(message);
  }

  return body;
}

export const authApi = {
  login(email: string, password: string): Promise<AuthResponse> {
    return request("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ user: { email, password } }),
    });
  },

  signup(email: string, password: string, password_confirmation: string): Promise<AuthResponse> {
    return request("/api/v1/auth/signup", {
      method: "POST",
      body: JSON.stringify({ user: { email, password, password_confirmation } }),
    });
  },
};

export const employeeApi = {
  list(filters: EmployeeFilters): Promise<PaginatedResponse<Employee>> {
    const params = new URLSearchParams();
    (Object.entries(filters) as [string, string | number | undefined][]).forEach(([k, v]) => {
      if (v !== undefined && v !== "") params.set(k, String(v));
    });
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

  update(id: number, data: Partial<EmployeeFormData>): Promise<{ data: Employee }> {
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
  companyKpis(): Promise<{ data: CompanyKPIs }> {
    return request("/api/v1/insights/company_kpis");
  },

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
