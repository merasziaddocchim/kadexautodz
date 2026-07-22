import {
  Availability,
  CarLocation,
  LOCATION_LABELS,
  OrderStatus,
} from "@/lib/types";

const pill = "inline-flex rounded-full px-2 py-0.5 text-xs font-medium";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-200 text-gray-600",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <span className={`${pill} ${STATUS_STYLES[status]}`}>{status}</span>;
}

const LOCATION_STYLES: Record<CarLocation, string> = {
  china_warehouse: "bg-slate-100 text-slate-700",
  in_transit: "bg-sky-100 text-sky-800",
  algeria_arrived: "bg-emerald-100 text-emerald-800",
};

export function LocationBadge({ location }: { location: CarLocation }) {
  return (
    <span className={`${pill} ${LOCATION_STYLES[location]}`}>
      {LOCATION_LABELS[location]}
    </span>
  );
}

const AVAILABILITY_STYLES: Record<Availability, string> = {
  available: "bg-emerald-100 text-emerald-800",
  reserved: "bg-amber-100 text-amber-800",
  sold: "bg-gray-200 text-gray-600",
};

export function AvailabilityBadge({
  availability,
}: {
  availability: Availability;
}) {
  return (
    <span className={`${pill} ${AVAILABILITY_STYLES[availability]}`}>
      {availability}
    </span>
  );
}
