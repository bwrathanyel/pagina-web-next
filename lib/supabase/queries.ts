import { cache } from "react";
import { fotosDe } from "@/lib/supabase/fotos";
import { supabaseServer } from "@/lib/supabase/server";
import type { Categoria, HotSale, Producto, Promocion, ProductoTipo } from "@/types/supabase";
import { CATEGORIA_A_TIPO } from "@/types/supabase";
import { ninoGratisVigente } from "@/lib/promociones/ninosGratis";

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
  "fecha_fin,fecha_venta_fin,minimo_noches,condiciones,ventanas,orden_pdf,origen,resumen_ia," +
  "tarifario_bloques(id,plan,base_precio,incluye,check_in,check_out,ocupacion,ninos,suplementos,minimo_noches,impuestos,otras)";

export const PRODUCTO_SELECT =
  "id,tipo,nombre,destino,descripcion,requisitos,tarifa_destacada_id," +
  `tarifas(${TARIFA_SELECT}),` +
  "producto_fotos(id,storage_path,orden,es_principal,activo,width,height,origen)";

// La fuente de /catalogo/promociones es la vista `web_promociones`
// (migración 20260906120000): flyers vigentes + Hot Sales pinchados + la tarifa
// destacada de cada hotel activo del tarifario nacional automático, ya filtrada
// por vigencia y fechas. Los ids son los de `tarifas` (los que apuntan las fotos
// y reciben las RPC). Se renombra `fecha_fin` -> `fecha_fin_estimada` para el
// vocabulario que ya habla el sitio.
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
    .from("web_promociones")
    .select(PROMOCION_SELECT)
    .order("score", { ascending: false })
    .order("precio_desde_usd", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return ((data ?? []) as unknown as Promocion[]).map(promoConDestinoPublico);
}

// Hot Sales = exactamente la pestaña del CRM (migración 20260924150000): la
// rpc decide qué tarifas entran, en qué orden y cuáles son manuales, y la vista
// aporta el detalle de cada una (la vista ya incluye todos esos ids). Antes la
// web corría el mismo algoritmo sobre otro pool y mostraba otros hoteles.
type FilaHotSale = Pick<HotSale, "id" | "posicion" | "manual" | "nino_gratis">;
export const getHotSales = cache(async (): Promise<HotSale[]> => {
  const sb = supabaseServer();
  const { data: filas, error } = await sb.rpc("hot_sales_publicas");
  if (error) throw error;
  const lista = (filas ?? []) as FilaHotSale[];
  if (lista.length === 0) return [];
  const { data, error: errorDetalle } = await sb
    .from("web_promociones")
    .select(PROMOCION_SELECT)
    .in("id", lista.map((f) => f.id));
  if (errorDetalle) throw errorDetalle;
  const detalle = new Map(((data ?? []) as unknown as Promocion[]).map((p) => [p.id, p]));
  return lista
    .sort((a, b) => a.posicion - b.posicion)
    .flatMap((f) => {
      const p = detalle.get(f.id);
      return p ? [{ ...promoConDestinoPublico(p), posicion: f.posicion, manual: f.manual, nino_gratis: ninoGratisVigente(f.nino_gratis) }] : [];
    });
});

// `cache()`: generateMetadata y el componente de página piden el mismo producto
// en el mismo render -> una sola query por request (antes eran dos, y la ruta
// /cotizar/producto es dinámica: bajo pico de tráfico eso reventó el límite de
// CPU/memoria del Worker, error 1102, 2026-09-06).
export const getProductoPorId = cache(_getProductoPorId);
async function _getProductoPorId(id: number): Promise<Producto | null> {
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

export const getPromocionPorId = cache(_getPromocionPorId);
async function _getPromocionPorId(id: number): Promise<Promocion | null> {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("web_promociones")
    .select(PROMOCION_SELECT)
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

/** Ids de la vista `web_promociones` — para prerenderizar /cotizar/promocion. */
export async function getTodasLasPromocionIds(): Promise<number[]> {
  const sb = supabaseServer();
  const { data, error } = await sb.from("web_promociones").select("id");
  if (error) throw error;
  return (data ?? []).map((d) => d.id as number);
}

export interface HotelCotizador {
  id: number;
  nombre: string;
  destino: string | null;
  foto: string | null;
}

/** Lo mínimo para mostrar el hotel elegido en /cotizar (sin tarifas: la query
 * completa de `getProductoPorId` es pesada y /cotizar es dinámica). */
export const getHotelCotizador = cache(async (id: number): Promise<HotelCotizador | null> => {
  const sb = supabaseServer();
  const { data, error } = await sb
    .from("productos")
    .select("id,nombre,destino,producto_fotos(id,storage_path,orden,es_principal,activo,width,height,origen)")
    .eq("activo", true)
    .eq("tipo", "hotel")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const p = destinoPublico(data as unknown as Producto);
  return { id: p.id, nombre: p.nombre, destino: p.destino, foto: fotosDe(p.producto_fotos)[0] ?? null };
});
