"use client";

import type { ReactNode } from "react";
import AuthGuard from "@/components/AuthGuard";
import ErrorBanner from "@/components/ui/ErrorBanner";
import { Avatar } from "@/components/ui/Avatar";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useInsights } from "@/hooks/useInsights";
import { formatCompact, formatCurrency, formatNumber } from "@/lib/format";
import type { DeptAvgSalary, TopEarner } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function InsightsPage() {
  return (
    <AuthGuard>
      <InsightsContent />
    </AuthGuard>
  );
}

// ── Color palette ─────────────────────────────────────────────────────────────

const DEPT_COLORS = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
];

const STATUS_COLORS: Record<string, string> = {
  Active: "#22c55e",
  Probation: "#f59e0b",
  "On Leave": "#3b82f6",
  Resigned: "#94a3b8",
  Terminated: "#ef4444",
};

const TYPE_COLORS: Record<string, string> = {
  "Full-Time": "#3b82f6",
  Contractor: "#8b5cf6",
  "Part-Time": "#f59e0b",
  Intern: "#14b8a6",
};

// ── Main content ──────────────────────────────────────────────────────────────

function InsightsContent() {
  const { kpis, topEarners, loading, error } = useInsights();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Compensation Analytics</h1>
        <p className="text-sm text-gray-500 mt-0.5">Executive overview · Live from database</p>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          loading={loading}
          label="Active Headcount"
          value={kpis ? formatNumber(kpis.active_headcount) : "—"}
          sub={kpis ? `${formatNumber(kpis.total_headcount)} total employees` : undefined}
          icon={<HeadcountIcon />}
          accent="blue"
        />
        <KPICard
          loading={loading}
          label="Total Annual Payroll"
          value={kpis ? formatCompact(kpis.total_payroll) : "—"}
          sub="Active employees only"
          icon={<PayrollIcon />}
          accent="violet"
        />
        <KPICard
          loading={loading}
          label="Median Compensation"
          value={kpis ? formatCurrency(kpis.median_salary) : "—"}
          sub={kpis ? `Avg ${formatCurrency(kpis.avg_salary)}` : undefined}
          icon={<MedianIcon />}
          accent="emerald"
        />
        <KPICard
          loading={loading}
          label="Reviews Due (90 days)"
          value={kpis ? formatNumber(kpis.reviews_due_90d) : "—"}
          sub={kpis ? `${kpis.on_probation} on probation · ${kpis.on_leave} on leave` : undefined}
          icon={<ReviewIcon />}
          accent="amber"
        />
      </div>

      {/* Row 1: dept comp + status donut */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <DashCard
            loading={loading}
            title="Avg Compensation by Department"
            subtitle="Active employees only"
          >
            {kpis && <DeptCompChart data={kpis.dept_avg_salary} />}
          </DashCard>
        </div>
        <DashCard loading={loading} title="Workforce by Status" subtitle="All employees">
          {kpis && <StatusPieChart data={kpis.status_breakdown} />}
        </DashCard>
      </div>

      {/* Row 2: headcount by dept + type mix */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DashCard loading={loading} title="Headcount by Department" subtitle="All employees">
          {kpis && <DeptHeadcountChart data={kpis.dept_breakdown} />}
        </DashCard>
        <DashCard loading={loading} title="Employment Type Mix" subtitle="All employees">
          {kpis && <TypeBarChart data={kpis.type_breakdown} />}
        </DashCard>
      </div>

      {/* Top earners */}
      <DashCard loading={loading} title="Top 10 Earners" subtitle="Ranked by base salary">
        {topEarners.length > 0 && <TopEarnersList data={topEarners} />}
      </DashCard>
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

const ACCENT_MAP = {
  blue: { bg: "bg-blue-50", icon: "text-blue-600", ring: "ring-blue-100" },
  violet: { bg: "bg-violet-50", icon: "text-violet-600", ring: "ring-violet-100" },
  emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", ring: "ring-emerald-100" },
  amber: { bg: "bg-amber-50", icon: "text-amber-600", ring: "ring-amber-100" },
};

function KPICard({
  loading,
  label,
  value,
  sub,
  icon,
  accent,
}: {
  loading: boolean;
  label: string;
  value: string;
  sub?: string;
  icon: ReactNode;
  accent: keyof typeof ACCENT_MAP;
}) {
  const a = ACCENT_MAP[accent];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      {loading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-9 w-9 rounded-lg bg-gray-100" />
          <div className="h-7 w-20 bg-gray-100 rounded" />
          <div className="h-3 w-32 bg-gray-50 rounded" />
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div
            className={`flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl ${a.bg} ring-1 ${a.ring}`}
          >
            <span className={a.icon}>{icon}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold text-gray-900 leading-none tabular-nums">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1.5 leading-snug">{sub}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Dashboard card ────────────────────────────────────────────────────────────

function DashCard({
  loading,
  title,
  subtitle,
  children,
}: {
  loading: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-3 border-b border-gray-50">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="p-6">
        {loading ? (
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-5 bg-gray-50 rounded"
                style={{ width: `${60 + (i % 4) * 10}%` }}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

// ── Charts ────────────────────────────────────────────────────────────────────

function DeptCompChart({ data }: { data: DeptAvgSalary[] }) {
  const sorted = [...data].sort((a, b) => b.avg_salary - a.avg_salary);
  return (
    <ResponsiveContainer width="100%" height={270}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 0, right: 20, bottom: 0, left: 136 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
        <XAxis
          type="number"
          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="department"
          tick={{ fontSize: 11, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
          width={132}
        />
        <Tooltip
          formatter={(v: number) => [formatCurrency(v), "Avg Salary"]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,.06)",
          }}
        />
        <Bar dataKey="avg_salary" radius={[0, 4, 4, 0]} maxBarSize={24}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function StatusPieChart({ data }: { data: { status: string; count: number }[] }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <div className="flex flex-col items-center gap-5">
      <ResponsiveContainer width="100%" height={190}>
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={54}
            outerRadius={84}
            paddingAngle={2}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={STATUS_COLORS[d.status] ?? DEPT_COLORS[i % DEPT_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [
              `${formatNumber(v)} (${total > 0 ? ((v / total) * 100).toFixed(1) : 0}%)`,
              "",
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 w-full">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-1.5 text-xs text-gray-600">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: STATUS_COLORS[d.status] ?? "#94a3b8" }}
            />
            {d.status}
            <span className="text-gray-400">({formatNumber(d.count)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptHeadcountChart({ data }: { data: { department: string; headcount: number }[] }) {
  const sorted = [...data].sort((a, b) => b.headcount - a.headcount);
  return (
    <ResponsiveContainer width="100%" height={230}>
      <BarChart data={sorted} margin={{ top: 4, right: 4, bottom: 50, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
        <XAxis
          dataKey="department"
          tick={{ fontSize: 10, fill: "#374151" }}
          axisLine={false}
          tickLine={false}
          angle={-40}
          textAnchor="end"
          interval={0}
        />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip
          formatter={(v: number) => [formatNumber(v), "Headcount"]}
          contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
        />
        <Bar dataKey="headcount" radius={[4, 4, 0, 0]} maxBarSize={38}>
          {sorted.map((_, i) => (
            <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function TypeBarChart({ data }: { data: { type: string; count: number }[] }) {
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const total = sorted.reduce((s, d) => s + d.count, 0);
  return (
    <div className="space-y-4">
      {sorted.map((d) => {
        const pct = total > 0 ? (d.count / total) * 100 : 0;
        return (
          <div key={d.type}>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="font-medium text-gray-700">{d.type}</span>
              <span className="text-gray-400 tabular-nums">
                {formatNumber(d.count)} · {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: TYPE_COLORS[d.type] ?? "#94a3b8",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Top earners ───────────────────────────────────────────────────────────────

function TopEarnersList({ data }: { data: TopEarner[] }) {
  return (
    <div className="divide-y divide-gray-50">
      {data.map((e, i) => (
        <div key={e.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
          <span className="text-xs font-bold text-gray-300 w-7 text-right tabular-nums flex-shrink-0">
            #{i + 1}
          </span>
          <Avatar initials={e.initials || "?"} name={e.full_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {e.display_name || e.full_name}
            </p>
            <p className="text-xs text-gray-400 truncate">
              {e.job_title}
              {e.department ? ` · ${e.department}` : ""}
            </p>
          </div>
          {e.employment_status && <StatusBadge status={e.employment_status} compact />}
          <div className="text-right flex-shrink-0">
            <p className="text-sm font-semibold text-gray-900 tabular-nums">
              {formatCurrency(e.salary, e.currency ?? "USD")}
            </p>
            {e.job_level && <p className="text-xs text-gray-400">{e.job_level}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function HeadcountIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}
function PayrollIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
function MedianIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}
function ReviewIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}
