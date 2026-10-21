import { cache } from "react";
import { fotosDe } from "@/lib/supabase/fotos";
import { supabaseServer } from "@/lib/supabase/server";
import { TARIFA_SELECT } from "@/lib/supabase/selects";
import { destinoPublico } from "@/lib/supabase/queries";
import { vendibleHoy } from "@/lib/tarifas";
import type { HabitacionWeb } from "@/lib/cotizador/hotel";
import type { Foto, Tarifa } from "@/types/supabase";
import type { Paquete } from "./tipos";

// Columnas siempre explícitas, como el resto de queries.ts. `!inner` + filtro
// por el hotel: un paquete cuyo hotel se apagó deja de salir solo.
const PAQUETE_SELECT =
  "id,slug,titulo,etiqueta,descripcion,notas,plan,vuelo_destino_iata,vuelo_origenes,fecha_entrada,fecha_salida," +
  "noches_min,noches_default,noches_max,incluye,orden," +
  "hotel:productos!inner(id,nombre,destino,descripcion,tipo,activo,tarifa_destacada_id," +
  `tarifas(${TARIFA_SELECT}),` +
  "producto_fotos(id,storage_path,orden,es_principal,activo,width,height,origen,habitacion_id))";

const HABITACION_SELECT = "id,producto_id,nombre,nombre_norm,metros2,camas,capacidad_max,vista,amenities,descripcion";

type FilaHotel = {
  id: number;
  nombre: string;
  destino: string | null;
  descripcion: string | null;
  tarifa_destacada_id: number | null;
  tarifas: Tarifa[] | null;
  producto_fotos: Foto[] | null;
};
type FilaPaquete = Omit<Paquete, "hotel"> & { hotel: FilaHotel | FilaHotel[] };
type FilaHabitacion = Omit<HabitacionWeb, "fotos"> & { producto_id: number };

async function leerPaquetes(slug?: string): Promise<Paquete[]> {
  const sb = supabaseServer();
  let q = sb
    .from("paquetes")
    .select(PAQUETE_SELECT)
    .eq("activo", true)
    .eq("hotel.activo", true)
    .eq("hotel.tipo", "hotel")
    .order("orden")
    .order("id");
  if (slug) q = q.eq("slug", slug);
  const { data, error } = await q;
  if (error) throw error;
  const filas = (data ?? []) as unknown as FilaPaquete[];
  if (!filas.length) return [];

  const hotelDe = (f: FilaPaquete) => (Array.isArray(f.hotel) ? f.hotel[0] : f.hotel);
  const ids = [...new Set(filas.map((f) => hotelDe(f)?.id).filter((id): id is number => id != null))];
  // Sin habitaciones (error o ninguna revisada) el paquete se muestra igual.
  const { data: habs } = await sb.from("web_habitaciones").select(HABITACION_SELECT).in("producto_id", ids).order("id");
  const habitaciones = (habs ?? []) as FilaHabitacion[];

  return filas.flatMap((f) => {
    const h = hotelDe(f);
    if (!h) return [];
    const fotos = h.producto_fotos ?? [];
    const hotel = destinoPublico({
      id: h.id,
      nombre: h.nombre,
      destino: h.destino,
      descripcion: h.descripcion,
      tarifaDestacadaId: h.tarifa_destacada_id,
      tarifas: (h.tarifas ?? []).filter(vendibleHoy),
      fotos: fotosDe(fotos.filter((x) => x.habitacion_id == null)),
      habitaciones: habitaciones
        .filter((x) => x.producto_id === h.id)
        .map((x) => ({
          id: x.id,
          nombre: x.nombre,
          nombre_norm: x.nombre_norm,
          metros2: x.metros2,
          camas: x.camas,
          capacidad_max: x.capacidad_max,
          vista: x.vista,
          amenities: x.amenities,
          descripcion: x.descripcion,
          fotos: fotosDe(fotos.filter((ft) => ft.habitacion_id === x.id)),
        })),
    });
    return [{ ...f, vuelo_origenes: f.vuelo_origenes ?? [], incluye: f.incluye ?? [], hotel }];
  });
}

/** Paquetes activos con su hotel, en el orden del CRM. */
export const getPaquetes = cache(() => leerPaquetes());

export const getPaquetePorSlug = cache(async (slug: string): Promise<Paquete | null> => {
  if (!/^[a-z0-9-]{1,80}$/.test(slug)) return null;
  return (await leerPaquetes(slug))[0] ?? null;
});

export async function getSlugsPaquetes(): Promise<string[]> {
  const { data, error } = await supabaseServer().from("paquetes").select("slug").eq("activo", true);
  if (error) throw error;
  return (data ?? []).map((d) => d.slug as string);
}
