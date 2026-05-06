"use client";

import { useState } from "react";
import ConfirmDeleteModal from "@/components/employees/ConfirmDeleteModal";
import EmployeeFilters from "@/components/employees/EmployeeFilters";
import EmployeeForm from "@/components/employees/EmployeeForm";
import EmployeeTable from "@/components/employees/EmployeeTable";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Pagination from "@/components/ui/Pagination";
import { useEmployees } from "@/hooks/useEmployees";
import type { Employee, EmployeeFormData } from "@/types";

export default function EmployeesPage() {
  const {
    employees,
    meta,
    loading,
    error,
    filters,
    applyFilters,
    setPage,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  } = useEmployees();

  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null,
  );

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
    } else {
      await createEmployee(data);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmployee) return;
    await deleteEmployee(deletingEmployee.id);
    setDeletingEmployee(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Add Employee
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <EmployeeFilters filters={filters} onChange={applyFilters} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <div className="p-4">
            <ErrorBanner message={error} />
          </div>
        ) : (
          <>
            <EmployeeTable
              employees={employees}
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
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
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
