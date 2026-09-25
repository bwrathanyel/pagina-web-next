import { DESTINOS_VENEZUELA } from "@/components/cotizador/wizardConfig";
import { contarNoches, hoyCaracas, sumarDias, textoDuracion } from "@/lib/cotizador/estado";
import type { Respuestas } from "@/components/cotizador/types";

// Cotizador rápido del hero -> /cotizador-personalizado. La URL lleva slugs
// cortos y la página los traduce a las mismas respuestas que el wizard ya
// arma a mano (tipoServicio, destino, fechaAprox, fechaFin, adultos, ninos,
// bebes): así el lead, el mensaje de WhatsApp y sheetMonkey no cambian de forma.

// `fechas`: cómo se llama cada fecha según el servicio. Sin segunda fecha, el
// servicio pide un solo día (el full day).
export const SERVICIOS_RAPIDOS = [
  { slug: "hospedaje", label: "Hospedaje", valor: "Hospedaje", fechas: ["Entrada", "Salida"] },
  { slug: "fullday", label: "Full Day", valor: "Full Day / Tour", fechas: ["Fecha"] },
  { slug: "vuelos", label: "Vuelos", valor: "Boletería aérea", fechas: ["Ida", "Vuelta"] },
  { slug: "paquete", label: "Paquete", valor: "Paquete completo", fechas: ["Entrada", "Salida"] },
] as const;

export const DESTINOS_RAPIDOS = DESTINOS_VENEZUELA.map((d) => ({ valor: d.value, label: d.label }));

// Los topes de niños y bebés son las opciones de los selects del wizard.
export const ADULTOS_MAX = 20;
export const NINOS_MAX = 4;
export const BEBES_MAX = 2;

export const COTIZACION_RAPIDA_INICIAL = {
  servicio: "hospedaje",
  destino: DESTINOS_RAPIDOS[0].valor,
  adultos: 2,
};

export function fechasDelServicio(slug: string): readonly [string, string?] {
  return SERVICIOS_RAPIDOS.find((s) => s.slug === slug)?.fechas ?? ["Fecha"];
}

const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export { contarNoches, hoyCaracas, sumarDias, textoDuracion };

const esFechaViaje = (v: string | undefined): v is string =>
  !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && v >= hoyCaracas();

function entero(v: string | undefined, min: number, max: number) {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** searchParams de la página -> respuestas iniciales del wizard. Todo lo que
 * no sea un valor conocido se ignora: la URL la puede escribir cualquiera. */
export function inicialDesdeParams(sp: Record<string, string | string[] | undefined>): Respuestas {
  const r: Respuestas = {};
  const servicio = SERVICIOS_RAPIDOS.find((s) => s.slug === uno(sp.servicio));
  if (servicio) r.tipoServicio = servicio.valor;
  const destino = DESTINOS_RAPIDOS.find((d) => d.valor === uno(sp.destino));
  if (destino) r.destino = destino.valor;
  const fecha = uno(sp.fecha);
  if (esFechaViaje(fecha)) {
    r.fechaAprox = fecha;
    const hasta = uno(sp.hasta);
    if (servicio && servicio.fechas.length > 1 && esFechaViaje(hasta) && hasta > fecha) r.fechaFin = hasta;
  }
  const adultos = entero(uno(sp.adultos), 1, ADULTOS_MAX);
  if (adultos) r.adultos = adultos;
  // Los selects del wizard guardan niños y bebés como texto ("0".."4").
  const ninos = entero(uno(sp.ninos), 1, NINOS_MAX);
  if (ninos) r.ninos = String(ninos);
  const bebes = entero(uno(sp.bebes), 1, BEBES_MAX);
  if (bebes) r.bebes = String(bebes);
  return r;
}
