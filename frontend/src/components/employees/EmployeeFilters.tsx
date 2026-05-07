"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { EmployeeFilters } from "@/types";

interface Props {
  filters: EmployeeFilters;
  onChange: (partial: Partial<EmployeeFilters>) => void;
}

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Marketing",
  "Operations",
  "Finance",
  "Human Resources",
  "Customer Success",
  "Legal & Compliance",
];
const STATUSES = ["Active", "Probation", "On Leave", "Resigned", "Terminated"];
const EMP_TYPES = ["Full-Time", "Part-Time", "Contractor", "Intern"];
const JOB_LEVELS = ["IC1", "IC2", "IC3", "IC4", "IC5", "M1", "M2", "M3", "M4"];
const BANDS = ["Band-1", "Band-2", "Band-3", "Band-4", "Band-5", "Band-6"];

export default function EmployeeFilters({ filters, onChange }: Props) {
  const [search, setSearch] = useState(filters.name ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearch(filters.name ?? "");
  }, [filters.name]);

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange({ name: value.trim() || undefined });
      }, 280);
    },
    [onChange],
  );

  const set = useCallback(
    (key: keyof EmployeeFilters, value: string | undefined) => {
      onChange({ [key]: value || undefined } as Partial<EmployeeFilters>);
    },
    [onChange],
  );

  const clearAll = useCallback(() => {
    setSearch("");
    onChange({
      name: undefined,
      country: undefined,
      job_title: undefined,
      department: undefined,
      employment_status: undefined,
      employment_type: undefined,
      job_level: undefined,
      salary_band: undefined,
      salary_min: undefined,
      salary_max: undefined,
    });
  }, [onChange]);

  const activeFilters: { key: keyof EmployeeFilters; label: string; value: string }[] = [];
  if (filters.name) activeFilters.push({ key: "name", label: "Name", value: filters.name });
  if (filters.department)
    activeFilters.push({ key: "department", label: "Dept", value: filters.department });
  if (filters.employment_status)
    activeFilters.push({
      key: "employment_status",
      label: "Status",
      value: filters.employment_status,
    });
  if (filters.employment_type)
    activeFilters.push({ key: "employment_type", label: "Type", value: filters.employment_type });
  if (filters.job_level)
    activeFilters.push({ key: "job_level", label: "Level", value: filters.job_level });
  if (filters.salary_band)
    activeFilters.push({ key: "salary_band", label: "Band", value: filters.salary_band });
  if (filters.country)
    activeFilters.push({ key: "country", label: "Country", value: filters.country });
  if (filters.salary_min != null)
    activeFilters.push({
      key: "salary_min",
      label: "Min $",
      value: `$${(filters.salary_min / 1000).toFixed(0)}K`,
    });
  if (filters.salary_max != null)
    activeFilters.push({
      key: "salary_max",
      label: "Max $",
      value: `$${(filters.salary_max / 1000).toFixed(0)}K`,
    });

  return (
    <div className="space-y-3">
      {/* Filter controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {/* Debounced search */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            id="filter-name"
            type="text"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search employees…"
            className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg w-52 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          {search && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        <FilterSelect
          id="filter-department"
          label="Department"
          value={filters.department ?? ""}
          onChange={(v) => set("department", v)}
          options={DEPARTMENTS}
        />
        <FilterSelect
          id="filter-status"
          label="Status"
          value={filters.employment_status ?? ""}
          onChange={(v) => set("employment_status", v)}
          options={STATUSES}
        />
        <FilterSelect
          id="filter-type"
          label="Type"
          value={filters.employment_type ?? ""}
          onChange={(v) => set("employment_type", v)}
          options={EMP_TYPES}
        />
        <FilterSelect
          id="filter-level"
          label="Level"
          value={filters.job_level ?? ""}
          onChange={(v) => set("job_level", v)}
          options={JOB_LEVELS}
        />
        <FilterSelect
          id="filter-band"
          label="Band"
          value={filters.salary_band ?? ""}
          onChange={(v) => set("salary_band", v)}
          options={BANDS}
        />

        {/* Country */}
        <div>
          <label htmlFor="filter-country" className="sr-only">
            Country
          </label>
          <input
            id="filter-country"
            type="text"
            value={filters.country ?? ""}
            onChange={(e) => set("country", e.target.value)}
            placeholder="Country"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Salary range */}
        <div className="flex items-center gap-1">
          <label htmlFor="filter-salary-min" className="sr-only">
            Min Salary
          </label>
          <input
            id="filter-salary-min"
            type="number"
            value={filters.salary_min ?? ""}
            onChange={(e) =>
              onChange({ salary_min: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Min $"
            min={0}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
          <span className="text-gray-300 text-xs">—</span>
          <label htmlFor="filter-salary-max" className="sr-only">
            Max Salary
          </label>
          <input
            id="filter-salary-max"
            type="number"
            value={filters.salary_max ?? ""}
            onChange={(e) =>
              onChange({ salary_max: e.target.value ? Number(e.target.value) : undefined })
            }
            placeholder="Max $"
            min={0}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg w-24 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {activeFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Clear all
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeFilters.map((f) => (
            <button
              key={f.key}
              onClick={() => {
                if (f.key === "name") setSearch("");
                onChange({ [f.key]: undefined } as Partial<EmployeeFilters>);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-100 transition-colors border border-blue-100"
            >
              <span className="text-blue-400 text-[10px] uppercase tracking-wide font-semibold">
                {f.label}
              </span>
              {f.value}
              <svg
                className="w-3 h-3 text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const active = !!value;
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-7 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer ${
          active
            ? "border-blue-300 text-blue-700 bg-blue-50 font-medium"
            : "border-gray-200 text-gray-500 bg-white"
        }`}
      >
        <option value="">{label}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
