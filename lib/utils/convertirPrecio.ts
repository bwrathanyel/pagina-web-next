// Convierte los montos en $/€ dentro de un texto de precio a su equivalente
// en bolívares, a la tasa BCV vigente -- mismo enfoque de regex-sobre-texto
// que ya usa formatearPrecioCliente (mismo directorio), porque precio_texto
// es texto libre potencialmente multi-valor (ej. "SGL $115 / CPL $185"),
// no un número limpio que se pueda convertir de una.

const FORMATO_BS = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function convertirPrecioTexto(
  precioTexto: string | null | undefined,
  tasaUSD: number | null,
  tasaEUR: number | null,
): string | null {
  if (!precioTexto) return precioTexto ?? null;

  let resultado = precioTexto;

  if (tasaUSD) {
    resultado = resultado.replace(/\$\s?([\d.,]+)/g, (match, monto) => {
      const num = parseFloat(monto.replace(/,/g, ""));
      if (!Number.isFinite(num)) return match;
      return `Bs ${FORMATO_BS.format(num * tasaUSD)}`;
    });
  }

  if (tasaEUR) {
    resultado = resultado.replace(/€\s?([\d.,]+)/g, (match, monto) => {
      const num = parseFloat(monto.replace(/,/g, ""));
      if (!Number.isFinite(num)) return match;
      return `Bs ${FORMATO_BS.format(num * tasaEUR)}`;
    });
  }

  return resultado;
}
