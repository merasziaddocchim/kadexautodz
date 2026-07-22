interface DbError {
  code?: string;
  message: string;
}

// Map Postgres/PostgREST errors to messages staff can act on.
export function friendlyError(err: DbError, entity: string): string {
  if (err.code === "23503")
    return `Cannot delete this ${entity}: other records still reference it.`;
  if (err.code === "23505") {
    if (err.message.includes("one_active_order_per_car"))
      return "This car already has an active order — a car can only be sold once.";
    return "A record with this code already exists. Reload the page and try again.";
  }
  if (err.code === "23514") return "Amount must be greater than zero.";
  return err.message;
}
