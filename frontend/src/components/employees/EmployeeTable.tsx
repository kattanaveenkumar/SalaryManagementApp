"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Employee, SortOrder } from "@/types";

interface Props {
  employees: Employee[];
  sortBy?: string;
  sortOrder?: SortOrder;
  onSort?: (column: string) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

const COLUMNS: {
  key: string;
  label: string;
  sortable: boolean;
  className?: string;
}[] = [
  { key: "employee_id", label: "ID", sortable: true, className: "w-32" },
  { key: "full_name", label: "Employee", sortable: true, className: "min-w-48" },
  { key: "department", label: "Department", sortable: true, className: "w-36" },
  { key: "job_title", label: "Role", sortable: true, className: "min-w-40" },
  { key: "employment_status", label: "Status", sortable: true, className: "w-28" },
  { key: "salary", label: "Salary", sortable: true, className: "w-32" },
  { key: "salary_band", label: "Band", sortable: true, className: "w-20" },
  { key: "hire_date", label: "Hire Date", sortable: true, className: "w-28" },
  { key: "actions", label: "", sortable: false, className: "w-12" },
];

export default function EmployeeTable({
  employees,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
  onDelete,
}: Props) {
  if (employees.length === 0) {
    return (
      <div className="py-20 text-center">
        <svg
          className="mx-auto h-12 w-12 mb-4 text-gray-200"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <p className="text-sm font-medium text-gray-500">No employees found</p>
        <p className="text-xs mt-1 text-gray-400">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/60">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${col.className ?? ""} ${col.sortable && onSort ? "cursor-pointer select-none hover:text-gray-600" : ""}`}
                onClick={() => col.sortable && onSort?.(col.key)}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && onSort && (
                    <SortIcon
                      active={sortBy === col.key}
                      order={sortBy === col.key ? sortOrder : undefined}
                    />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {employees.map((emp) => (
            <EmployeeRow key={emp.id} emp={emp} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EmployeeRow({
  emp,
  onEdit,
  onDelete,
}: {
  emp: Employee;
  onEdit: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const name = emp.display_name || emp.full_name;

  const openMenu = () => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setMenuOpen(true);
  };

  return (
    <tr className="hover:bg-blue-50/20 transition-colors">
      {/* Employee ID */}
      <td className="px-4 py-3">
        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
          {emp.employee_id ?? "—"}
        </span>
      </td>

      {/* Name + email */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar initials={emp.initials || "?"} name={emp.full_name} size="sm" />
          <div className="min-w-0">
            <p className="font-medium text-gray-900 truncate leading-tight">{name}</p>
            {emp.work_email && (
              <p className="text-xs text-gray-400 truncate leading-tight mt-0.5">
                {emp.work_email}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Department */}
      <td className="px-4 py-3">
        {emp.department ? (
          <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
            {emp.department}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Role + level */}
      <td className="px-4 py-3">
        <p className="text-gray-800 truncate leading-tight">{emp.job_title}</p>
        {emp.job_level && (
          <p className="text-xs text-gray-400 leading-tight mt-0.5">{emp.job_level}</p>
        )}
      </td>

      {/* Status */}
      <td className="px-4 py-3">
        {emp.employment_status ? (
          <StatusBadge status={emp.employment_status} compact />
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Salary */}
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-900 tabular-nums">
          {formatCurrency(emp.salary, emp.currency ?? "USD")}
        </p>
        {emp.employment_type && (
          <p className="text-xs text-gray-400 leading-tight mt-0.5">{emp.employment_type}</p>
        )}
      </td>

      {/* Band */}
      <td className="px-4 py-3">
        {emp.salary_band ? (
          <span className="text-xs font-medium text-violet-700 bg-violet-50 px-2 py-0.5 rounded-full">
            {emp.salary_band}
          </span>
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </td>

      {/* Hire date */}
      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
        {formatDate(emp.hire_date)}
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <button
          ref={btnRef}
          onClick={openMenu}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          aria-label="Employee actions"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        {menuOpen &&
          createPortal(
            <div
              className="fixed z-50 w-36 bg-white rounded-xl shadow-lg border border-gray-200 py-1"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setMenuOpen(false);
                  onEdit(emp);
                }}
              >
                <EditIcon /> Edit employee
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(emp);
                }}
              >
                <TrashIcon /> Remove
              </button>
            </div>,
            document.body,
          )}
      </td>
    </tr>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SortIcon({ active, order }: { active: boolean; order?: SortOrder }) {
  return (
    <span
      className={`inline-flex flex-col gap-px ml-0.5 ${active ? "text-blue-500" : "text-gray-300"}`}
    >
      <svg
        className={`w-2.5 h-2.5 ${active && order === "asc" ? "text-blue-600" : ""}`}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 0L10 6H0z" />
      </svg>
      <svg
        className={`w-2.5 h-2.5 ${active && order === "desc" ? "text-blue-600" : ""}`}
        viewBox="0 0 10 6"
        fill="currentColor"
      >
        <path d="M5 6L0 0H10z" />
      </svg>
    </span>
  );
}
function EditIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg
      className="w-3.5 h-3.5 flex-shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  );
}
