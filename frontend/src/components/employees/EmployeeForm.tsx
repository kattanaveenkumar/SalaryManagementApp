"use client";

import { useEffect, useState } from "react";
import type { Employee, EmployeeFormData } from "@/types";

interface Props {
  employee?: Employee | null;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onClose: () => void;
}

const EMPTY: EmployeeFormData = {
  full_name: "",
  job_title: "",
  country: "",
  salary: 0,
};

export default function EmployeeForm({ employee, onSubmit, onClose }: Props) {
  const [form, setForm] = useState<EmployeeFormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(
      employee
        ? {
            full_name: employee.full_name,
            job_title: employee.job_title,
            country: employee.country,
            salary: employee.salary,
          }
        : EMPTY,
    );
    setError(null);
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "salary" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">
          {employee ? "Edit Employee" : "Add Employee"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {(
            [
              { name: "full_name", label: "Full Name", placeholder: "Jane Smith" },
              { name: "job_title", label: "Job Title", placeholder: "Software Engineer" },
              { name: "country", label: "Country", placeholder: "United States" },
            ] as const
          ).map(({ name, label, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="text"
                name={name}
                value={form[name]}
                onChange={handleChange}
                required
                placeholder={placeholder}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Salary (USD / year)
            </label>
            <input
              type="number"
              name="salary"
              value={form.salary || ""}
              onChange={handleChange}
              required
              min={20000}
              max={500000}
              step={100}
              placeholder="75000"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? "Saving…" : employee ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
