// Convierte los montos en $/€ dentro de un texto de precio a su equivalente
// en bolívares -- mismo enfoque de regex-sobre-texto que ya usa
// formatearPrecioCliente (mismo directorio), porque precio_texto es texto libre
// potencialmente multi-valor (ej. "SGL $115 / CPL $185"), no un número limpio.
//
// Regla del dueño (2026-11-17): las tarifas se muestran en $ con el número de BT
// tal cual, aunque BT las dé en €. En Bs se cobra todo a tasa BCV del EURO y se
// suma 16% de IVA solo si el bloque de BT dice que la tarifa no lo incluye
// (`tarifario_bloques.iva_en_bs`). Misma regla que `precio_bs()` en SQL y que el
// CRM (`cbBsBase`). Los vuelos no son tarifas de BT: esos pasan `tasaUSD`.

const FORMATO_BS = new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const IVA_BS = 1.16;

export const montoBs = (n: number) => `Bs ${FORMATO_BS.format(n)}`;

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

/** `tasa`: Bs por unidad (la del euro para tarifas, la del dólar para vuelos).
 * Sin tasa devuelve el texto tal cual: nunca se inventa un monto en Bs. */
export function convertirPrecioTexto(
  precioTexto: string | null | undefined,
  tasa: number | null,
  ivaEnBs = false,
): string | null {
  if (!precioTexto) return precioTexto ?? null;
  if (!tasa) return precioTexto;
  const factor = tasa * (ivaEnBs ? IVA_BS : 1);
  return precioTexto.replace(/[$€]\s?([\d.,]+)/g, (match, monto) => {
    const num = parsearMonto(monto);
    if (!Number.isFinite(num)) return match;
    return montoBs(num * factor);
  });
}
