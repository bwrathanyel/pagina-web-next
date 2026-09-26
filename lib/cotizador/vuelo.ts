// Precio aproximado de vuelo a partir de la tarifa "Desde" de boletería
// (`vuelos_referencia`, USD por persona, ida y vuelta). Las mismas constantes
// viven en `_shared/ventas-ia.ts` del repo CRM: si cambian acá, cambian allá.
//
// Decisiones del dueño (2026-09-25): +20% siempre; a 20 días o menos del vuelo,
// x1,15 sobre eso; solo ida = mitad de la tarifa con los mismos recargos; niños
// pagan asiento completo; bebés no suman. Sin tarifa (ruta "Otro") no hay número.

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
