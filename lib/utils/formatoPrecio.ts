// Traduce las siglas internas del tarifario (SGL, DBL, TPL, CPL, QPL, SEXT,
// CHD...) a lenguaje natural para el cliente público -- mismo mapeo que ya
// usa el asistente de IA (CODIGOS_HABITACION en
// supabase/functions/_shared/ventas-ia.ts), portado acá porque esta web es
// un runtime separado (Next.js/navegador) sin acceso directo a ese módulo
// Deno. Solo para texto que ve el cliente -- las pantallas de admin
// (EditarProductoModal/EditarPromocionModal) siguen mostrando el código
// crudo tal cual, porque el staff edita esos valores directo.
const CODIGOS_HABITACION: Record<string, string> = {
  SGL: "individual", DBL: "doble", TPL: "triple", CPL: "cuádruple", CDP: "cuádruple",
  QPL: "quíntuple", QTP: "quíntuple", SEXT: "6 personas", CHD: "niño",
};

/** Regla del dueño (2026-11-17): al cliente todo se le muestra en $, con el mismo
 * número que da BT aunque la tarifa venga en € (el € solo decide la tasa para
 * Bs, ver convertirPrecio.ts). Mismo criterio que `tarTextoUsd` del CRM. */
export const textoEnDolares = (s: string) => s.replace(/€\s?/g, "$").replace(/\bEUR\b/g, "USD");

export function formatearPrecioCliente(precioTexto: string | null | undefined): string | null {
  if (!precioTexto) return precioTexto ?? null;
  return textoEnDolares(precioTexto).replace(
    /\b(SGL|DBL|TPL|CPL|CDP|QPL|QTP|SEXT|CHD)\b/gi,
    (m) => CODIGOS_HABITACION[m.toUpperCase()] ?? m,
  );
}

/** Precio corto para tarjetas donde no entra `precio_texto` (que es un parrafo
 * libre: "Paquete 4 dias / 3 noches... 2 personas $150 total | 3 personas
 * $180..."). Usa el numerico `precio_desde_usd`. Siempre en $ aunque la promo
 * venga en € (promo 274: 286 = $286, regla del dueño 2026-11-17). Si no hay
 * numerico, no hay precio corto: mejor ninguno que uno inventado. */
export function formatearPrecioDesde(montoDesde: number | null | undefined): string | null {
  if (typeof montoDesde !== "number" || !Number.isFinite(montoDesde)) return null;
  return `$${Math.round(montoDesde).toLocaleString("es-VE")}`;
}
