// Excursiones del catálogo para /cotizar. Puro (sin red) para probarlo con
// `node --test`; la lectura de la base está en toursWeb.ts.
//
// Desde el rework de 2026-10-15 las excursiones son productos `tipo='excursion'`
// y el precio sale de su tarifa (`precios.adulto/nino`), la misma fuente del CRM
// y del bot: ya no hay una tabla de precios aparte en la web.

import type { Tarifa } from "@/types/supabase";
import { datosExcursion, tarifaBaseExcursion } from "@/lib/servicios";

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

// Las excursiones salen desde su isla: en la base llevan el lugar, no el
// destino de la barra de viaje. Coche y Cubagua son parte de Margarita.
const DESTINO_DE_TOUR: Record<string, string> = {
  margarita: "Isla de Margarita",
  "isla de margarita": "Isla de Margarita",
  cubagua: "Isla de Margarita",
  coche: "Isla de Margarita",
};

export const destinoDeTour = (destinoBase: string | null | undefined): string | null => DESTINO_DE_TOUR[clave(destinoBase)] ?? null;

/** De un `productos` tipo excursión al tour de /cotizar; null si su destino no
 * está en la barra de viaje o no tiene tarifa con precio. */
export function tourDeProducto(
  p: { id: number; nombre: string; destino: string | null; tarifas?: Tarifa[] | null },
  foto: string | null,
): TourWeb | null {
  const destino = destinoDeTour(p.destino);
  if (!destino) return null;
  const base = tarifaBaseExcursion(p.tarifas);
  const d = datosExcursion(base);
  if (!d) return null;
  const varias = (p.tarifas ?? []).filter((t) => datosExcursion(t)).length > 1;
  const partes = [d.etiqueta, d.incluyeTraslado ? "Incluye traslado" : null, varias ? "Precio desde, según habitación" : null].filter(Boolean);
  return {
    id: p.id,
    nombre: p.nombre,
    destino,
    foto,
    adultoUsd: d.adulto,
    ninoUsd: d.nino,
    ninoEdadTexto: d.edadNino,
    nota: partes.length ? partes.join(" · ") : null,
  };
}

/** "$89 por adulto · niños $45 (4-10 años)" o null si no hay precio en la web. */
export function textoPrecioTour(t: Pick<TourWeb, "adultoUsd" | "ninoUsd" | "ninoEdadTexto">): string | null {
  if (t.adultoUsd == null) return null;
  const nino =
    t.ninoUsd == null ? "" : ` · niños $${t.ninoUsd}${t.ninoEdadTexto ? ` (${t.ninoEdadTexto})` : ""}`;
  return `$${t.adultoUsd} por adulto${nino}`;
}
