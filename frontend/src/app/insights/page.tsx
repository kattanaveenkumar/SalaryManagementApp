"use client";

import CountrySalaryTable from "@/components/insights/CountrySalaryTable";
import JobTitleInsights from "@/components/insights/JobTitleInsights";
import PercentileTable from "@/components/insights/PercentileTable";
import TopEarners from "@/components/insights/TopEarners";
import ErrorBanner from "@/components/ui/ErrorBanner";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useInsights } from "@/hooks/useInsights";

export default function InsightsPage() {
  const {
    countrySalaries,
    jobTitleSalaries,
    percentiles,
    topEarners,
    loading,
    error,
  } = useInsights();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Salary Insights
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <CountrySalaryTable data={countrySalaries} />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <TopEarners data={topEarners} />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <JobTitleInsights data={jobTitleSalaries} />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <PercentileTable data={percentiles} />
      </div>
    </div>
  );
}
