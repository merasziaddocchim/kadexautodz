import { STATUS_FR } from "@/lib/documentLabels";
import { OrderStatus } from "@/lib/types";

const STEPS: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered"];

// Customer-facing progress. Cancelled orders get a distinct neutral state
// instead of a broken/half-filled timeline.
export default function StatusTimeline({ status }: { status: string }) {
  if (status === "cancelled") {
    return (
      <div className="rounded-lg border border-gray-300 bg-gray-50 p-4 text-center">
        <p className="text-sm font-semibold text-gray-700">Commande annulée</p>
        <p className="mt-1 text-xs text-gray-500">
          Cette commande a été annulée. Contactez-nous pour toute question.
        </p>
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as OrderStatus);

  return (
    <ol className="space-y-0">
      {STEPS.map((step, i) => {
        const done = currentIndex > i;
        const current = currentIndex === i;
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-emerald-600 text-white"
                    : current
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${
                    done ? "bg-emerald-600" : "bg-gray-200"
                  }`}
                  style={{ minHeight: "1.5rem" }}
                />
              )}
            </div>
            <div className={`pb-6 ${isLast ? "pb-0" : ""}`}>
              <p
                className={`text-sm ${
                  current
                    ? "font-bold text-blue-700"
                    : done
                    ? "font-medium text-gray-700"
                    : "text-gray-400"
                }`}
              >
                {STATUS_FR[step]}
              </p>
              {current && (
                <p className="text-xs text-gray-500">Étape en cours</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
