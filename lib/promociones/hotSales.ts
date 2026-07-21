import type { Promocion } from "@/types/supabase";

// Agrupa por hotel (producto.id, o la propia promocion.id si es una promo
// suelta sin hotel) y se queda con la primera de cada grupo -- el array de
// entrada ya viene ordenado por precio ascendente (getPromociones()), así que
// "la primera" es "la más barata". Mismo criterio de dedup-por-hotel que ya
// usa cotizador-chat (nunca 2 tarjetas del mismo hotel).
export function promosHotSales(promociones: Promocion[]): Promocion[] {
  const vistos = new Set<number | string>();
  const resultado: Promocion[] = [];
  for (const p of promociones) {
    const clave = p.producto ? p.producto.id : `promo:${p.id}`;
    if (vistos.has(clave)) continue;
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
