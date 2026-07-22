"use client";

import Link from "next/link";
import { useState } from "react";
import { AvailabilityBadge, LocationBadge } from "@/components/badges";
import { cardCls, inputCls, tdCls, thCls } from "@/components/ui";
import { formatDZD } from "@/lib/format";
import { Availability, CarLocation, LOCATION_LABELS } from "@/lib/types";

export interface CarRow {
  id: string;
  code: string;
  car: string;
  color: string;
  year: number;
  vin: string;
  location: CarLocation;
  availability: Availability;
  wholesale: number;
  fees: number;
  landed: number;
  list: number;
  margin: number;
}

export default function CarsTable({ rows }: { rows: CarRow[] }) {
  const [search, setSearch] = useState("");

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.code, r.car, r.color, r.vin, LOCATION_LABELS[r.location], r.availability]
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
          placeholder="Search code, brand, model, color…"
          className={`${inputCls} max-w-xs`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="text-xs text-gray-400">
          {filtered.length} of {rows.length}
        </span>
      </div>
      <div className={`${cardCls} overflow-x-auto`}>
        <table className="w-full min-w-[1000px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className={thCls}>Code</th>
              <th className={thCls}>Car</th>
              <th className={thCls}>Color</th>
              <th className={thCls}>Year</th>
              <th className={thCls}>Location</th>
              <th className={thCls}>Availability</th>
              <th className={`${thCls} text-right`}>Wholesale</th>
              <th className={`${thCls} text-right`}>Import fees</th>
              <th className={`${thCls} text-right`}>Landed cost</th>
              <th className={`${thCls} text-right`}>List price</th>
              <th className={`${thCls} text-right`}>Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-blue-50/40">
                <td className={tdCls}>
                  <Link
                    href={`/inventory/${r.id}/edit`}
                    className="font-medium text-blue-700 hover:underline"
                  >
                    {r.code}
                  </Link>
                </td>
                <td className={tdCls}>{r.car}</td>
                <td className={tdCls}>{r.color}</td>
                <td className={tdCls}>{r.year}</td>
                <td className={tdCls}>
                  <LocationBadge location={r.location} />
                </td>
                <td className={tdCls}>
                  <AvailabilityBadge availability={r.availability} />
                </td>
                <td className={`${tdCls} text-right`}>
                  {formatDZD(r.wholesale)}
                </td>
                <td className={`${tdCls} text-right`}>{formatDZD(r.fees)}</td>
                <td className={`${tdCls} text-right`}>{formatDZD(r.landed)}</td>
                <td className={`${tdCls} text-right`}>{formatDZD(r.list)}</td>
                <td
                  className={`${tdCls} text-right font-medium ${
                    r.margin < 0 ? "text-red-600" : "text-emerald-700"
                  }`}
                >
                  {formatDZD(r.margin)}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className={`${tdCls} text-gray-400`} colSpan={11}>
                  No cars match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
