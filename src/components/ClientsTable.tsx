"use client";

import Link from "next/link";
import { useState } from "react";
import { cardCls, inputCls, tdCls, thCls } from "@/components/ui";
import { formatDZD } from "@/lib/format";

export interface ClientRow {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  ordersCount: number;
  totalSpent: number;
}

export default function ClientsTable({ rows }: { rows: ClientRow[] }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.code, r.name, r.phone, r.email, r.city]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : rows;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search name, code, phone, city…"
          className={`${inputCls} max-w-xs`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-xs text-gray-400">
          {filtered.length} of {rows.length}
        </span>
      </div>
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full min-w-[700px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={thCls}>Code</th>
              <th className={thCls}>Name</th>
              <th className={thCls}>Phone</th>
              <th className={thCls}>City</th>
              <th className={`${thCls} text-right`}>Orders</th>
              <th className={`${thCls} text-right`}>Total spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-blue-50/40">
                <td className={tdCls}>
                  <Link
                    href={`/clients/${r.id}/edit`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {r.code}
                  </Link>
                </td>
                <td className={tdCls}>{r.name}</td>
                <td className={tdCls}>{r.phone || "—"}</td>
                <td className={tdCls}>{r.city || "—"}</td>
                <td className={`${tdCls} text-right`}>{r.ordersCount}</td>
                <td className={`${tdCls} text-right`}>
                  {formatDZD(r.totalSpent)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className={`${tdCls} text-gray-400`} colSpan={6}>
                  No clients match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
