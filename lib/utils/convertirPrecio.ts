// Convierte los montos en $/€ dentro de un texto de precio a su equivalente
// en bolívares -- mismo enfoque de regex-sobre-texto que ya usa
// formatearPrecioCliente (mismo directorio), porque precio_texto es texto libre
// potencialmente multi-valor (ej. "SGL $115 / CPL $185"), no un número limpio.
//
// Regla del dueño (2026-11-17, corregida el 11-18): las tarifas se muestran en $
// con el número de BT tal cual, aunque BT las dé en €. La moneda de la tarifa
// decide la tasa BCV para pasar a Bs: USD = tasa dólar, EUR = tasa euro (el
// «todo a euro» del 11-17 fue un malentendido). Se suma 16% de IVA solo si el
// bloque de BT dice que la tarifa no lo incluye (`tarifario_bloques.iva_en_bs`).
// Misma regla que el checkout (`checkout_tasa_servicio`). Los vuelos no son
// tarifas de BT: van a tasa dólar y sin IVA.

export type TasaBcv = "USD" | "EUR";

/** Tasa BCV de una tarifa según su `moneda` (sin moneda = USD, como el cotizador). */
export const tasaDeMoneda = (moneda: string | null | undefined): TasaBcv =>
  String(moneda || "USD").toUpperCase() === "EUR" ? "EUR" : "USD";

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

/** `tasa`: Bs por unidad (la de la moneda de la tarifa; la del dólar para vuelos).
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
