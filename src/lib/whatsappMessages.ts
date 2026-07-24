import { formatDate, formatDZD } from "@/lib/format";

// French WhatsApp messages sent to customers. Both link only to the public
// tracking page — never to a staff-only invoice/receipt route.

export function trackingShareMessage(p: {
  name: string;
  orderCode: string;
  vehicle: string;
  statusFr: string;
  trackingUrl: string;
}): string {
  return [
    `Bonjour ${p.name},`,
    `Voici le suivi de votre commande ${p.orderCode} — ${p.vehicle}.`,
    `Statut actuel : ${p.statusFr}.`,
    `Suivez votre commande ici : ${p.trackingUrl}`,
  ].join("\n");
}

export function receiptShareMessage(p: {
  name: string;
  orderCode: string;
  amount: number;
  paidOn: string;
  balance: number;
  trackingUrl: string;
}): string {
  return [
    `Bonjour ${p.name},`,
    `Nous confirmons la réception de votre paiement de ${formatDZD(
      p.amount
    )} le ${formatDate(p.paidOn)} pour la commande ${p.orderCode}.`,
    `Reste à payer : ${formatDZD(p.balance)}.`,
    `Suivi de votre commande : ${p.trackingUrl}`,
  ].join("\n");
}
