import { supabaseServer } from "@/lib/supabase/server";
import type { Categoria, Producto, Promocion, ProductoTipo } from "@/types/supabase";
import { CATEGORIA_A_TIPO } from "@/types/supabase";

// Columns are always named explicitly — never `select=*` and never
// `fuente_archivo` (internal Drive path, not for public consumption).
export const PRODUCTO_SELECT =
  "id,tipo,nombre,destino,descripcion,requisitos," +
  "tarifas(precio_texto,precio_desde_usd,vigencia_texto,vigente)," +
  "producto_fotos(id,storage_path,orden,es_principal,activo,width,height)";

export const PROMOCION_SELECT =
  "id,titulo,precio_texto,precio_desde_usd,vigencia_texto,ninos_gratis_cantidad,incluye_tags," +
  "producto:productos(id,tipo,nombre,destino,producto_fotos(id,storage_path,orden,es_principal,activo))," +
  "promocion_fotos(id,storage_path,orden,es_principal,activo,width,height)";

export async function getProductosPorTipo(tipo: ProductoTipo): Promise<Producto[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("productos")
    .select(PRODUCTO_SELECT)
    .eq("activo", true)
    .eq("tipo", tipo)
    .order("nombre");
  if (error) throw error;
  return (data ?? []) as unknown as Producto[];
}

export async function getProductosPorCategoria(
  categoria: Exclude<Categoria, "promociones">,
): Promise<Producto[]> {
  return getProductosPorTipo(CATEGORIA_A_TIPO[categoria]);
}

export async function getPromociones(): Promise<Promocion[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("promociones")
    .select(PROMOCION_SELECT)
    .eq("revisado", true)
    .order("precio_desde_usd", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return (data ?? []) as unknown as Promocion[];
}

export async function getProductoPorId(id: number): Promise<Producto | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("productos")
    .select(PRODUCTO_SELECT)
    .eq("activo", true)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Producto | null;
}

export async function getPromocionPorId(id: number): Promise<Promocion | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("promociones")
    .select(PROMOCION_SELECT)
    .eq("revisado", true)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as unknown as Promocion | null;
}

export async function getPromocionesPorProductoId(productoId: number): Promise<Promocion[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("promociones")
    .select(PROMOCION_SELECT)
    .eq("revisado", true)
    .eq("producto_id", productoId);
  if (error) throw error;
  return (data ?? []) as unknown as Promocion[];
}

/** All active product ids across the three sellable tipos (excludes
 * 'info', which is internal notices, not a public catalog entry). */
export async function getTodosLosProductoIds(): Promise<number[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("productos")
    .select("id")
    .eq("activo", true)
    .in("tipo", ["hotel", "paquete", "destino"]);
  if (error) throw error;
  return (data ?? []).map((d) => d.id as number);
}
