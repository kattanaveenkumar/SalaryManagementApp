"use client";

import { useEffect, useRef, useState } from "react";
import type { Employee, EmployeeFormData, EmploymentStatus, EmploymentType } from "@/types";

interface Props {
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onClose: () => void;
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
const CURRENCIES = ["USD", "GBP", "EUR", "CAD", "AUD", "JPY", "INR", "BRL", "SGD", "AED"];
const COUNTRIES = [
  "United States",
  "United Kingdom",
  "Canada",
  "Germany",
  "France",
  "Japan",
  "India",
  "Brazil",
  "Australia",
  "Singapore",
  "Netherlands",
  "Sweden",
  "South Korea",
  "Mexico",
  "Italy",
  "Spain",
  "South Africa",
  "United Arab Emirates",
  "Poland",
  "Argentina",
];

function emptyForm(emp?: Employee | null): EmployeeFormData {
  if (!emp) {
    return {
      first_name: "",
      last_name: "",
      work_email: "",
      job_title: "",
      department: "",
      employment_status: "Active",
      employment_type: "Full-Time",
      job_level: "",
      country: "",
      salary: 0,
      currency: "USD",
      salary_band: "",
      hire_date: new Date().toISOString().split("T")[0],
    };
  }
  return {
    first_name: emp.first_name ?? "",
    last_name: emp.last_name ?? "",
    preferred_name: emp.preferred_name ?? "",
    work_email: emp.work_email ?? "",
    phone_number: emp.phone_number ?? "",
    job_title: emp.job_title,
    job_level: emp.job_level ?? "",
    department: emp.department ?? "",
    business_unit: emp.business_unit ?? "",
    employment_status: (emp.employment_status ?? "Active") as EmploymentStatus,
    employment_type: (emp.employment_type ?? "Full-Time") as EmploymentType,
    manager_name: emp.manager_name ?? "",
    work_location: emp.work_location ?? "",
    country: emp.country,
    salary: emp.salary,
    currency: emp.currency ?? "USD",
    salary_band: emp.salary_band ?? "",
    bonus_percentage: emp.bonus_percentage ?? undefined,
    hire_date: emp.hire_date ?? "",
    compensation_review_date: emp.compensation_review_date ?? "",
    notes: emp.notes ?? "",
  };
}

type Section = "identity" | "employment" | "compensation";

export default function EmployeeForm({ employee, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(() => emptyForm(employee));
  const [section, setSection] = useState<Section>("identity");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(emptyForm(employee));
    setError(null);
    setSection("identity");
  }, [employee]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const set = (key: keyof EmployeeFormData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validate = (): string | null => {
    if (!form.first_name?.trim() && !form.full_name?.trim()) return "First name is required";
    if (!form.last_name?.trim() && !form.full_name?.trim()) return "Last name is required";
    if (!form.job_title.trim()) return "Job title is required";
    if (!form.country.trim()) return "Country is required";
    if (!form.salary || form.salary < 20_000) return "Salary must be at least $20,000";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

  const SECTIONS: { id: Section; label: string; icon: string }[] = [
    { id: "identity", label: "Personal", icon: "👤" },
    { id: "employment", label: "Employment", icon: "🏢" },
    { id: "compensation", label: "Compensation", icon: "💰" },
  ];

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {employee ? "Edit Employee" : "Add Employee"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {employee
                ? `Updating ${employee.display_name || employee.full_name}`
                : "Fill in the employee details below"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Section tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {SECTIONS.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors mr-2 ${
                section === s.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              <span>{s.icon}</span> {s.label}
              <span className="ml-1 text-xs text-gray-300">{i + 1}/3</span>
            </button>
          ))}
        </div>

        {/* Form content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* ── Personal section ─────────────────────────── */}
            {section === "identity" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" required>
                  <input
                    id="form-first-name"
                    type="text"
                    value={form.first_name ?? ""}
                    onChange={(e) => set("first_name", e.target.value)}
                    placeholder="Jane"
                    className={inputCls}
                  />
                </Field>
                <Field label="Last Name" required>
                  <input
                    id="form-last-name"
                    type="text"
                    value={form.last_name ?? ""}
                    onChange={(e) => set("last_name", e.target.value)}
                    placeholder="Smith"
                    className={inputCls}
                  />
                </Field>
                <Field label="Preferred Name" hint="optional">
                  <input
                    id="form-preferred-name"
                    type="text"
                    value={form.preferred_name ?? ""}
                    onChange={(e) => set("preferred_name", e.target.value)}
                    placeholder="Jamie"
                    className={inputCls}
                  />
                </Field>
                <Field label="Work Email">
                  <input
                    id="form-work-email"
                    type="email"
                    value={form.work_email ?? ""}
                    onChange={(e) => set("work_email", e.target.value)}
                    placeholder="jane@company.com"
                    className={inputCls}
                  />
                </Field>
                <Field label="Phone" hint="optional">
                  <input
                    id="form-phone"
                    type="tel"
                    value={form.phone_number ?? ""}
                    onChange={(e) => set("phone_number", e.target.value)}
                    placeholder="+1 555 000 0000"
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {/* ── Employment section ───────────────────────── */}
            {section === "employment" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Job Title" required className="col-span-2">
                  <input
                    id="form-job-title"
                    type="text"
                    value={form.job_title}
                    onChange={(e) => set("job_title", e.target.value)}
                    placeholder="Senior Software Engineer"
                    className={inputCls}
                    required
                  />
                </Field>
                <Field label="Department">
                  <SelectField
                    id="form-department"
                    value={form.department ?? ""}
                    onChange={(v) => set("department", v)}
                    options={DEPARTMENTS}
                    placeholder="Select department"
                  />
                </Field>
                <Field label="Job Level">
                  <SelectField
                    id="form-level"
                    value={form.job_level ?? ""}
                    onChange={(v) => set("job_level", v)}
                    options={JOB_LEVELS}
                    placeholder="Select level"
                  />
                </Field>
                <Field label="Employment Status" required>
                  <SelectField
                    id="form-status"
                    value={form.employment_status ?? "Active"}
                    onChange={(v) => set("employment_status", v)}
                    options={STATUSES}
                    placeholder="Status"
                  />
                </Field>
                <Field label="Employment Type" required>
                  <SelectField
                    id="form-type"
                    value={form.employment_type ?? "Full-Time"}
                    onChange={(v) => set("employment_type", v)}
                    options={EMP_TYPES}
                    placeholder="Type"
                  />
                </Field>
                <Field label="Country" required>
                  <SelectField
                    id="form-country"
                    value={form.country}
                    onChange={(v) => set("country", v)}
                    options={COUNTRIES}
                    placeholder="Select country"
                  />
                </Field>
                <Field label="Work Location" hint="optional">
                  <input
                    id="form-location"
                    type="text"
                    value={form.work_location ?? ""}
                    onChange={(e) => set("work_location", e.target.value)}
                    placeholder="San Francisco, CA"
                    className={inputCls}
                  />
                </Field>
                <Field label="Manager Name" hint="optional">
                  <input
                    id="form-manager"
                    type="text"
                    value={form.manager_name ?? ""}
                    onChange={(e) => set("manager_name", e.target.value)}
                    placeholder="Alex Johnson"
                    className={inputCls}
                  />
                </Field>
                <Field label="Hire Date">
                  <input
                    id="form-hire-date"
                    type="date"
                    value={form.hire_date ?? ""}
                    onChange={(e) => set("hire_date", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {/* ── Compensation section ─────────────────────── */}
            {section === "compensation" && (
              <div className="grid grid-cols-2 gap-4">
                <Field label="Base Salary" required className="col-span-2">
                  <div className="flex gap-2">
                    <SelectField
                      id="form-currency"
                      value={form.currency ?? "USD"}
                      onChange={(v) => set("currency", v)}
                      options={CURRENCIES}
                      placeholder="USD"
                    />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none pointer-events-none">
                        $
                      </span>
                      <input
                        id="form-salary"
                        type="number"
                        value={form.salary || ""}
                        onChange={(e) => set("salary", Number(e.target.value))}
                        min={20000}
                        max={600000}
                        step={500}
                        placeholder="120,000"
                        required
                        className={`${inputCls} pl-7`}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Annual base salary · $20K–$600K range
                  </p>
                </Field>
                <Field label="Salary Band">
                  <SelectField
                    id="form-band"
                    value={form.salary_band ?? ""}
                    onChange={(v) => set("salary_band", v)}
                    options={BANDS}
                    placeholder="Select band"
                  />
                </Field>
                <Field label="Bonus Target %" hint="optional">
                  <div className="relative">
                    <input
                      id="form-bonus"
                      type="number"
                      value={form.bonus_percentage ?? ""}
                      onChange={(e) => set("bonus_percentage", Number(e.target.value))}
                      min={0}
                      max={100}
                      step={1}
                      placeholder="15"
                      className={`${inputCls} pr-7`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                      %
                    </span>
                  </div>
                </Field>
                <Field label="Compensation Review Date" hint="optional">
                  <input
                    id="form-review-date"
                    type="date"
                    value={form.compensation_review_date ?? ""}
                    onChange={(e) => set("compensation_review_date", e.target.value)}
                    className={inputCls}
                  />
                </Field>
                <Field label="Notes" hint="optional" className="col-span-2">
                  <textarea
                    id="form-notes"
                    value={form.notes ?? ""}
                    onChange={(e) => set("notes", e.target.value)}
                    rows={3}
                    placeholder="Any additional notes about this employee…"
                    className={`${inputCls} resize-none`}
                  />
                </Field>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-5 flex items-center justify-between border-t border-gray-50 pt-4">
            <div className="flex gap-2">
              {section !== "identity" && (
                <button
                  type="button"
                  onClick={() => setSection(section === "compensation" ? "employment" : "identity")}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {section !== "compensation" ? (
                <button
                  type="button"
                  onClick={() => setSection(section === "identity" ? "employment" : "compensation")}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {submitting && (
                    <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  )}
                  {submitting ? "Saving…" : employee ? "Save Changes" : "Add Employee"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

const inputCls =
  "w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors";

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="text-gray-400 font-normal ml-1.5 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function SelectField({
  id,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls} appearance-none pr-8 cursor-pointer`}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  );
}
