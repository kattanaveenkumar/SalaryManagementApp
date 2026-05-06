import { formatCurrency } from "@/lib/format";
import type { Employee } from "@/types";

interface Props {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export default function EmployeeTable({ employees, onEdit, onDelete }: Props) {
  if (employees.length === 0) {
    return (
      <div className="py-16 text-center text-gray-500 text-sm">
        No employees found. Try adjusting your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Name
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Job Title
            </th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">
              Country
            </th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">
              Salary
            </th>
            <th className="text-right px-4 py-3 font-medium text-gray-600">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => (
            <tr
              key={employee.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="px-4 py-3 font-medium text-gray-900">
                {employee.full_name}
              </td>
              <td className="px-4 py-3 text-gray-600">{employee.job_title}</td>
              <td className="px-4 py-3 text-gray-600">{employee.country}</td>
              <td className="px-4 py-3 text-right text-gray-900">
                {formatCurrency(employee.salary)}
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(employee)}
                  className="text-blue-600 hover:text-blue-800 mr-4 text-sm font-medium"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(employee)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
