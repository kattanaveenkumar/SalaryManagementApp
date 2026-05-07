"use client";

import { useEffect, useState } from "react";
import { insightsApi } from "@/services/api";
import type { CompanyKPIs, TopEarner } from "@/types";

export function useInsights() {
  const [kpis, setKpis] = useState<CompanyKPIs | null>(null);
  const [topEarners, setTopEarners] = useState<TopEarner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([insightsApi.companyKpis(), insightsApi.topEarners(10)])
      .then(([kpisRes, te]) => {
        if (!cancelled) {
          setKpis(kpisRes.data);
          setTopEarners(te.data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load insights");
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { kpis, topEarners, loading, error };
}
