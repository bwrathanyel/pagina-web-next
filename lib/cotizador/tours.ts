// Full day y tours del catálogo para /cotizar. Puro (sin red) para probarlo con
// `node --test`; la lectura de la base está en toursWeb.ts.
//
// Los productos de tipo "paquete" mezclan tours con paquetes armados y vuelos:
// aquí se separan los tours. El precio solo sale de FULLDAY_PRECIO_RULES (la
// fuente de verdad de la web); sin regla, "a confirmar".

import { FULLDAY_PRECIO_RULES } from "../fullday-pricing.ts";

export interface TourWeb {
  id: number;
  nombre: string;
  /** Destino de /cotizar ("Isla de Margarita"). */
  destino: string;
  foto: string | null;
  adultoUsd: number | null;
  ninoUsd: number | null;
  ninoEdadTexto: string | null;
  nota: string | null;
}

const clave = (s: string | null | undefined) =>
  (s ?? "").normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();

// Los tours salen desde su isla o su parque: en la base llevan el lugar, no el
// destino de la barra de viaje.
const DESTINO_DE_TOUR: Record<string, string> = {
  margarita: "Isla de Margarita",
  "isla de margarita": "Isla de Margarita",
  cubagua: "Isla de Margarita",
  coche: "Isla de Margarita",
  morrocoy: "Morrocoy",
  chichiriviche: "Morrocoy",
  tucacas: "Morrocoy",
  "los roques": "Los Roques",
  merida: "Mérida",
  canaima: "Canaima",
  zulia: "Catatumbo",
  catatumbo: "Catatumbo",
  "colonia tovar": "Colonia Tovar",
};

export const destinoDeTour = (destinoBase: string | null | undefined): string | null => DESTINO_DE_TOUR[clave(destinoBase)] ?? null;

const NO_ES_TOUR = /^(vuelo|descriptivo|paquete|graduandos)/i;
const ES_TOUR = /\b(tour|full ?day|day ?pass|daypass|pool ?day|excursi)/i;

export function esTour(nombre: string): boolean {
  if (nombre in FULLDAY_PRECIO_RULES) return true;
  return !NO_ES_TOUR.test(nombre.trim()) && ES_TOUR.test(nombre);
}

/** Del `productos` crudo (tipo paquete) al tour de /cotizar; null si no lo es
 * o su destino no está en la barra de viaje. */
export function tourDeProducto(p: { id: number; nombre: string; destino: string | null }, foto: string | null): TourWeb | null {
  const destino = destinoDeTour(p.destino);
  if (!destino || !esTour(p.nombre)) return null;
  const regla = FULLDAY_PRECIO_RULES[p.nombre];
  return {
    id: p.id,
    nombre: p.nombre,
    destino,
    foto,
    adultoUsd: regla?.adultoUsd ?? null,
    ninoUsd: regla?.ninoUsd ?? null,
    ninoEdadTexto: regla?.ninoEdadTexto ?? null,
    nota: regla?.nota ?? null,
  };
}

/** "$89 por adulto · niños $45 (4-10 años)" o null si no hay precio en la web. */
export function textoPrecioTour(t: Pick<TourWeb, "adultoUsd" | "ninoUsd" | "ninoEdadTexto">): string | null {
  if (t.adultoUsd == null) return null;
  const nino =
    t.ninoUsd == null ? "" : ` · niños $${t.ninoUsd}${t.ninoEdadTexto ? ` (${t.ninoEdadTexto})` : ""}`;
  return `$${t.adultoUsd} por adulto${nino}`;
}
