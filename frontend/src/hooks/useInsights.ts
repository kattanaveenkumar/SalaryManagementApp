"use client";

import { useEffect, useState } from "react";
import { insightsApi } from "@/services/api";
import type {
  CountrySalary,
  JobTitleSalary,
  SalaryPercentile,
  TopEarner,
} from "@/types";

export function useInsights() {
  const [countrySalaries, setCountrySalaries] = useState<CountrySalary[]>([]);
  const [jobTitleSalaries, setJobTitleSalaries] = useState<JobTitleSalary[]>(
    [],
  );
  const [percentiles, setPercentiles] = useState<SalaryPercentile[]>([]);
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      insightsApi.countrySalaries(),
      insightsApi.jobTitleSalaries(),
      insightsApi.salaryPercentiles(),
      insightsApi.topEarners(),
    ])
      .then(([cs, jts, sp, te]) => {
        if (!cancelled) {
          setCountrySalaries(cs.data);
          setJobTitleSalaries(jts.data);
          setPercentiles(sp.data);
          setTopEarners(te.data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load insights",
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { countrySalaries, jobTitleSalaries, percentiles, topEarners, loading, error };
}
