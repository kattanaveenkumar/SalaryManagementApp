import { formatCurrency } from "@/lib/format";
import type { TopEarner } from "@/types";

interface Props {
  data: TopEarner[];
}

export default function TopEarners({ data }: Props) {
  return (
    <div>
      <h2 className="text-base font-semibold text-gray-900 mb-4">Top 10 Earners</h2>
      <div className="space-y-2">
        {data.map((employee, index) => (
          <div
            key={employee.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-400 w-6 shrink-0">#{index + 1}</span>
              <div>
                <p className="text-sm font-medium text-gray-900">{employee.full_name}</p>
                <p className="text-xs text-gray-500">
                  {employee.job_title} · {employee.country}
                </p>
              </div>
            </div>
            <span className="text-sm font-semibold text-emerald-700 shrink-0">
              {formatCurrency(employee.salary)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
