import {
  ADULTOS_MAX,
  BEBES_MAX,
  contarNoches,
  DESTINOS,
  hoyCaracas,
  NINOS_MAX,
  sumarDias,
  textoDuracion,
} from "@/lib/cotizador/estado";

// Cotizador rápido del hero -> /cotizar. La URL lleva slugs cortos que
// lib/cotizador/estado.ts traduce (servicio, destino, fecha, hasta, adultos,
// ninos, bebes).

// `fechas`: cómo se llama cada fecha según el servicio. Sin segunda fecha, el
// servicio pide un solo día (el full day).
export const SERVICIOS_RAPIDOS = [
  { slug: "hospedaje", label: "Hospedaje", valor: "Hospedaje", fechas: ["Entrada", "Salida"] },
  { slug: "fullday", label: "Full Day", valor: "Full Day / Tour", fechas: ["Fecha"] },
  { slug: "vuelos", label: "Vuelos", valor: "Boletería aérea", fechas: ["Ida", "Vuelta"] },
  { slug: "paquete", label: "Paquete", valor: "Paquete completo", fechas: ["Entrada", "Salida"] },
] as const;

export const DESTINOS_RAPIDOS = DESTINOS.map((d) => ({
  valor: d,
  label: d === "Extranjero" ? "Viajar al extranjero" : d,
}));

export const COTIZACION_RAPIDA_INICIAL = {
  servicio: "hospedaje",
  destino: DESTINOS_RAPIDOS[0].valor,
  adultos: 2,
};

export function fechasDelServicio(slug: string): readonly [string, string?] {
  return SERVICIOS_RAPIDOS.find((s) => s.slug === slug)?.fechas ?? ["Fecha"];
}

export { ADULTOS_MAX, BEBES_MAX, contarNoches, hoyCaracas, NINOS_MAX, sumarDias, textoDuracion };
