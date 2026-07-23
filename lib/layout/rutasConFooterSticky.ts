/** Rutas que ya tienen su propio footer sticky mobile (CTA fijo arriba del
 * bottom tab bar) -- los FABs flotantes globales (WhatsApp, Lotus IA) se
 * ocultan ahí en mobile porque caen encima de esos botones (mismo bottom-24,
 * mismo lado derecho). Ver auditoría 2026-07-23. */
export function tieneFooterStickyPropio(pathname: string): boolean {
  return (
    pathname.startsWith("/producto/") ||
    pathname === "/cotizador-personalizado" ||
    pathname.startsWith("/cotizar/") ||
    pathname === "/carrito"
  );
}
