import { formatCurrency } from "@/lib/format";
import type { SalaryPercentile } from "@/types";

interface Props {
  data: SalaryPercentile[];
}

export default function PercentileTable({ data }: Props) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-1">
        Salary Percentiles by Country
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Exact interpolated values via PostgreSQL PERCENTILE_CONT
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">
                Country
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                P25
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                Median (P50)
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                P75
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                P90
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={row.country}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="px-3 py-2.5 font-medium text-gray-900">
                  {row.country}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatCurrency(row.p25)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                  {formatCurrency(row.p50)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatCurrency(row.p75)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatCurrency(row.p90)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
