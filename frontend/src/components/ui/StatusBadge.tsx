"use client";

const STATUS_BADGE_CFG: Record<string, { dot: string; text: string; bg: string }> = {
  Active: { dot: "bg-emerald-400", text: "text-emerald-700", bg: "bg-emerald-50" },
  Probation: { dot: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  "On Leave": { dot: "bg-blue-400", text: "text-blue-700", bg: "bg-blue-50" },
  Resigned: { dot: "bg-slate-400", text: "text-slate-600", bg: "bg-slate-50" },
  Terminated: { dot: "bg-red-400", text: "text-red-700", bg: "bg-red-50" },
};

export function StatusBadge({ status, compact = false }: { status: string; compact?: boolean }) {
  const cfg = STATUS_BADGE_CFG[status] ?? {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      } rounded-full text-xs font-medium ${cfg.bg} ${cfg.text} whitespace-nowrap`}
    >
      <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {status}
    </span>
  );
}
