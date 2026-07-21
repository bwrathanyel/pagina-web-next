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
