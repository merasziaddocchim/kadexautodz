interface DbError {
  code?: string;
  message: string;
}

// The transit fiscal guards raise check_violation with these phrases. They are
// matched before the generic rules below, which would otherwise report an
// issued-document error as "Amount must be greater than zero."
const TRANSIT_GUARDS: [string, string][] = [
  [
    "can no longer be modified",
    "This transit invoice has already been issued, so it can no longer be changed. Print it, or issue a new one on a new order.",
  ],
  [
    "its lines cannot be deleted",
    "This transit invoice has already been issued and its lines cannot be removed.",
  ],
  [
    "cannot be deleted",
    "This transit invoice has already been issued and cannot be deleted.",
  ],
  [
    "labels are fixed",
    "The transit line labels are fixed and cannot be edited — only the amounts.",
  ],
  [
    "issue_transit_number",
    "A transit number is assigned automatically when the invoice is issued; it cannot be set by hand.",
  ],
  [
    "cannot be moved to another order",
    "A transit invoice belongs to its order and cannot be moved to another one.",
  ],
];

// Map Postgres/PostgREST errors to messages staff can act on.
export function friendlyError(err: DbError, entity: string): string {
  for (const [needle, message] of TRANSIT_GUARDS) {
    if (err.message.includes(needle)) return message;
  }
  if (err.code === "23503") {
    if (err.message.includes("transit_invoices"))
      return "This order has an issued transit invoice, so it cannot be deleted.";
    return `Cannot delete this ${entity}: other records still reference it.`;
  }
  if (err.code === "23505") {
    if (err.message.includes("one_active_order_per_car"))
      return "This car already has an active order — a car can only be sold once.";
    return "A record with this code already exists. Reload the page and try again.";
  }
  if (err.code === "23514") return "Amount must be greater than zero.";
  return err.message;
}
