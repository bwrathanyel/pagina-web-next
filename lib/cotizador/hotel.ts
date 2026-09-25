import { fotosDe } from "@/lib/supabase/fotos";
import { supabaseBrowser } from "@/lib/supabase/client";
import { TARIFA_SELECT } from "@/lib/supabase/selects";
import type { Foto, Tarifa } from "@/types/supabase";

// Lecturas de /cotizar que dependen de lo que el cliente va eligiendo (destino,
// fechas, hotel) sin recargar la página: van desde el navegador con la clave
// pública, contra vistas y funciones hechas para anon (migración
// 20260925140000): `web_habitaciones` solo trae lo revisado y
// `web_stop_sales` solo ids, fechas y estado.

export interface HabitacionWeb {
  id: number;
  nombre: string;
  nombre_norm: string | null;
  metros2: number | null;
  camas: string | null;
  capacidad_max: number | null;
  vista: string | null;
  amenities: string[] | null;
  descripcion: string | null;
  fotos: string[];
}

export interface HotelDetalle {
  id: number;
  nombre: string;
  tarifaDestacadaId: number | null;
  tarifas: Tarifa[];
  /** Fotos del hotel (sin las de habitaciones). */
  fotos: string[];
  habitaciones: HabitacionWeb[];
}

const HABITACION_SELECT = "id,nombre,nombre_norm,metros2,camas,capacidad_max,vista,amenities,descripcion";

export async function hotelParaCotizar(id: number): Promise<HotelDetalle | null> {
  const sb = supabaseBrowser();
  const [prod, habs] = await Promise.all([
    sb
      .from("productos")
      .select(
        `id,nombre,tarifa_destacada_id,tarifas(${TARIFA_SELECT}),` +
          "producto_fotos(id,storage_path,orden,es_principal,activo,width,height,origen,habitacion_id)",
      )
      .eq("activo", true)
      .eq("tipo", "hotel")
      .eq("id", id)
      .maybeSingle(),
    sb.from("web_habitaciones").select(HABITACION_SELECT).eq("producto_id", id).order("id"),
  ]);
  if (prod.error) throw prod.error;
  if (!prod.data) return null;
  const p = prod.data as unknown as {
    id: number;
    nombre: string;
    tarifa_destacada_id: number | null;
    tarifas: Tarifa[] | null;
    producto_fotos: Foto[] | null;
  };
  const fotos = p.producto_fotos ?? [];
  // Sin habitaciones (error o ninguna revisada) el hotel se cotiza igual.
  const habitaciones = ((habs.data ?? []) as Omit<HabitacionWeb, "fotos">[]).map((h) => ({
    ...h,
    fotos: fotosDe(fotos.filter((f) => f.habitacion_id === h.id)),
  }));
  return {
    id: p.id,
    nombre: p.nombre,
    tarifaDestacadaId: p.tarifa_destacada_id,
    tarifas: p.tarifas ?? [],
    fotos: fotosDe(fotos.filter((f) => f.habitacion_id == null)),
    habitaciones,
  };
}

const clave = (s: string | null | undefined) =>
  (s ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();

/** La habitación revisada que corresponde a una fila de tarifa. Los nombres
 * del PDF y los de la ficha no siempre coinciden ("LUXURY/ PREMIUM DELUXE (On
 * Request)"), así que se comparan sin paréntesis ni signos; si ninguno
 * contiene al otro, no hay ficha y la tarjeta usa la foto del hotel. */
export function habitacionDeTarifa(habitaciones: HabitacionWeb[], t: Tarifa): HabitacionWeb | null {
  const k = clave(t.habitacion);
  if (!k) return null;
  return (
    habitaciones.find((h) => clave(h.nombre) === k) ??
    habitaciones.find((h) => {
      const hk = clave(h.nombre);
      return hk.length > 2 && (hk.includes(k) || k.includes(hk));
    }) ??
    null
  );
}

export interface Bloqueo {
  desde: string;
  hasta: string;
  /** "stop_sale" bloquea; "on_request" se cotiza sujeto a confirmación. */
  estado: string;
}

/** Stop sales y on request que se cruzan con la estadía [desde, hasta). */
export async function bloqueosEnFechas(ids: number[], desde: string, hasta: string): Promise<Map<number, Bloqueo[]>> {
  const out = new Map<number, Bloqueo[]>();
  if (!ids.length || !desde || !hasta || hasta <= desde) return out;
  const { data, error } = await supabaseBrowser().rpc("web_stop_sales", {
    p_producto_ids: ids.slice(0, 200),
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) throw error;
  for (const f of (data ?? []) as { producto_id: number; fecha_desde: string; fecha_hasta: string; estado: string }[]) {
    const lista = out.get(f.producto_id) ?? [];
    lista.push({ desde: f.fecha_desde, hasta: f.fecha_hasta, estado: f.estado });
    out.set(f.producto_id, lista);
  }
  return out;
}

const CORTA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" });
// Sin el punto de la abreviatura ("oct."): el texto sigue con su propia puntuación.
const corta = (iso: string) => CORTA.format(new Date(`${iso}T00:00:00Z`)).replace(/\.$/, "");

/** "Sin disponibilidad del 12 al 15 oct" (o "el 12 oct"), con el tramo del
 * stop sale que cae dentro de la estadía. null = se puede cotizar. */
export function textoSinDisponibilidad(bloqueos: Bloqueo[] | undefined, desde: string, hasta: string): string | null {
  const stop = (bloqueos ?? []).filter((b) => b.estado === "stop_sale");
  if (!stop.length) return null;
  const inicio = stop.reduce((m, b) => (b.desde < m ? b.desde : m), stop[0].desde);
  const fin = stop.reduce((m, b) => (b.hasta > m ? b.hasta : m), stop[0].hasta);
  const a = inicio < desde ? desde : inicio;
  // `hasta` es la salida: la última noche es el día anterior.
  const ultima = new Date(Date.parse(`${hasta}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
  const b = fin > ultima ? ultima : fin;
  if (a === b) return `Sin disponibilidad el ${corta(a)}`;
  // "del 1 al 4 oct" si es el mismo mes.
  const mismoMes = a.slice(0, 7) === b.slice(0, 7);
  return `Sin disponibilidad del ${mismoMes ? Number(a.slice(8)) : corta(a)} al ${corta(b)}`;
}

export const esOnRequest = (bloqueos: Bloqueo[] | undefined) => (bloqueos ?? []).some((b) => b.estado === "on_request");
