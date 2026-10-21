// Precio de un paquete = estadía del hotel (estimarEstadia, la misma de /cotizar)
// + boleto ida y vuelta (estimarVuelo, tarifa "Desde" con los recargos del dueño).
// Funciones puras: las usan la tarjeta, la ficha y `node --test`. Nunca un número
// inventado: si una de las dos partes no se puede calcular, no hay total.
import type { Tarifa } from "@/types/supabase";
import { bloqueDe } from "@/lib/tarifas";
import { estimarEstadia, tarjetasPorHabitacion, type Estimado } from "@/lib/cotizador/estimado";
import { DIAS_CERCANO, estimarVuelo, rutaParaFecha, type EstimadoVuelo, type RutaVuelo } from "@/lib/cotizador/vuelo";
import {
  contarNoches,
  DESTINOS,
  estadoInicial,
  ORIGENES_VUELO,
  serializarEstado,
  sumarDias,
  type EstadoViaje,
} from "@/lib/cotizador/estado";
import type { Paquete } from "./tipos";

type ConFechas = Pick<Paquete, "fecha_entrada" | "fecha_salida" | "noches_min" | "noches_default" | "noches_max">;

export interface OrigenPaquete {
  iata: string;
  /** Valor de ORIGENES_VUELO, el que entiende /cotizar ("Caracas"). */
  valor: string;
  etiqueta: string;
  ruta: RutaVuelo;
}

/** Orígenes del paquete que tienen ruta publicada al destino y que /cotizar
 * sabe nombrar. Sin ninguno, el paquete no se muestra. `fecha` es la ida: los
 * paquetes con salida en Navidad cotizan la tarifa de temporada alta. */
export function origenesValidos(
  p: Pick<Paquete, "vuelo_origenes" | "vuelo_destino_iata">,
  rutas: readonly RutaVuelo[],
  fecha?: string | null,
): OrigenPaquete[] {
  const out: OrigenPaquete[] = [];
  for (const iata of new Set(p.vuelo_origenes)) {
    const origen = ORIGENES_VUELO.find((o) => o.iata === iata);
    const ruta = rutaParaFecha(rutas, iata, p.vuelo_destino_iata, fecha);
    if (origen && ruta) out.push({ iata, valor: origen.valor, etiqueta: origen.etiqueta, ruta });
  }
  return out;
}

export const esFijo = (p: Pick<Paquete, "fecha_entrada" | "fecha_salida">) => !!p.fecha_entrada && !!p.fecha_salida;

export function limitarNoches(p: ConFechas, n: number): number {
  const entero = Number.isFinite(n) ? Math.round(n) : p.noches_default;
  return Math.min(p.noches_max, Math.max(p.noches_min, entero));
}

/** Entrada por defecto: la fija, o el primer viernes a más de DIAS_CERCANO días
 * (así el primer precio que ve el cliente no trae el recargo de vuelo cercano). */
export function entradaInicial(p: ConFechas, hoy: string): string {
  if (esFijo(p)) return p.fecha_entrada!;
  let d = sumarDias(hoy, DIAS_CERCANO + 1);
  while (new Date(`${d}T00:00:00Z`).getUTCDay() !== 5) d = sumarDias(d, 1);
  return d;
}

/** La salida fija ya empezó: el paquete deja de venderse. */
export const vencido = (p: Pick<Paquete, "fecha_entrada" | "fecha_salida">, hoy: string) =>
  esFijo(p) && p.fecha_entrada! < hoy;

export function fechasPaquete(p: ConFechas, entrada: string, noches: number): { desde: string; hasta: string; noches: number } {
  if (esFijo(p)) return { desde: p.fecha_entrada!, hasta: p.fecha_salida!, noches: contarNoches(p.fecha_entrada!, p.fecha_salida!) };
  const n = limitarNoches(p, noches);
  return { desde: entrada, hasta: entrada ? sumarDias(entrada, n) : "", noches: n };
}

const norm = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().replace(/\s+/g, " ").trim();

const planDe = (t: Tarifa) => t.plan ?? bloqueDe(t)?.plan ?? null;

/** Las tarifas del plan del paquete ("TODO INCLUIDO"). Si el hotel no publica
 * ese plan, se usan todas: mejor un paquete con otro plan que uno sin precio. */
export function tarifasDelPlan(tarifas: Tarifa[], plan: string | null | undefined): Tarifa[] {
  const k = norm(plan);
  if (!k) return tarifas;
  const delPlan = tarifas.filter((t) => {
    const tp = norm(planDe(t));
    return !!tp && (tp === k || tp.includes(k) || k.includes(tp));
  });
  return delPlan.length ? delPlan : tarifas;
}

/** El plan que se muestra: el de las tarifas que de verdad se usan. */
export function planMostrado(tarifas: Tarifa[], plan: string | null | undefined): string | null {
  const usadas = tarifasDelPlan(tarifas, plan);
  return (usadas.map(planDe).find(Boolean) as string | undefined) ?? null;
}

export interface ViajerosPaquete {
  adultos: number;
  /** Edad de cada niño (2 a 11): pagan asiento y lo que diga la tarifa. */
  edades: number[];
  bebes: number;
}

export interface EstimadoPaquete {
  hotel: Estimado;
  vuelo: EstimadoVuelo;
  /** Hotel + boletos en USD; null si falta una parte o el hotel cobra en EUR. */
  total: number | null;
  porPersona: number | null;
  asientos: number;
}

const SIN_TARIFA: Estimado = { ok: false, motivo: "sin-tarifa", texto: "El hotel no tiene tarifas publicadas para estas fechas." };

export function estimarPaquete(e: {
  tarifa: Tarifa | null;
  tarifas: Tarifa[];
  desde: string;
  hasta: string;
  viajeros: ViajerosPaquete;
  ruta: RutaVuelo | null;
  hoy: string;
}): EstimadoPaquete {
  const { adultos, edades, bebes } = e.viajeros;
  const hotel = e.tarifa ? estimarEstadia(e.tarifa, e.tarifas, { desde: e.desde, hasta: e.hasta, adultos, edades, bebes }) : SIN_TARIFA;
  const vuelo = estimarVuelo({
    desdeUsd: e.ruta ? Number(e.ruta.desde_usd) : null,
    idaVuelta: true,
    fechaIda: e.desde || null,
    hoy: e.hoy,
    adultos,
    ninos: edades.length,
    bebes,
  });
  const asientos = Math.max(0, adultos) + edades.length;
  const total = hotel.ok && hotel.moneda === "USD" && vuelo.total != null ? Math.round((hotel.total + vuelo.total) * 100) / 100 : null;
  return { hotel, vuelo, total, porPersona: total != null && asientos > 0 ? Math.ceil(total / asientos) : null, asientos };
}

/** Habitación por defecto: la más barata con estimado para estas fechas; si
 * ninguna da número, la destacada del hotel (si es del plan) o la primera. */
export function tarifaInicial(
  tarifasPlan: Tarifa[],
  destacadaId: number | null,
  estadia: { desde: string; hasta: string; viajeros: ViajerosPaquete },
): Tarifa | null {
  const tarjetas = tarjetasPorHabitacion(tarifasPlan, estadia.desde);
  if (!tarjetas.length) return null;
  let mejor: { t: Tarifa; total: number } | null = null;
  for (const { tarifa } of tarjetas) {
    const est = estimarEstadia(tarifa, tarifasPlan, { desde: estadia.desde, hasta: estadia.hasta, ...estadia.viajeros });
    if (est.ok && est.moneda === "USD" && (mejor === null || est.total < mejor.total)) mejor = { t: tarifa, total: est.total };
  }
  if (mejor) return mejor.t;
  return tarifasPlan.find((t) => t.id === destacadaId) ?? tarjetas[0].tarifa;
}

/** Destino del hotel -> destino de /cotizar ("Margarita" -> "Isla de Margarita"). */
export function destinoCotizador(destino: string | null | undefined): string | null {
  if (!destino) return null;
  if (/^(isla de )?margarita$/i.test(destino.trim())) return "Isla de Margarita";
  return DESTINOS.includes(destino) ? destino : null;
}

/** Enlace "Reservar con un asesor": /cotizar con todo precargado (hotel,
 * habitación, vuelo, fechas y pasajeros); el lead sale por el flujo de siempre. */
export function enlaceCotizarPaquete(e: {
  hotelId: number;
  hotelDestino: string | null;
  vueloDestinoIata: string;
  origen: string;
  desde: string;
  hasta: string;
  viajeros: ViajerosPaquete;
  tarifaId: number | null;
}): string {
  const base = estadoInicial();
  const estado: EstadoViaje = {
    ...base,
    servicios: ["hospedaje", "vuelo"],
    destino: destinoCotizador(e.hotelDestino) ?? base.destino,
    desde: e.desde,
    hasta: e.hasta,
    adultos: e.viajeros.adultos,
    ninos: e.viajeros.edades.length,
    edades: e.viajeros.edades,
    bebes: e.viajeros.bebes,
    hotel: e.hotelId,
    tarifa: e.tarifaId,
    origen: e.origen,
    vuelo: "ida-vuelta",
    vueloDestino: e.vueloDestinoIata,
  };
  return `/cotizar?${serializarEstado(estado)}`;
}
