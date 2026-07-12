const NUMERO_CORPORATIVO = process.env.NEXT_PUBLIC_WHATSAPP_CORPORATIVO ?? "584244634041";

/** Corporate WhatsApp link — same number the current site's floating
 * button uses. The weighted advisor pool (ASESORES) only applies inside
 * the quote wizard, not this always-on CTA. */
export function whatsappHref(mensaje: string): string {
  return `https://wa.me/${NUMERO_CORPORATIVO}?text=${encodeURIComponent(mensaje)}`;
}
