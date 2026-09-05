import { supabaseServer } from "@/lib/supabase/server";
import type { Categoria, Producto, Promocion, ProductoTipo } from "@/types/supabase";
import { CATEGORIA_A_TIPO } from "@/types/supabase";

// "Casa Vacacional Playa del Sur" vive así en productos.destino a propósito
// (pedido real 2026-07-22) -- el bot de ventas de ManyChat lo usa como gate
// de exclusividad textual para la colaboración paga (ver leadCoincideCasaPlayaSur
// en manychat-sales-chat-deepseek/index.ts), así que ese valor NUNCA se toca
// en la base. En la web pública se muestra como "Chichiriviche", su ubicación
// real -- este mapeo aplica solo acá, en la capa de lectura para el sitio.
const DESTINO_PUBLICO_OVERRIDE: Record<string, string> = {
  "Casa Vacacional Playa del Sur": "Chichiriviche",
};
function destinoPublico<T extends { destino?: string | null }>(p: T): T {
  if (!p?.destino || !(p.destino in DESTINO_PUBLICO_OVERRIDE)) return p;
  return { ...p, destino: DESTINO_PUBLICO_OVERRIDE[p.destino] };
}
function conDestinoPublico(producto: Producto): Producto {
  return destinoPublico(producto);
}
function promoConDestinoPublico(promo: Promocion): Promocion {
  return promo.producto ? { ...promo, producto: destinoPublico(promo.producto) } : promo;
}

// Columns are always named explicitly — never `select=*` and never
// `fuente_archivo` (internal Drive path, not for public consumption).

// Una fila de `tarifas` es UNA promoción del PDF, con sus precios etiquetados y
// las condiciones del plan colgando (`tarifario_bloques`, el recuadro azul).
// Los campos estructurados vienen NULL hasta que corra la carga maestra: la
// carpeta cae sola a `precio_texto`/`vigencia_texto`.
const TARIFA_SELECT =
  "id,precio_texto,precio_desde_usd,vigencia_texto,vigente,moneda," +
  "titulo,plan,habitacion,precios,venta_desde,venta_hasta,disfrute_desde," +
  "fecha_fin,fecha_venta_fin,minimo_noches,condiciones,ventanas,orden_pdf,origen," +
  "tarifario_bloques(id,plan,base_precio,incluye,check_in,check_out,ocupacion,ninos,suplementos,minimo_noches,impuestos,otras)";

export const PRODUCTO_SELECT =
  "id,tipo,nombre,destino,descripcion,requisitos,tarifa_destacada_id," +
  `tarifas(${TARIFA_SELECT}),` +
  "producto_fotos(id,storage_path,orden,es_principal,activo,width,height,origen)";

// Desde la Fase 5 paso 4 los flyers viven en `tarifas` con `origen='flyer'`;
// `promociones` quedó como vista de compatibilidad. Se consulta la tabla real
// (los ids que sirven son los de `tarifas`: son los que apuntan las fotos y los
// que reciben las RPC) y se renombran dos columnas al vocabulario que ya habla
// el sitio -- `fecha_fin_estimada` es `fecha_fin` y `revisado` es `vigente`.
export const PROMOCION_SELECT =
  "id,titulo,precio_texto,precio_desde_usd,vigencia_texto,fecha_fin_estimada:fecha_fin,fecha_venta_fin," +
  "precios,plan,moneda,habitacion," +
  "hot_sale_estado,hot_sale_orden,ninos_gratis_cantidad,incluye_tags,resumen_ia,score," +
  "producto:productos(id,tipo,nombre,destino,producto_fotos(id,storage_path,orden,es_principal,activo,origen))," +
  "promocion_fotos(id,storage_path,orden,es_principal,activo,width,height,origen)";

export async function getProductosPorTipo(tipo: ProductoTipo): Promise<Producto[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("productos")
    .select(PRODUCTO_SELECT)
    .eq("activo", true)
    .eq("tipo", tipo)
    .order("nombre");
  if (error) throw error;
  return ((data ?? []) as unknown as Producto[]).map(conDestinoPublico);
}

export async function getProductosPorCategoria(
  categoria: Exclude<Categoria, "promociones">,
): Promise<Producto[]> {
  return getProductosPorTipo(CATEGORIA_A_TIPO[categoria]);
}

export async function getPromociones(): Promise<Promocion[]> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("tarifas")
    .select(PROMOCION_SELECT)
    .or("origen.eq.flyer,hot_sale_estado.eq.poner")
    .eq("vigente", true)
    .order("score", { ascending: false })
    .order("precio_desde_usd", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Promocion[]).map(promoConDestinoPublico);
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
  return data ? conDestinoPublico(data as unknown as Producto) : null;
}

export async function getPromocionPorId(id: number): Promise<Promocion | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("tarifas")
    .select(PROMOCION_SELECT)
    .or("origen.eq.flyer,hot_sale_estado.eq.poner")
    .eq("vigente", true)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? promoConDestinoPublico(data as unknown as Promocion) : null;
}

// getPromocionesPorProductoId() se retiró con la Fase 5b: los flyers de un hotel
// son filas de `tarifas`, o sea que ya vienen dentro de `producto.tarifas` y la
// carpeta los pinta con las demás. Consultarlos aparte mostraba cada flyer dos
// veces, que es el mismo doble conteo que se sacó del CRM.

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
