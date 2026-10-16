// Recomendaciones de hospedaje de /cotizar: en vez de una grilla con todos los
// hoteles del destino (Margarita tiene más de 30), tres con su motivo a la vista.
// Función pura: la prueba `node --test`.
import type { OfertaHotel } from "@/lib/cotizador/ofertas";

export type MotivoRecomendacion = "recomendado" | "economico" | "ninos-gratis" | "todo-incluido" | "otra";

export interface Recomendacion {
  oferta: OfertaHotel;
  motivo: MotivoRecomendacion;
}

/** Total estimado de un hotel para el viaje; solo se comparan montos de la misma moneda. */
export interface TotalComparable {
  monto: number;
  moneda: string;
}

const MAXIMO = 3;
const MIN_TOTALES = 3;

const ETIQUETA_MOTIVO: Record<Exclude<MotivoRecomendacion, "ninos-gratis">, string> = {
  recomendado: "Nuestra recomendación",
  economico: "Más económico",
  "todo-incluido": "Todo incluido",
  otra: "Otra buena opción",
};

export function etiquetaMotivo({ oferta, motivo }: Recomendacion): string {
  if (motivo === "ninos-gratis") {
    return oferta.ninosGratisCantidad > 1 ? `${oferta.ninosGratisCantidad} niños gratis` : "1 niño gratis";
  }
  return ETIQUETA_MOTIVO[motivo];
}

/** Hoteles a los que conviene pedirles las tarifas para estimar de entrada:
 * los primeros del orden del dueño y los de menor precio anunciado. */
export function candidatosEstimado(ofertas: OfertaHotel[], primeros = 8, baratos = 4): number[] {
  const porPrecio = ofertas.filter((o) => o.orden != null).sort((a, b) => a.orden! - b.orden!);
  return [...new Set([...ofertas.slice(0, primeros), ...porPrecio.slice(0, baratos)].map((o) => o.hotelId))];
}

function masBarata(ofertas: OfertaHotel[], total: (o: OfertaHotel) => TotalComparable | null): OfertaHotel | undefined {
  const conTotal = ofertas.flatMap((o) => {
    const t = total(o);
    return t ? [{ o, t }] : [];
  });
  // Con pocos totales (con niños casi ninguna tarifa publica su precio) "el
  // más económico" saldría de dos o tres hoteles: manda el precio anunciado.
  if (conTotal.length >= Math.min(MIN_TOTALES, ofertas.length)) {
    const cuenta = new Map<string, number>();
    for (const { t } of conTotal) cuenta.set(t.moneda, (cuenta.get(t.moneda) ?? 0) + 1);
    const moneda = [...cuenta].sort((a, b) => b[1] - a[1])[0][0];
    return conTotal.filter((x) => x.t.moneda === moneda).reduce((a, b) => (b.t.monto < a.t.monto ? b : a)).o;
  }
  // Sin fechas no hay totales: manda el precio anunciado (el de "Menor precio").
  const conOrden = ofertas.filter((o) => o.orden != null);
  return conOrden.length ? conOrden.reduce((a, b) => (b.orden! < a.orden! ? b : a)) : undefined;
}

/**
 * Hasta tres hoteles, sin repetir. `ofertas` llega en el orden del dueño
 * (`ofertasHoteles`): la primera disponible es la recomendada; después la más
 * económica, la de niño gratis (si viaja con niños), una todo incluido y, si
 * falta, la siguiente del orden. Los que tienen stop sale no se recomiendan.
 */
export function recomendarHoteles(
  ofertas: OfertaHotel[],
  {
    ninos = 0,
    bloqueada = () => false,
    total = () => null,
  }: {
    ninos?: number;
    bloqueada?: (o: OfertaHotel) => boolean;
    total?: (o: OfertaHotel) => TotalComparable | null;
  } = {},
): Recomendacion[] {
  const disponibles = ofertas.filter((o) => !bloqueada(o));
  if (!disponibles.length) return [];
  const out: Recomendacion[] = [{ oferta: disponibles[0], motivo: "recomendado" }];
  const libre = (o: OfertaHotel) => !out.some((r) => r.oferta.hotelId === o.hotelId);
  const agregar = (o: OfertaHotel | undefined, motivo: MotivoRecomendacion) => {
    if (o && out.length < MAXIMO && libre(o)) out.push({ oferta: o, motivo });
  };
  // Si la recomendada ya es la más barata, ese motivo no se le pone a otra.
  agregar(masBarata(disponibles, total), "economico");
  if (ninos > 0) agregar(disponibles.find((o) => libre(o) && o.ninosGratis), "ninos-gratis");
  agregar(disponibles.find((o) => libre(o) && o.todoIncluido), "todo-incluido");
  for (const o of disponibles) agregar(o, "otra");
  return out;
}
