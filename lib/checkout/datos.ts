// Lecturas del servidor para el checkout (Plan 1, F3). Con la clave anon y sin sesión: solo ve lo que ve
// cualquier visitante (las políticas RLS de `tarifas` ya dejan fuera lo que no se puede vender hoy), y de
// todos modos el cálculo vuelve a filtrar con `vendibleHoy`. Nada de esto corre en el navegador.
import { supabaseServer } from "@/lib/supabase/server";
import { TARIFA_SELECT } from "@/lib/supabase/selects";
import { fotosDe } from "@/lib/supabase/fotos";
import type { HabitacionWeb } from "@/lib/cotizador/hotel";
import type { Foto, Tarifa } from "@/types/supabase";
import type { BloqueoFecha, HotelParaCobrar } from "./calculo";

export type HotelCobrable = HotelParaCobrar & { destino: string | null };

export async function hotelParaCobrar(id: number): Promise<HotelCobrable | null> {
  const { data, error } = await supabaseServer()
    .from("productos")
    .select(`id,nombre,destino,tarifas(${TARIFA_SELECT})`)
    .eq("activo", true)
    .eq("oculto_sin_foto", false)
    .eq("tipo", "hotel")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const p = data as unknown as { id: number; nombre: string; destino: string | null; tarifas: Tarifa[] | null };
  return { id: p.id, nombre: p.nombre, destino: p.destino, tarifas: p.tarifas ?? [] };
}

/** Fichas revisadas de las habitaciones y fotos de /reservar. Solo adorno: si falla, las tarjetas
 * salen sin foto ni ficha y la compra sigue igual. */
export async function vitrinaDeHabitaciones(productoId: number): Promise<{ habitaciones: HabitacionWeb[]; fotosHotel: string[] }> {
  const sb = supabaseServer();
  const [habs, fotos] = await Promise.all([
    sb.from("web_habitaciones").select("id,nombre,nombre_norm,metros2,camas,capacidad_max,vista,amenities,descripcion").eq("producto_id", productoId).order("id"),
    sb.from("producto_fotos").select("id,storage_path,orden,es_principal,activo,origen,habitacion_id").eq("producto_id", productoId),
  ]);
  const todas = (fotos.data ?? []) as unknown as (Foto & { habitacion_id: number | null })[];
  const habitaciones = ((habs.data ?? []) as Omit<HabitacionWeb, "fotos">[]).map((h) => ({
    ...h,
    fotos: fotosDe(todas.filter((f) => f.habitacion_id === h.id)),
  }));
  return { habitaciones, fotosHotel: fotosDe(todas.filter((f) => f.habitacion_id == null)) };
}

/** Stop sales y on request que se cruzan con la estadía [desde, hasta). */
export async function bloqueosDe(productoId: number, desde: string, hasta: string): Promise<BloqueoFecha[]> {
  const { data, error } = await supabaseServer().rpc("web_stop_sales", {
    p_producto_ids: [productoId],
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) throw error;
  return ((data ?? []) as { fecha_desde: string; fecha_hasta: string; estado: string }[]).map((f) => ({
    desde: f.fecha_desde,
    hasta: f.fecha_hasta,
    estado: f.estado,
  }));
}
