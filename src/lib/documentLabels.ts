import { CarLocation, OrderStatus, PaymentMethod } from "@/lib/types";

// French labels used inside printed documents. The app UI stays English.
export const METHOD_FR: Record<PaymentMethod, string> = {
  cash: "Espèces",
  bank_transfer: "Virement bancaire",
  cheque: "Chèque",
  card: "Carte bancaire",
};

export const STATUS_FR: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export const LOCATION_FR: Record<CarLocation, string> = {
  china_warehouse: "Entrepôt (Chine)",
  in_transit: "En transit",
  algeria_arrived: "Arrivé en Algérie",
};
