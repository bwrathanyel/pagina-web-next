import { fotosDe } from "@/lib/supabase/fotos";
import type { Promocion } from "@/types/supabase";

// Mismo fallback que PromocionCard: fotos propias, y solo si no tiene
// ninguna, las del hotel.
function fotosDeLaPromo(p: Promocion): string[] {
  const propias = fotosDe(p.promocion_fotos);
  return propias.length > 0 ? propias : fotosDe(p.producto?.producto_fotos);
}

// Agrupa por hotel (producto.id, o la propia promocion.id si es una promo
// suelta sin hotel) y se queda con la primera de cada grupo -- el array de
// entrada ya viene ordenado por precio ascendente (getPromociones()), así que
// "la primera" es "la más barata". Mismo criterio de dedup-por-hotel que ya
// usa cotizador-chat (nunca 2 tarjetas del mismo hotel).
// Se descartan las promos con menos de 2 fotos -- una tarjeta sin fotos (o
// con una sola) se ve pobre al lado de las demás en esta sección.
export function promosHotSales(promociones: Promocion[]): Promocion[] {
  const vistos = new Set<number | string>();
  const resultado: Promocion[] = [];
  for (const p of promociones) {
    const clave = p.producto ? p.producto.id : `promo:${p.id}`;
    if (vistos.has(clave)) continue;
    if (fotosDeLaPromo(p).length < 2) continue;
    vistos.add(clave);
    resultado.push(p);
  }
  return resultado;
}

export function destinosDelPool(pool: Promocion[]): string[] {
  const destinos = new Set<string>();
  for (const p of pool) {
    if (p.producto?.destino) destinos.add(p.producto.destino);
  }
  return [...destinos].sort();
}
