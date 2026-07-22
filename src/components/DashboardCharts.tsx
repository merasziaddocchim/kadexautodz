"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cardCls, inputCls } from "@/components/ui";
import { formatDZD } from "@/lib/format";
import { ORDER_STATUSES, OrderStatus } from "@/lib/types";

// One row per non-cancelled order, pre-projected on the server.
export interface MonthlyPoint {
  year: number;
  month: number; // 0-11
  total: number;
}

export interface StatusSlice {
  status: OrderStatus;
  count: number;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#d97706",
  confirmed: "#2563eb",
  shipped: "#7c3aed",
  delivered: "#059669",
  cancelled: "#9ca3af",
};

function compactDZD(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

export default function DashboardCharts({
  monthly,
  years,
  defaultYear,
  statusData,
}: {
  monthly: MonthlyPoint[];
  years: number[];
  defaultYear: number;
  statusData: StatusSlice[];
}) {
  const [year, setYear] = useState(defaultYear);

  const { ordersSeries, revenueSeries } = useMemo(() => {
    const orders = MONTHS.map((m) => ({ month: m, count: 0 }));
    const revenue = MONTHS.map((m) => ({ month: m, revenue: 0 }));
    for (const p of monthly) {
      if (p.year !== year) continue;
      orders[p.month].count += 1;
      revenue[p.month].revenue += p.total;
    }
    return { ordersSeries: orders, revenueSeries: revenue };
  }, [monthly, year]);

  const pieData = ORDER_STATUSES.map((s) => ({
    status: s,
    count: statusData.find((d) => d.status === s)?.count ?? 0,
  })).filter((d) => d.count > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="year" className="text-sm text-gray-500">
          Chart year
        </label>
        <select
          id="year"
          className={`${inputCls} w-auto`}
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${cardCls} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Orders per month — {year}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ordersSeries}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} />
              <YAxis allowDecimals={false} fontSize={12} width={28} />
              <Tooltip
                formatter={(value) => [Number(value), "Orders"] as [number, string]}
                cursor={{ fill: "rgba(37,99,235,0.06)" }}
              />
              <Bar dataKey="count" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${cardCls} p-4`}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Revenue per month — {year}
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={revenueSeries}>
              <XAxis dataKey="month" fontSize={12} tickLine={false} />
              <YAxis
                tickFormatter={compactDZD}
                fontSize={12}
                width={44}
              />
              <Tooltip
                formatter={(value) =>
                  [formatDZD(Number(value)), "Revenue"] as [string, string]
                }
                cursor={{ fill: "rgba(5,150,105,0.06)" }}
              />
              <Bar dataKey="revenue" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={`${cardCls} p-4 lg:col-span-2`}>
          <h3 className="mb-3 text-sm font-semibold text-gray-700">
            Orders by status — all time
          </h3>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={(entry) =>
                    `${(entry as unknown as StatusSlice).status}: ${
                      (entry as unknown as StatusSlice).count
                    }`
                  }
                >
                  {pieData.map((d) => (
                    <Cell key={d.status} fill={STATUS_COLORS[d.status]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
