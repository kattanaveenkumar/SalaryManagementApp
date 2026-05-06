import type { PaginationMeta } from "@/types";

interface Props {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function Pagination({ meta, onPageChange }: Props) {
  const { current_page, total_pages, total_count, per_page } = meta;
  const start = (current_page - 1) * per_page + 1;
  const end = Math.min(current_page * per_page, total_count);

  return (
    <div className="flex items-center justify-between py-4">
      <span className="text-sm text-gray-600">
        Showing {start.toLocaleString()}–{end.toLocaleString()} of{" "}
        {total_count.toLocaleString()} employees
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(current_page - 1)}
          disabled={current_page <= 1}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-gray-700 px-2">
          Page {current_page} of {total_pages}
        </span>
        <button
          onClick={() => onPageChange(current_page + 1)}
          disabled={current_page >= total_pages}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
