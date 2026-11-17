// Recomendaciones de hospedaje de /cotizar: en vez de una grilla con todos los
// hoteles del destino (Margarita tiene más de 30), un destacado que rota entre
// tres y dos alternativas de otro perfil, con su motivo a la vista.
// Función pura: la prueba `node --test`.
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { destacadosDe, idsDestacados } from "@/lib/cotizador/destacados";

export type MotivoRecomendacion =
  | "recomendado"
  | "economico"
  | "desayuno"
  | "exclusivo"
  | "ninos-gratis"
  | "todo-incluido"
  | "otra";

export interface Recomendacion {
  oferta: OfertaHotel;
  motivo: MotivoRecomendacion;
}

export interface Recomendaciones {
  destacados: Recomendacion[];
  alternativas: Recomendacion[];
}

/** Total estimado de un hotel para el viaje; solo se comparan montos de la misma moneda. */
export interface TotalComparable {
  monto: number;
  moneda: string;
}

const MAX_ALTERNATIVAS = 2;
const MIN_TOTALES = 3;

const ETIQUETA_MOTIVO: Record<Exclude<MotivoRecomendacion, "ninos-gratis">, string> = {
  recomendado: "Nuestra recomendación",
  economico: "Más económico",
  desayuno: "Solo desayuno",
  exclusivo: "Más exclusivo",
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
 * los destacados del destino, los primeros del orden del dueño y los de menor
 * precio anunciado. */
export function candidatosEstimado(
  ofertas: OfertaHotel[],
  primeros = 8,
  baratos = 4,
  destino?: string | null,
): number[] {
  const porPrecio = ofertas.filter((o) => o.orden != null).sort((a, b) => a.orden! - b.orden!);
  const destacados = idsDestacados(destino).filter((id) => ofertas.some((o) => o.hotelId === id));
  return [...new Set([...destacados, ...[...ofertas.slice(0, primeros), ...porPrecio.slice(0, baratos)].map((o) => o.hotelId)])];
}

/** La más barata (`sentido` 1) o la más cara (-1) de `ofertas`. */
function extremo(
  ofertas: OfertaHotel[],
  total: (o: OfertaHotel) => TotalComparable | null,
  sentido: 1 | -1,
): OfertaHotel | undefined {
  if (!ofertas.length) return undefined;
  const gana = (a: number, b: number) => sentido * (b - a) < 0;
  const conTotal = ofertas.flatMap((o) => {
    const t = total(o);
    return t ? [{ o, t }] : [];
  });
  // Con pocos totales (con niños casi ninguna tarifa publica su precio) el
  // extremo saldría de dos o tres hoteles: manda el precio anunciado.
  if (conTotal.length >= Math.min(MIN_TOTALES, ofertas.length)) {
    const cuenta = new Map<string, number>();
    for (const { t } of conTotal) cuenta.set(t.moneda, (cuenta.get(t.moneda) ?? 0) + 1);
    const moneda = [...cuenta].sort((a, b) => b[1] - a[1])[0][0];
    return conTotal.filter((x) => x.t.moneda === moneda).reduce((a, b) => (gana(a.t.monto, b.t.monto) ? b : a)).o;
  }
  // Sin fechas no hay totales: manda el precio anunciado (el de "Menor precio").
  const conOrden = ofertas.filter((o) => o.orden != null);
  return conOrden.length ? conOrden.reduce((a, b) => (gana(a.orden!, b.orden!) ? b : a)) : undefined;
}

/**
 * `ofertas` llega en el orden del dueño (`ofertasHoteles`). Destacados: los del
 * mapa del destino (sin rotar; la rotación por visitante va afuera). Alternativas,
 * sin repetir hotel: la más económica sin todo incluido y la más exclusiva.
 * Los que tienen stop sale no aparecen.
 */
export function recomendarHoteles(
  ofertas: OfertaHotel[],
  {
    ninos = 0,
    bloqueada = () => false,
    total = () => null,
    destino = null,
  }: {
    ninos?: number;
    bloqueada?: (o: OfertaHotel) => boolean;
    total?: (o: OfertaHotel) => TotalComparable | null;
    destino?: string | null;
  } = {},
): Recomendaciones {
  const destacados: Recomendacion[] = destacadosDe(ofertas, destino, bloqueada).map((oferta) => ({
    oferta,
    motivo: "recomendado",
  }));
  const alternativas: Recomendacion[] = [];
  const usados = new Set(destacados.map((r) => r.oferta.hotelId));
  const libres = () => ofertas.filter((o) => !bloqueada(o) && !usados.has(o.hotelId));
  const agregar = (o: OfertaHotel | undefined, motivo: MotivoRecomendacion) => {
    if (!o || alternativas.length >= MAX_ALTERNATIVAS || usados.has(o.hotelId)) return false;
    alternativas.push({ oferta: o, motivo });
    usados.add(o.hotelId);
    return true;
  };

  // Sin precios no hay "más económico" que mostrar: queda la siguiente del orden.
  if (
    !agregar(extremo(libres().filter((o) => !o.todoIncluido), total, 1), "desayuno") &&
    !agregar(extremo(libres(), total, 1), "economico")
  ) {
    agregar(libres()[0], "otra");
  }

  // El niño gratis solo desplaza a la exclusiva cuando no hubo con qué medirla.
  if (
    !agregar(extremo(libres(), total, -1), "exclusivo") &&
    !(ninos > 0 && agregar(libres().find((o) => o.ninosGratis), "ninos-gratis"))
  ) {
    agregar(libres()[0], "otra");
  }

  return { destacados, alternativas };
}
