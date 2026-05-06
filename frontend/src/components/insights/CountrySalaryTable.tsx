import { formatCurrency } from "@/lib/format";
import type { CountrySalary } from "@/types";

interface Props {
  data: CountrySalary[];
}

export default function CountrySalaryTable({ data }: Props) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        Salary by Country
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-3 py-2.5 font-medium text-gray-600">
                Country
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                Employees
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                Min
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                Avg
              </th>
              <th className="text-right px-3 py-2.5 font-medium text-gray-600">
                Max
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
                  {row.employee_count.toLocaleString()}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatCurrency(row.min_salary)}
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                  {formatCurrency(row.avg_salary)}
                </td>
                <td className="px-3 py-2.5 text-right text-gray-600">
                  {formatCurrency(row.max_salary)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
