import { cardCls } from "@/components/ui";

export default function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "green" | "red" | "blue";
}) {
  const accentCls =
    accent === "green"
      ? "text-emerald-700"
      : accent === "red"
      ? "text-red-600"
      : accent === "blue"
      ? "text-blue-700"
      : "text-gray-900";
  return (
    <div className={`${cardCls} p-4`}>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold ${accentCls}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}
