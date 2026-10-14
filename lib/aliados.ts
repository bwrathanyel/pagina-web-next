import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { getProductoPorId, getProductosPorTipo } from "@/lib/supabase/queries";
import { montoConMoneda, precioPorPersona, tarifaDestacada, type PrecioTarjeta } from "@/lib/tarifas";
import type { Producto, Tarifa } from "@/types/supabase";

// Catálogo corporativo /aliados/<slug> (tabla `aliados`, migración
// 20261014220000): el descuento de agencia del aliado se aplica al "desde"
// por persona del tarifario vivo, nunca a un número fijo.
export interface Aliado {
  slug: string;
  nombre: string;
  descuento_pct: number;
  productos: number[] | null;
}

export const SLUG_ALIADO = /^[a-z0-9-]{1,40}$/;

export const getAliado = cache(async (slug: string): Promise<Aliado | null> => {
  if (!SLUG_ALIADO.test(slug)) return null;
  const { data, error } = await supabaseServer()
    .from("aliados")
    .select("slug,nombre,descuento_pct,productos")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? { ...data, descuento_pct: Number(data.descuento_pct) } as Aliado : null;
});

/** Precio por persona con el descuento del aliado. Sin grilla de precios
 * (solo texto libre) no hay número que descontar: la tarjeta dice "Consultar". */
export function precioAliado(t: Tarifa | null | undefined, descuento: number): PrecioTarjeta | null {
  const pp = t?.precios ? precioPorPersona(t) : null;
  if (pp === null || !t) return null;
  return {
    monto: montoConMoneda(Math.round(pp * (100 - descuento)) / 100, t.moneda),
    unidad: `por persona, con ${descuento}% de aliado`,
    desde: true,
    corto: true,
  };
}

const montoBase = (p: Producto) => {
  const t = tarifaDestacada(p);
  return (t?.precios ? precioPorPersona(t) : null) ?? Infinity;
};

export interface GrupoAliado {
  titulo: string;
  productos: Producto[];
}

/** Lista propia del aliado (`aliados.productos`, en ese orden) o, sin lista,
 * paquetes + los hoteles de Margarita más económicos. */
export async function getGruposAliado(aliado: Aliado): Promise<GrupoAliado[]> {
  if (aliado.productos?.length) {
    const productos = (await Promise.all(aliado.productos.map((id) => getProductoPorId(id)))).filter(
      (p): p is Producto => Boolean(p),
    );
    return [{ titulo: `Selección para ${aliado.nombre}`, productos }];
  }
  const [paquetes, hoteles] = await Promise.all([getProductosPorTipo("paquete"), getProductosPorTipo("hotel")]);
  const margarita = hoteles
    .filter((h) => /margarita/i.test(h.destino ?? ""))
    .sort((a, b) => montoBase(a) - montoBase(b))
    .slice(0, 12);
  return [
    { titulo: "Paquetes", productos: paquetes },
    { titulo: "Hoteles en Margarita", productos: margarita },
  ].filter((g) => g.productos.length);
}
