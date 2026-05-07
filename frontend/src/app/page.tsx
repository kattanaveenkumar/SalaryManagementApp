"use client";

import { useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import ConfirmDeleteModal from "@/components/employees/ConfirmDeleteModal";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
import EmployeeForm from "@/components/employees/EmployeeForm";
import EmployeeTable from "@/components/employees/EmployeeTable";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Pagination from "@/components/ui/Pagination";
import { useToast } from "@/components/ui/Toast";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee, EmployeeFormData } from "@/types";

export default function EmployeesPage() {
  return (
    <AuthGuard>
      <EmployeesContent />
    </AuthGuard>
  );
}

function EmployeesContent() {
  const {
    employees,
    meta,
    loading,
    error,
    filters,
    applyFilters,
    setPage,
    toggleSort,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees();
  const { addToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);

  const openCreate = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const openEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  const handleSubmit = async (data: EmployeeFormData) => {
    if (editingEmployee) {
      await updateEmployee(editingEmployee.id, data);
      addToast("Employee updated successfully");
    } else {
      await createEmployee(data);
      addToast("Employee added successfully");
    }
    closeForm();
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    await deleteEmployee(deletingEmployee.id);
    addToast(`${deletingEmployee.full_name} has been removed`, "info");
    setDeletingEmployee(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          {meta && (
            <p className="text-sm text-gray-500 mt-0.5">
              {meta.total_count.toLocaleString()} total
            </p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Employee
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <EmployeeFilters filters={filters} onChange={applyFilters} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {error ? (
          <div className="p-6">
            <ErrorBanner message={error} />
          </div>
        ) : loading ? (
          <TableSkeleton />
        ) : (
          <>
            <EmployeeTable
              employees={employees}
              sortBy={filters.sort_by}
              sortOrder={filters.sort_order}
              onSort={toggleSort}
              onEdit={openEdit}
              onDelete={setDeletingEmployee}
            />
            {meta && (
              <div className="px-4 border-t border-gray-100">
                <Pagination meta={meta} onPageChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {showForm && (
        <EmployeeForm employee={editingEmployee} onSubmit={handleSubmit} onClose={closeForm} />
      )}

      {deletingEmployee && (
        <ConfirmDeleteModal
          employee={deletingEmployee}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingEmployee(null)}
        />
      )}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3 animate-pulse" aria-label="Loading employees">
      <div className="h-8 bg-gray-100 rounded-lg w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-10 bg-gray-50 rounded-lg w-full" />
      ))}
    </div>
  );
}
