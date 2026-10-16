export const NUMERO_CORPORATIVO =
  process.env.NEXT_PUBLIC_WHATSAPP_CORPORATIVO?.trim() || "584244634041";

/** Corporate WhatsApp link — same number the current site's floating
 * button uses. Forms that create a lead send to the advisor the CRM
 * assigned; this number is their fallback when the CRM can't answer. */
export function whatsappHref(mensaje: string): string {
  return `https://wa.me/${NUMERO_CORPORATIVO}?text=${encodeURIComponent(mensaje)}`;
}
