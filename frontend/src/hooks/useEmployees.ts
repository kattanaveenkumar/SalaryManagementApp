"use client";

import { useCallback, useEffect, useState } from "react";
import { employeeApi } from "@/services/api";
import type { Employee, EmployeeFilters, EmployeeFormData, PaginationMeta } from "@/types";

export function useEmployees() {
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    per_page: 25,
    sort_by: "id",
    sort_order: "asc",
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    employeeApi
      .list(filters)
      .then((result) => {
        if (!cancelled) {
          setEmployees(result.data);
          setMeta(result.meta);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load employees");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const applyFilters = useCallback((partial: Partial<EmployeeFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const toggleSort = useCallback((column: string) => {
    setFilters((prev) => ({
      ...prev,
      sort_by: column,
      sort_order: prev.sort_by === column && prev.sort_order === "asc" ? "desc" : "asc",
      page: 1,
    }));
  }, []);

  const createEmployee = useCallback(async (data: EmployeeFormData) => {
    await employeeApi.create(data);
    setFilters((prev) => ({ ...prev }));
  }, []);

  const updateEmployee = useCallback(async (id: number, data: Partial<EmployeeFormData>) => {
    await employeeApi.update(id, data);
    setFilters((prev) => ({ ...prev }));
  }, []);

  const deleteEmployee = useCallback(async (id: number) => {
    await employeeApi.delete(id);
    setFilters((prev) => ({ ...prev }));
  }, []);

  return {
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
  };
}
