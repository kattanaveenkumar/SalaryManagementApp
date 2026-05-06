"use client";

import { useCallback, useEffect, useState } from "react";
import { employeeApi } from "@/services/api";
import type {
  Employee,
  EmployeeFilters,
  EmployeeFormData,
  PaginationMeta,
} from "@/types";

export function useEmployees() {
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    per_page: 25,
  });
  const [refreshKey, setRefreshKey] = useState(0);
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
          setError(
            err instanceof Error ? err.message : "Failed to load employees",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [filters, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const applyFilters = useCallback((partial: Partial<EmployeeFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  const createEmployee = useCallback(
    async (data: EmployeeFormData) => {
      await employeeApi.create(data);
      refresh();
    },
    [refresh],
  );

  const updateEmployee = useCallback(
    async (id: number, data: Partial<EmployeeFormData>) => {
      await employeeApi.update(id, data);
      refresh();
    },
    [refresh],
  );

  const deleteEmployee = useCallback(
    async (id: number) => {
      await employeeApi.delete(id);
      refresh();
    },
    [refresh],
  );

  return {
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
  };
}
