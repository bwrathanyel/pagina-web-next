import { DESTINOS_VENEZUELA } from "@/components/cotizador/wizardConfig";
import type { Respuestas } from "@/components/cotizador/types";

// Cotizador rápido del hero -> /cotizador-personalizado. La URL lleva slugs
// cortos y la página los traduce a las mismas respuestas que el wizard ya
// arma a mano (tipoServicio, destino, fechaAprox, adultos): así el lead, el
// mensaje de WhatsApp y sheetMonkey no cambian de forma.

export const SERVICIOS_RAPIDOS = [
  { slug: "hospedaje", label: "Hospedaje", valor: "Hospedaje" },
  { slug: "fullday", label: "Full Day", valor: "Full Day / Tour" },
  { slug: "vuelos", label: "Vuelos", valor: "Boletería aérea" },
  { slug: "paquete", label: "Paquete", valor: "Paquete completo" },
] as const;

export const DESTINOS_RAPIDOS = DESTINOS_VENEZUELA.map((d) => ({ valor: d.value, label: d.label }));

export const ADULTOS_MAX = 20;

export const COTIZACION_RAPIDA_INICIAL = {
  servicio: "hospedaje",
  destino: DESTINOS_RAPIDOS[0].valor,
  adultos: "2",
};

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

/** Hoy en Caracas como "AAAA-MM-DD": el mínimo de todo campo de fecha de viaje.
 * Con toISOString, de 20:00 a medianoche el mínimo ya era mañana (UTC). */
export const hoyCaracas = (ahora = new Date()) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(ahora);

/** searchParams de la página -> respuestas iniciales del wizard. Todo lo que
 * no sea un valor conocido se ignora: la URL la puede escribir cualquiera. */
export function inicialDesdeParams(sp: Record<string, string | string[] | undefined>): Respuestas {
  const r: Respuestas = {};
  const servicio = SERVICIOS_RAPIDOS.find((s) => s.slug === uno(sp.servicio));
  if (servicio) r.tipoServicio = servicio.valor;
  const destino = DESTINOS_RAPIDOS.find((d) => d.valor === uno(sp.destino));
  if (destino) r.destino = destino.valor;
  const fecha = uno(sp.fecha);
  if (fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha)) && fecha >= hoyCaracas())
    r.fechaAprox = fecha;
  const adultos = Number(uno(sp.adultos));
  if (Number.isInteger(adultos) && adultos >= 1 && adultos <= ADULTOS_MAX) r.adultos = adultos;
  return r;
}
