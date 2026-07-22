"use client";

import Link from "next/link";
import { useState } from "react";
import { StatusBadge } from "@/components/badges";
import { cardCls, inputCls, tdCls, thCls } from "@/components/ui";
import { formatDate, formatDZD } from "@/lib/format";
import { ORDER_STATUSES, OrderStatus } from "@/lib/types";

export interface OrderRow {
  id: string;
  code: string;
  client: string;
  car: string;
  date: string;
  status: OrderStatus;
  tracking: string;
  total: number;
  paid: number;
  balance: number;
}

export default function OrdersTable({ rows }: { rows: OrderRow[] }) {
  const [status, setStatus] = useState<"all" | OrderStatus>("all");
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = rows.filter((r) => {
    if (status !== "all" && r.status !== status) return false;
    if (!q) return true;
    return [r.code, r.client, r.car, r.tracking]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search code, client, car, tracking…"
          className={`${inputCls} max-w-xs`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${inputCls} w-auto`}
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | OrderStatus)}
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-xs text-gray-400">
          {filtered.length} of {rows.length}
        </span>
      </div>
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full min-w-[900px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={thCls}>Code</th>
              <th className={thCls}>Client</th>
              <th className={thCls}>Car</th>
              <th className={thCls}>Date</th>
              <th className={thCls}>Status</th>
              <th className={thCls}>Tracking</th>
              <th className={`${thCls} text-right`}>Total</th>
              <th className={`${thCls} text-right`}>Paid</th>
              <th className={`${thCls} text-right`}>Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-blue-50/40">
                <td className={tdCls}>
                  <Link
                    href={`/orders/${r.id}`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {r.code}
                  </Link>
                </td>
                <td className={tdCls}>{r.client}</td>
                <td className={tdCls}>{r.car}</td>
                <td className={tdCls}>{formatDate(r.date)}</td>
                <td className={tdCls}>
                  <StatusBadge status={r.status} />
                </td>
                <td className={`${tdCls} text-gray-500`}>{r.tracking || "—"}</td>
                <td className={`${tdCls} text-right`}>{formatDZD(r.total)}</td>
                <td className={`${tdCls} text-right`}>{formatDZD(r.paid)}</td>
                <td
                  className={`${tdCls} text-right font-medium ${
                    r.balance > 0 ? "text-red-600" : "text-emerald-600"
                  }`}
                >
                  {formatDZD(r.balance)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className={`${tdCls} text-gray-400`} colSpan={9}>
                  No orders match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
