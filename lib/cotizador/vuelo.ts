// Precio aproximado de vuelo a partir de la tarifa "Desde" de boletería
// (`vuelos_referencia`, USD por persona, ida y vuelta). Las mismas constantes
// viven en `_shared/ventas-ia.ts` del repo CRM: si cambian acá, cambian allá.
//
// Decisiones del dueño (2026-09-25): +20% siempre; a 20 días o menos del vuelo,
// x1,15 sobre eso; solo ida = mitad de la tarifa con los mismos recargos; niños
// pagan asiento completo; bebés no suman. Sin tarifa (ruta "Otro") no hay número.

import { fechasVuelo, ORIGENES_VUELO, type EstadoViaje } from "./estado.ts";

export const RECARGO_BASE = 1.2;
export const RECARGO_CERCANO = 1.15;
export const DIAS_CERCANO = 20;

const DIA = 86_400_000;
const aFecha = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export type EntradaVuelo = {
  /** Tarifa "Desde" ida y vuelta por persona; null si la ruta no tiene tarifa u "Otro". */
  desdeUsd: number | null;
  /** true = el cliente pide ida y vuelta; false = solo ida. */
  idaVuelta: boolean;
  fechaIda: string | null;
  hoy: string;
  adultos: number;
  ninos: number;
  bebes: number;
};

export type EstimadoVuelo = {
  porPersona: number | null;
  total: number | null;
  cercano: boolean;
  /** Días desde hoy hasta la ida; null sin fecha válida. */
  dias: number | null;
  /** Motivos por los que no hay número: "ruta" (sin tarifa) o "fecha" (ya pasó). */
  aConfirmar: string[];
  /** Hay bebés y no se sumaron al aproximado. */
  bebesSinCosto: boolean;
};

// Redondea a centavos antes del techo: 155 * 1.2 da 186.00000000000003 en
// coma flotante y un ceil directo lo subiría a 187.
const techo = (x: number) => Math.ceil(Math.round(x * 100) / 100);

export function diasHasta(fecha: string | null, hoy: string): number | null {
  if (!fecha) return null;
  const a = aFecha(hoy);
  const b = aFecha(fecha);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / DIA);
}

export function estimarVuelo(e: EntradaVuelo): EstimadoVuelo {
  const dias = diasHasta(e.fechaIda, e.hoy);
  const cercano = dias !== null && dias >= 0 && dias <= DIAS_CERCANO;
  const bebesSinCosto = e.bebes > 0;
  const aConfirmar: string[] = [];
  if (e.desdeUsd === null || !(e.desdeUsd > 0)) aConfirmar.push("ruta");
  if (dias !== null && dias < 0) aConfirmar.push("fecha");
  if (aConfirmar.length) return { porPersona: null, total: null, cercano, dias, aConfirmar, bebesSinCosto };

  const base = (e.desdeUsd as number) / (e.idaVuelta ? 1 : 2);
  const porPersona = techo(base * RECARGO_BASE * (cercano ? RECARGO_CERCANO : 1));
  const asientos = Math.max(0, e.adultos) + Math.max(0, e.ninos);
  return { porPersona, total: asientos > 0 ? porPersona * asientos : null, cercano, dias, aConfirmar, bebesSinCosto };
}

export const textoBoletos = (n: number) => `${n} ${n === 1 ? "boleto" : "boletos"}`;

// ---- rutas (fila de `web_vuelos_referencia`) ----

export type RutaVuelo = {
  origen_iata: string;
  origen_nombre: string;
  destino_iata: string;
  destino_nombre: string;
  ambito: "nacional" | "internacional";
  desde_usd: number;
  ida_vuelta: boolean;
};

/** Destinos del viaje que tienen aeropuerto con ruta: preseleccionan el vuelo. */
const IATA_DE_DESTINO: Record<string, string> = { "Isla de Margarita": "PMV" };

/** Destinos únicos de las rutas, para el selector (el primer nombre gana). */
export function destinosDeRutas(rutas: readonly RutaVuelo[]) {
  const vistos = new Map<string, { iata: string; nombre: string; ambito: RutaVuelo["ambito"] }>();
  for (const r of rutas) if (!vistos.has(r.destino_iata)) vistos.set(r.destino_iata, { iata: r.destino_iata, nombre: r.destino_nombre, ambito: r.ambito });
  return [...vistos.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export type VueloElegido = {
  /** IATA elegido (o deducido), "otro" o "" si no hay destino. */
  destino: string;
  /** Nombre para mostrar; con "otro" es el texto del cliente. */
  destinoNombre: string;
  /** Tarifa de la ruta origen-destino; null si no existe. */
  ruta: RutaVuelo | null;
};

/** Ruta del vuelo según el estado: lo elegido, o lo que se deduce del destino del viaje. */
export function vueloElegido(
  e: { origen: string; destino: string; vueloDestino: string; vueloDestinoOtro: string },
  origenIata: string | undefined,
  rutas: readonly RutaVuelo[],
): VueloElegido {
  if (e.vueloDestino === "otro") return { destino: "otro", destinoNombre: e.vueloDestinoOtro.trim(), ruta: null };
  const destinos = destinosDeRutas(rutas);
  const deducido = IATA_DE_DESTINO[e.destino] ?? "";
  const existe = (iata: string | undefined) => !!iata && destinos.some((d) => d.iata === iata);
  // Un IATA de la URL sin ruta se ignora: el selector no puede mostrar lo que no ofrece.
  const destino = existe(e.vueloDestino) ? e.vueloDestino : existe(deducido) ? deducido : "";
  const nombre = destinos.find((d) => d.iata === destino)?.nombre ?? "";
  const ruta = rutas.find((r) => r.origen_iata === origenIata && r.destino_iata === destino) ?? null;
  return { destino, destinoNombre: nombre, ruta };
}

export type VueloViaje = VueloElegido & EstimadoVuelo & { origenIata: string | undefined };

/** Ruta + estimado del vuelo del viaje: lo que muestran la pantalla, el resumen y el lead. */
export function estimarVueloViaje(e: EstadoViaje, rutas: readonly RutaVuelo[], hoy: string): VueloViaje {
  const origenIata = ORIGENES_VUELO.find((o) => o.valor === e.origen)?.iata;
  const elegido = vueloElegido(e, origenIata, rutas);
  const estimado = estimarVuelo({
    desdeUsd: elegido.ruta ? Number(elegido.ruta.desde_usd) : null,
    idaVuelta: e.vuelo === "ida-vuelta",
    fechaIda: fechasVuelo(e).ida || null,
    hoy,
    adultos: e.adultos,
    ninos: e.ninos,
    bebes: e.bebes,
  });
  return { ...elegido, ...estimado, origenIata };
}
