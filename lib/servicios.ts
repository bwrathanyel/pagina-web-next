// Excursiones y traslados del tarifario BT (rework 2026-10-15). Funciones puras:
// las usan tarjetas, ficha, catálogo y cotizador, y se prueban con `node --test`.
//
// Convención de `tarifas.precios` (la escribe la carga curada, ver
// migrations/20261015290200 del repo CRM):
//   excursión: { base:'persona', adulto, nino, infante (0 = gratis, null = no aplica),
//     edad_nino:[min,max], min_pax, incluye_traslado, no_incluye:[{concepto,monto,aplica}],
//     etiqueta ('Cubagua'), modalidad ('privado' = full day de grupo privado, origen 'manual'), notas }
//   traslado:  { modalidad:'compartido'|'privado'|'disposicion', tramo, sentido:'OW'|'RT',
//     base:'persona'|'unidad'|'horas', pax_min, pax_max, horas, hora_extra, monto,
//     nino:'50%'|monto, vehiculo, capacidad }
//   suplemento (Los Roques): { posada, items:[{concepto, monto, por}], notas } + tarifas.moneda
import type { Producto, Tarifa } from "@/types/supabase";
import { montoConMoneda, vendibleHoy, type PrecioTarjeta } from "@/lib/tarifas";

type Bolsa = Record<string, unknown>;

const bolsa = (t: Tarifa | null | undefined): Bolsa => {
  const p = t?.precios as unknown;
  return p && typeof p === "object" && !Array.isArray(p) ? (p as Bolsa) : {};
};

function num(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const texto = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export interface NoIncluye {
  concepto: string;
  monto: number | null;
  aplica: string | null;
}

export interface DatosExcursion {
  adulto: number | null;
  nino: number | null;
  /** 0 = gratis; null = el PDF no lo menciona. */
  infante: number | null;
  edadNino: string | null;
  minPax: number | null;
  /** Full day de grupo privado: no se reserva por persona suelta, se cotiza (modalidad:'privado'). */
  privado: boolean;
  incluyeTraslado: boolean;
  noIncluye: NoIncluye[];
  notas: string | null;
  etiqueta: string | null;
  moneda: string | null;
}

/** "4-11 años" desde `edad_nino: [4, 11]`. */
function edadTexto(v: unknown): string | null {
  if (!Array.isArray(v)) return null;
  const [a, b] = [num(v[0]), num(v[1])];
  if (a === null && b === null) return null;
  return a !== null && b !== null ? `${a}-${b} años` : `${a ?? b} años`;
}

export function datosExcursion(t: Tarifa | null | undefined): DatosExcursion | null {
  if (!t) return null;
  const p = bolsa(t);
  const adulto = num(p.adulto);
  const nino = num(p.nino);
  if (adulto === null && nino === null) return null;
  const noIncluye = (Array.isArray(p.no_incluye) ? p.no_incluye : []).flatMap((x): NoIncluye[] => {
    const o = x && typeof x === "object" ? (x as Bolsa) : null;
    const concepto = texto(o?.concepto);
    return o && concepto ? [{ concepto, monto: num(o.monto), aplica: texto(o.aplica) }] : [];
  });
  return {
    adulto,
    nino,
    infante: num(p.infante),
    edadNino: edadTexto(p.edad_nino),
    minPax: num(p.min_pax),
    privado: p.modalidad === "privado",
    incluyeTraslado: p.incluye_traslado === true,
    noIncluye,
    notas: texto(p.notas),
    etiqueta: texto(p.etiqueta),
    moneda: t.moneda ?? null,
  };
}

/** La tarifa de la excursión que representa al producto: la vendible más barata
 * para el adulto (Glamping trae SGL y DBL). */
export function tarifaBaseExcursion(tarifas: Tarifa[] | null | undefined): Tarifa | null {
  const todas = (tarifas ?? []).filter((t) => datosExcursion(t));
  const vivas = todas.filter(vendibleHoy);
  const lista = vivas.length ? vivas : todas;
  return [...lista].sort((a, b) => (datosExcursion(a)!.adulto ?? Infinity) - (datosExcursion(b)!.adulto ?? Infinity))[0] ?? null;
}

export function textoNoIncluye(n: NoIncluye, moneda?: string | null): string {
  const monto = n.monto !== null ? ` ${montoConMoneda(n.monto, moneda)}` : "";
  return `${n.concepto}${monto}${n.aplica ? ` ${n.aplica}` : ""}`.trim();
}

export interface FilaTraslado {
  id: number;
  modalidad: "compartido" | "privado" | "disposicion" | null;
  tramo: string | null;
  /** "1 pasajero", "Desde 2 pasajeros", "1 a 3 pasajeros", "4 horas", "Hora extra". */
  rango: string;
  monto: number | null;
  /** "por persona", "por unidad", "por 4 horas". */
  unidad: string;
  vehiculo: string | null;
  sentido: string | null;
  nino: string | null;
  hora: number | null;
  horaExtra: boolean;
}

function rangoTraslado(p: Bolsa): string {
  if (p.hora_extra === true) return "Hora extra";
  const horas = num(p.horas);
  if (p.base === "horas" && horas !== null) return `${horas} horas`;
  const [min, max] = [num(p.pax_min), num(p.pax_max)];
  if (min !== null && max !== null) return min === max || max === 1 ? `${min} pasajero${min === 1 ? "" : "s"}` : `${min} a ${max} pasajeros`;
  if (min !== null) return `Desde ${min} pasajeros`;
  return "Tarifa";
}

export function filaTraslado(t: Tarifa): FilaTraslado | null {
  const p = bolsa(t);
  const monto = num(p.monto);
  if (monto === null) return null;
  const base = p.base;
  const horas = num(p.horas);
  const unidad =
    p.hora_extra === true ? "por hora extra" : base === "horas" ? `por ${horas ?? ""} horas`.replace("  ", " ") : base === "unidad" ? "por unidad" : "por persona";
  const modalidad = p.modalidad === "compartido" || p.modalidad === "privado" || p.modalidad === "disposicion" ? p.modalidad : null;
  const nino = typeof p.nino === "number" ? montoConMoneda(p.nino, t.moneda) : texto(p.nino);
  return {
    id: t.id,
    modalidad,
    tramo: texto(p.tramo),
    rango: rangoTraslado(p),
    monto,
    unidad,
    vehiculo: texto(p.vehiculo),
    sentido: texto(p.sentido),
    nino,
    hora: horas,
    horaExtra: p.hora_extra === true,
  };
}

export interface Suplemento {
  posada: string | null;
  items: { concepto: string; monto: number | null; por: string | null }[];
  notas: string | null;
  moneda: string | null;
}

/** Suplemento de traslado a cayos de una posada de Los Roques. */
export function suplementoRoques(t: Tarifa): Suplemento | null {
  const p = bolsa(t);
  if (!Array.isArray(p.items) && !texto(p.posada) && !texto(t.titulo)) return null;
  const items = (Array.isArray(p.items) ? p.items : []).flatMap((x) => {
    const o = x && typeof x === "object" ? (x as Bolsa) : null;
    const concepto = texto(o?.concepto);
    return o && concepto ? [{ concepto, monto: num(o.monto), por: texto(o.por) }] : [];
  });
  const posada = texto(p.posada) ?? texto(t.titulo);
  if (!items.length && !posada) return null;
  return { posada, items, notas: texto(p.notas), moneda: texto(p.moneda) ?? t.moneda ?? null };
}

export const esSuplementoRoques = (t: Tarifa) => Array.isArray(bolsa(t).items);

/** Precio de la tarjeta y de la caja de la ficha de un servicio. */
export function precioDeServicio(producto: Pick<Producto, "tipo" | "tarifas">): PrecioTarjeta | null {
  if (producto.tipo === "excursion") {
    const t = tarifaBaseExcursion(producto.tarifas);
    const d = datosExcursion(t);
    if (!t || !d || d.adulto === null) return null;
    const varias = (producto.tarifas ?? []).filter((x) => datosExcursion(x)).length > 1;
    const nino = d.nino !== null ? ` · niños ${montoConMoneda(d.nino, d.moneda)}${d.edadNino ? ` (${d.edadNino})` : ""}` : "";
    if (d.privado) return { monto: montoConMoneda(d.adulto, d.moneda), unidad: `por persona · grupo privado${d.minPax ? ` (mín. ${d.minPax})` : ""}`, desde: varias, corto: true };
    return { monto: montoConMoneda(d.adulto, d.moneda), unidad: `por adulto${nino}`, desde: varias, corto: true };
  }
  if (producto.tipo === "traslado") {
    const tarifas = producto.tarifas ?? [];
    if (tarifas.some(esSuplementoRoques)) {
      return { monto: "Según posada", unidad: "Suplementos de traslado a cayos", desde: false, corto: false };
    }
    const filas = tarifas.flatMap((t) => {
      const f = filaTraslado(t);
      return f && !f.horaExtra ? [{ f, t }] : [];
    });
    if (!filas.length) return null;
    const { f, t } = filas.sort((a, b) => a.f.monto! - b.f.monto!)[0];
    const unidad = f.unidad === "por persona" && f.sentido === "OW" ? "por persona, solo ida" : f.unidad === "por unidad" ? "por vehículo, solo ida" : f.unidad;
    return { monto: montoConMoneda(f.monto!, t.moneda), unidad, desde: filas.length > 1, corto: true };
  }
  return null;
}

/** Excursión de grupo privado: la ficha ofrece "Cotizar grupo privado" en vez de la cotización por persona. */
export const esGrupoPrivado = (producto: Pick<Producto, "tipo" | "tarifas">): boolean =>
  producto.tipo === "excursion" && datosExcursion(tarifaBaseExcursion(producto.tarifas))?.privado === true;

export const esServicio = (tipo: string) => tipo === "excursion" || tipo === "traslado";
