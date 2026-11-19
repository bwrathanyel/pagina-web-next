// Qué habitaciones ofrece /reservar de un hotel y su precio: lo usa la pantalla del hotel elegido
// (useReserva) y «Otros hoteles en {destino}», así el precio de la tarjeta es el mismo que se ve y se
// cobra al abrir ese hotel.
import { tarjetasPorHabitacion } from "@/lib/cotizador/estimado";
import type { Tarifa } from "@/types/supabase";
import { calcularHospedaje, type BloqueoFecha, type HotelParaCobrar, type ResultadoHospedaje } from "./calculo";

export const RE_TODO_INCLUIDO = /todo\s*incluido|all\s*inclusive/i;

/** `habitacion` puede venir vacío en tarifas cargadas a mano: el nombre queda en el título, con el hotel delante. */
export function nombreDeHabitacion(t: Tarifa, hotel: string): string {
  const propio = t.habitacion?.trim();
  if (propio) return propio;
  const titulo = (t.titulo ?? "").trim();
  const sinHotel = titulo.toLowerCase().startsWith(hotel.toLowerCase()) ? titulo.slice(hotel.length).replace(/^\s*[-–—:]\s*/, "") : titulo;
  return sinHotel.trim() || "Habitación";
}

/** Qué se ofrece (dueño, 2026-11-18): nada sin precio concreto («A consultar», «Sin cupo», on request);
 * si hay habitaciones con fotos propias, solo esas; si no, una opción por plan con la habitación más
 * barata (el tipo exacto lo confirma Reservas). */
export function opcionesVisibles<T extends { tarifa: Tarifa }>(
  tarjetas: T[],
  resultados: Map<number, ResultadoHospedaje>,
  /** La tarifa tiene ficha de habitación con fotos (habitacionDeTarifa). */
  conFotos: (t: Tarifa) => boolean,
  hotelNombre: string,
): { visibles: T[]; porPlan: boolean; todoIncluido: boolean } {
  const precioDe = (id: number) => {
    const r = resultados.get(id);
    return r?.ok ? r.precio : Infinity;
  };
  const conPrecio = tarjetas.filter((c) => {
    if (/on request/i.test(nombreDeHabitacion(c.tarifa, hotelNombre))) return false;
    const r = resultados.get(c.tarifa.id);
    return !r || r.ok;
  });
  // Todo incluido: el cliente no elige habitación, el hotel lo acomoda según cuántas personas viajan (dueño 2026-11-18).
  const todoIncluido = conPrecio.length > 0 && conPrecio.every((c) => RE_TODO_INCLUIDO.test(c.tarifa.plan ?? ""));
  const conFoto = conPrecio.filter((c) => conFotos(c.tarifa));
  if (conFoto.length && !todoIncluido) return { visibles: conFoto, porPlan: false, todoIncluido };
  const mejor = new Map<string, T>();
  for (const c of conPrecio) {
    const k = c.tarifa.plan?.trim().toLowerCase() ?? "";
    const previa = mejor.get(k);
    if (!previa || precioDe(c.tarifa.id) < precioDe(previa.tarifa.id)) mejor.set(k, c);
  }
  return { visibles: [...mejor.values()], porPlan: true, todoIncluido };
}

export interface Viaje {
  desde: string;
  hasta: string;
  adultos: number;
  edades: number[];
  bebes: number;
}

export type PrecioHotel =
  | { ok: true; tarifaId: number; precio: number; noches: number }
  | { ok: false; sinCupo: boolean };

/** La habitación más barata que /reservar le ofrecería a ese viaje, con el mismo cálculo que se cobra. */
export function precioMasBajo(
  hotel: HotelParaCobrar,
  conFotos: (t: Tarifa) => boolean,
  viaje: Viaje,
  bloqueos: BloqueoFecha[],
  hoy?: string,
): PrecioHotel {
  const tarjetas = tarjetasPorHabitacion(hotel.tarifas, viaje.desde);
  const resultados = new Map<number, ResultadoHospedaje>();
  for (const c of tarjetas)
    resultados.set(c.tarifa.id, calcularHospedaje(hotel, { productoId: hotel.id, tarifaId: c.tarifa.id, ...viaje }, bloqueos, hoy));
  let mejor: { tarifaId: number; precio: number; noches: number } | null = null;
  for (const c of opcionesVisibles(tarjetas, resultados, conFotos, hotel.nombre).visibles) {
    const r = resultados.get(c.tarifa.id);
    if (r?.ok && (!mejor || r.precio < mejor.precio)) mejor = { tarifaId: c.tarifa.id, precio: r.precio, noches: r.noches };
  }
  if (mejor) return { ok: true, ...mejor };
  return { ok: false, sinCupo: [...resultados.values()].some((r) => !r.ok && r.error === "sin_disponibilidad") };
}
