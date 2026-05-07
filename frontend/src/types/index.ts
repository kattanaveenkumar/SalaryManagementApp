// ── Auth ──────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Employee domain ───────────────────────────────────────────────────────────

export type EmploymentStatus = "Active" | "Probation" | "On Leave" | "Resigned" | "Terminated";
export type EmploymentType = "Full-Time" | "Part-Time" | "Contractor" | "Intern";
export type SortOrder = "asc" | "desc";

export interface Employee {
  id: number;
  employee_id: string | null;
  // Name
  first_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  full_name: string;
  display_name: string;
  initials: string;
  // Contact
  work_email: string | null;
  phone_number: string | null;
  // Employment
  job_title: string;
  job_level: string | null;
  department: string | null;
  business_unit: string | null;
  employment_status: EmploymentStatus | null;
  employment_type: EmploymentType | null;
  manager_name: string | null;
  work_location: string | null;
  country: string;
  // Compensation
  salary: number;
  currency: string | null;
  salary_band: string | null;
  bonus_percentage: number | null;
  stock_grant_value: number | null;
  // Dates
  hire_date: string | null;
  compensation_review_date: string | null;
  // Meta
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type EmployeeFormData = {
  first_name?: string;
  last_name?: string;
  preferred_name?: string;
  full_name?: string;
  work_email?: string;
  phone_number?: string;
  job_title: string;
  job_level?: string;
  department?: string;
  business_unit?: string;
  employment_status?: EmploymentStatus;
  employment_type?: EmploymentType;
  manager_name?: string;
  work_location?: string;
  country: string;
  salary: number;
  currency?: string;
  salary_band?: string;
  bonus_percentage?: number;
  stock_grant_value?: number;
  hire_date?: string;
  compensation_review_date?: string;
  notes?: string;
};

// ── Filters ───────────────────────────────────────────────────────────────────

export interface EmployeeFilters {
  name?: string;
  email?: string;
  employee_id?: string;
  country?: string;
  job_title?: string;
  department?: string;
  employment_status?: string;
  employment_type?: string;
  job_level?: string;
  salary_band?: string;
  salary_min?: number;
  salary_max?: number;
  hire_date_from?: string;
  hire_date_to?: string;
  sort_by?: string;
  sort_order?: SortOrder;
  page?: number;
  per_page?: number;
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationMeta {
  total_count: number;
  total_pages: number;
  current_page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Insights ──────────────────────────────────────────────────────────────────

export interface DeptStat {
  department: string;
  headcount: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface TypeStat {
  type: string;
  count: number;
}

export interface DeptAvgSalary {
  department: string;
  avg_salary: number;
  headcount: number;
}

export interface CompanyKPIs {
  total_headcount: number;
  active_headcount: number;
  avg_salary: number;
  median_salary: number;
  total_payroll: number;
  on_probation: number;
  on_leave: number;
  reviews_due_90d: number;
  dept_breakdown: DeptStat[];
  status_breakdown: StatusStat[];
  type_breakdown: TypeStat[];
  dept_avg_salary: DeptAvgSalary[];
}

export interface CountrySalary {
  country: string;
  employee_count: number;
  min_salary: number;
  max_salary: number;
  avg_salary: number;
}

export interface JobTitleSalary {
  job_title: string;
  country: string;
  employee_count: number;
  avg_salary: number;
}

export interface SalaryPercentile {
  country: string;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
}

export interface TopEarner {
  id: number;
  employee_id: string | null;
  full_name: string;
  display_name: string;
  initials: string;
  job_title: string;
  department: string | null;
  country: string;
  salary: number;
  currency: string | null;
  employment_status: string | null;
  job_level: string | null;
}
