import { fotosDe } from "@/lib/supabase/fotos";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TARIFA_SELECT } from "@/lib/supabase/selects";
import { tourDeProducto, type TourWeb } from "@/lib/cotizador/tours";
import type { Foto, Tarifa } from "@/types/supabase";

let cache: Promise<TourWeb[]> | null = null;

async function leer(): Promise<TourWeb[]> {
  const { data, error } = await supabaseBrowser()
    .from("productos")
    .select(`id,nombre,destino,tarifas(${TARIFA_SELECT}),producto_fotos(id,storage_path,orden,es_principal,activo,width,height,origen,habitacion_id)`)
    .eq("activo", true)
    .eq("tipo", "excursion")
    .order("nombre");
  if (error) throw error;
  return ((data ?? []) as unknown as { id: number; nombre: string; destino: string | null; tarifas: Tarifa[] | null; producto_fotos: Foto[] | null }[])
    .map((p) => tourDeProducto(p, fotosDe(p.producto_fotos ?? [])[0] ?? null))
    .filter((t): t is TourWeb => t != null);
}

/** Todas las excursiones del catálogo (son pocas filas), agrupables por destino
 * en el cliente. Una sola lectura por visita; si falla, el próximo intento reintenta. */
export function toursDelCatalogo(): Promise<TourWeb[]> {
  const pedido = (cache ??= leer());
  pedido.catch(() => {
    if (cache === pedido) cache = null;
  });
  return pedido;
}
