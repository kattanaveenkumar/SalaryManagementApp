"use client";

import { useState } from "react";
import type { EmployeeFilters } from "@/types";

interface Props {
  filters: EmployeeFilters;
  onChange: (partial: Partial<EmployeeFilters>) => void;
}

export default function EmployeeFilters({ filters, onChange }: Props) {
  const [country, setCountry] = useState(filters.country ?? "");
  const [jobTitle, setJobTitle] = useState(filters.job_title ?? "");

  const apply = () => {
    onChange({
      country: country.trim() || undefined,
      job_title: jobTitle.trim() || undefined,
    });
  };

  const clear = () => {
    setCountry("");
    setJobTitle("");
    onChange({ country: undefined, job_title: undefined });
  };

  const hasActiveFilters = !!(filters.country || filters.job_title);

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Country
        </label>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="e.g. United States"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Job Title
        </label>
        <input
          type="text"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="e.g. Software Engineer"
          className="border border-gray-300 rounded-md px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        onClick={apply}
        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
      >
        Apply
      </button>

      {hasActiveFilters && (
        <button
          onClick={clear}
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
        >
          Clear
        </button>
      )}
    </div>
  );
}
