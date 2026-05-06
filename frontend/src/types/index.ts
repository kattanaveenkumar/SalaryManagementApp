export interface Employee {
  id: number;
  full_name: string;
  job_title: string;
  country: string;
  salary: number;
  created_at: string;
  updated_at: string;
}

export type EmployeeFormData = Omit<Employee, "id" | "created_at" | "updated_at">;

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

export interface EmployeeFilters {
  country?: string;
  job_title?: string;
  page?: number;
  per_page?: number;
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
  full_name: string;
  job_title: string;
  country: string;
  salary: number;
}
