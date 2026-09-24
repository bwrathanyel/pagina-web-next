// Convierte los montos en $/€ dentro de un texto de precio a su equivalente
// en bolívares, a la tasa BCV vigente -- mismo enfoque de regex-sobre-texto
// que ya usa formatearPrecioCliente (mismo directorio), porque precio_texto
// es texto libre potencialmente multi-valor (ej. "SGL $115 / CPL $185"),
// no un número limpio que se pueda convertir de una.

const FORMATO_BS = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Lee un monto en el formato en que llega: es-VE ("1.200", "1.200,50", que es
// como lo emite formatearPrecioDesde), en-US ("1,200", "1,200.50") o simple
// ("115", "115.50", "115,50"). Un solo separador con 1-2 dígitos detrás es decimal.
function parsearMonto(bruto: string): number {
  const t = bruto.replace(/[.,]+$/, "");
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(t)) return parseFloat(t.replace(/\./g, "").replace(",", "."));
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return parseFloat(t.replace(/,/g, ""));
  if (/^\d+,\d{1,2}$/.test(t)) return parseFloat(t.replace(",", "."));
  return parseFloat(t);
}

export function convertirPrecioTexto(
  precioTexto: string | null | undefined,
  tasaUSD: number | null,
  tasaEUR: number | null,
): string | null {
  if (!precioTexto) return precioTexto ?? null;

  let resultado = precioTexto;

  if (tasaUSD) {
    resultado = resultado.replace(/\$\s?([\d.,]+)/g, (match, monto) => {
      const num = parsearMonto(monto);
      if (!Number.isFinite(num)) return match;
      return `Bs ${FORMATO_BS.format(num * tasaUSD)}`;
    });
  }

  if (tasaEUR) {
    resultado = resultado.replace(/€\s?([\d.,]+)/g, (match, monto) => {
      const num = parsearMonto(monto);
      if (!Number.isFinite(num)) return match;
      return `Bs ${FORMATO_BS.format(num * tasaEUR)}`;
    });
  }

  return resultado;
}
