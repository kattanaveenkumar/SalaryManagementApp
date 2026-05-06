import type { Employee } from "@/types";

interface Props {
  employee: Employee;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  employee,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Delete Employee
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Are you sure you want to delete{" "}
          <strong>{employee.full_name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 text-white py-2 rounded-md text-sm font-medium hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-md text-sm font-medium hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
