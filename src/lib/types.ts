export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const CAR_LOCATIONS = [
  "china_warehouse",
  "in_transit",
  "algeria_arrived",
] as const;
export type CarLocation = (typeof CAR_LOCATIONS)[number];

export const PAYMENT_METHODS = [
  "cash",
  "bank_transfer",
  "cheque",
  "card",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const LOCATION_LABELS: Record<CarLocation, string> = {
  china_warehouse: "China warehouse",
  in_transit: "In transit",
  algeria_arrived: "Algeria — arrived",
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  bank_transfer: "Bank transfer",
  cheque: "Cheque",
  card: "Card",
};

// Forward-only flow: pending -> confirmed -> shipped -> delivered.
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

// A car can be cancelled out of an order; delivered cars are gone for good.
export const CANCELLABLE_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
];

export type Availability = "available" | "reserved" | "sold";

export function carAvailability(
  orders: { status: OrderStatus }[] | null | undefined
): Availability {
  const active = (orders ?? []).find((o) => o.status !== "cancelled");
  if (!active) return "available";
  return active.status === "delivered" ? "sold" : "reserved";
}
