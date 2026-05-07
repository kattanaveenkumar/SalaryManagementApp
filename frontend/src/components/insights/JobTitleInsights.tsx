"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import type { JobTitleSalary } from "@/types";

interface Props {
  data: JobTitleSalary[];
}

export default function JobTitleInsights({ data }: Props) {
  const [countryFilter, setCountryFilter] = useState("");

  const filtered = countryFilter
    ? data.filter((r) => r.country.toLowerCase().includes(countryFilter.toLowerCase()))
    : data;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Avg Salary by Job Title</h2>
        <input
          type="text"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
          placeholder="Filter by country…"
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0">
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Job Title</th>
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">Country</th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">Employees</th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">Avg Salary</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr
                key={`${row.job_title}-${row.country}-${i}`}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-3 py-2.5 text-gray-900">{row.job_title}</td>
                <td className="px-3 py-2.5 text-gray-600">{row.country}</td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {row.employee_count.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                  {formatCurrency(row.avg_salary)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
