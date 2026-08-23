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

export function formatearPrecioCliente(precioTexto: string | null | undefined): string | null {
  if (!precioTexto) return precioTexto ?? null;
  return precioTexto.replace(
    /\b(SGL|DBL|TPL|CPL|CDP|QPL|QTP|SEXT|CHD)\b/gi,
    (m) => CODIGOS_HABITACION[m.toUpperCase()] ?? m,
  );
}

/** Precio corto para tarjetas donde no entra `precio_texto` (que es un parrafo
 * libre: "Paquete 4 dias / 3 noches... 2 personas $150 total | 3 personas
 * $180..."). Usa el numerico `precio_desde_usd`, pero saca el simbolo del
 * texto: la columna se llama _usd y NO siempre lo es -- la promo 274 guarda
 * 286 y su precio real es EUR286. Sin esta comprobacion la portada afirmaria
 * una moneda equivocada. Si no hay numerico, no hay precio corto: mejor
 * ninguno que uno inventado. */
export function formatearPrecioDesde(
  montoDesde: number | null | undefined,
  precioTexto: string | null | undefined,
): string | null {
  if (typeof montoDesde !== "number" || !Number.isFinite(montoDesde)) return null;
  const simbolo = precioTexto?.includes("€") ? "€" : "$";
  return `${simbolo}${Math.round(montoDesde).toLocaleString("es-VE")}`;
}
