import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import { getHotSales } from "@/lib/supabase/queries";
import { TARIFA_SELECT } from "@/lib/supabase/selects";
import { fotosDe, esSoloReferencial } from "@/lib/supabase/fotos";
import { estimarEstadia } from "@/lib/cotizador/estimado";
import { bloqueDe, ventanasDe } from "@/lib/tarifas";
import type { HotSale, Tarifa } from "@/types/supabase";

// Catálogo corporativo /aliados/<slug> (tabla `aliados`, migración
// 20261014220000). Desde F2c (dueño, 2026-10-14) solo muestra las Hot Sales
// vigentes armadas como paquete con precio TOTAL para 2 adultos, y el
// descuento del aliado va encima del precio Hot Sale. Nunca un número fijo:
// todo sale del tarifario vivo, y lo que no se puede totalizar no se muestra.
export interface Aliado {
  slug: string;
  nombre: string;
  descuento_pct: number;
  /** Si está cargada, limita las Hot Sales a estos productos. */
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

const ADULTOS = 2;
const NOCHES_BASE = 3;
const DIAS_BUSQUEDA = 365;
const DIA = 86_400_000;

export interface PaqueteAliado {
  id: number;
  hotel: string;
  titulo: string | null;
  destino: string | null;
  plan: string | null;
  fotos: string[];
  fotosReferenciales: boolean;
  manual: boolean;
  ninosGratis: number;
  adultos: number;
  noches: number;
  moneda: "USD" | "EUR";
  /** Total del paquete con la tarifa Hot Sale. */
  total: number;
  /** El mismo total con el descuento del aliado. */
  totalAliado: number;
  /** Última fecha de viaje de la temporada usada (YYYY-MM-DD). */
  viajeHasta: string | null;
  ventaHasta: string | null;
}

type Total = { total: number; noches: number; viajeHasta: string | null };

const redondear = (n: number) => Math.round(n * 100) / 100;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** "1.350,00" / "286" / "53.33" -> número. */
function montoTexto(s: string): number | null {
  const limpio = s.includes(",") ? s.replace(/\./g, "").replace(",", ".") : /^\d{1,3}(\.\d{3})+$/.test(s) ? s.replace(/\./g, "") : s;
  const n = Number(limpio);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Hasta qué día dura la temporada que cubre `desde`. */
function finDeVentana(t: Tarifa, desde: string): string | null {
  return ventanasDe(t).find(([a, b]) => (!a || a <= desde) && (!b || b >= desde))?.[1] ?? null;
}

/** Paquete que el propio tarifario declara para la pareja (Morichal:
 * `por_pareja` + `4_noches`). */
function totalPareja(t: Tarifa): Total | null {
  const p = t.precios ?? {};
  const pareja = Number(p["por_pareja"]);
  const clave = Object.keys(p).find((k) => /^\d{1,2}_noches$/.test(k));
  if (!clave || !Number.isFinite(pareja) || pareja <= 0) return null;
  return { total: pareja, noches: parseInt(clave, 10), viajeHasta: t.fecha_fin ?? null };
}

/** Sin base declarada, solo SGL distinto de DBL dice si la grilla es por
 * persona o por habitación. Con SGL = DBL, o sin SGL, el total puede salir al
 * doble (Terra Nostra, Lidotel): ese paquete no se arma. */
function baseClara(t: Tarifa): boolean {
  const p = t.precios ?? {};
  if (p["base"] === "habitacion" || p["base"] === "persona" || bloqueDe(t)?.base_precio) return true;
  const sgl = Number(p["sgl"] ?? p["sencilla"]);
  const dbl = Number(p["dbl"] ?? p["doble"]);
  return sgl > 0 && dbl > 0 && sgl !== dbl;
}

/** El motor de /cotizar (estimarEstadia) con 2 adultos en la primera fecha
 * vendible desde mañana: el mismo número que vería el cliente al cotizar. */
function totalCotizador(t: Tarifa, hoy: number): Total | null {
  if (!t.precios || !baseClara(t)) return null;
  let noches = Math.max(NOCHES_BASE, t.minimo_noches ?? 0);
  for (let d = 1; d <= DIAS_BUSQUEDA; d++) {
    const desde = iso(hoy + d * DIA);
    const e = estimarEstadia(t, [t], { desde, hasta: iso(hoy + (d + noches) * DIA), adultos: ADULTOS, edades: [], bebes: 0 });
    if (e.ok) return { total: e.total, noches, viajeHasta: finDeVentana(t, desde) };
    if (e.motivo === "minimo" && e.minimo && e.minimo > noches) {
      noches = e.minimo;
      d -= 1;
    } else if (e.motivo !== "sin-tarifa" && e.motivo !== "minimo") return null;
  }
  return null;
}

const SIN_PAREJA = /(m[ií]nimo|grupo)\s+(de\s+)?\d+\s+personas|grupo\s+m[ií]nimo/i;

/** Flyers sin grilla que dicen el precio en texto, solo en las dos formas que
 * no admiten otra lectura: "€286 por persona (paquete 3 días / 2 noches" y
 * "$65 por persona por noche". Grupos mínimos quedan fuera. */
function totalTexto(texto: string | null): Total | null {
  if (!texto || SIN_PAREJA.test(texto)) return null;
  const paquete = /^\s*(?:[$€]|USD|EUR)\s?([\d.,]+)\s+por persona\s*\(paquete\s+\d{1,2}\s*d[ií]­?as?\s*\/\s*(\d{1,2})\s*noches?/i.exec(texto);
  if (paquete) {
    const monto = montoTexto(paquete[1]);
    return monto ? { total: monto * ADULTOS, noches: Number(paquete[2]), viajeHasta: null } : null;
  }
  const noche = /^\s*(?:[$€]|USD|EUR)\s?([\d.,]+)\s+por persona (?:por|y|x) noche/i.exec(texto);
  if (!noche) return null;
  const monto = montoTexto(noche[1]);
  const minimo = Number(/m[ií]nimo\s+(\d{1,2})\s+noches/i.exec(texto)?.[1] ?? 0);
  const noches = Math.max(NOCHES_BASE, minimo);
  return monto ? { total: monto * ADULTOS * noches, noches, viajeHasta: null } : null;
}

function monedaDe(h: HotSale, t: Tarifa | undefined): "USD" | "EUR" {
  const m = String(t?.moneda || h.moneda || "").toUpperCase();
  return m === "EUR" || (!m && h.precio_texto?.includes("€")) ? "EUR" : "USD";
}

/** Hot Sales vigentes (mismo pool y orden que la pestaña del CRM) que se
 * pueden totalizar para 2 adultos, con el descuento del aliado encima. */
export async function getPaquetesAliado(aliado: Aliado, ahora = new Date()): Promise<PaqueteAliado[]> {
  const todas = await getHotSales();
  const pool = aliado.productos?.length
    ? todas.filter((h) => h.producto && aliado.productos!.includes(h.producto.id))
    : todas;
  if (!pool.length) return [];
  const { data, error } = await supabaseServer()
    .from("tarifas")
    .select(TARIFA_SELECT)
    .in("id", pool.map((h) => h.id));
  if (error) throw error;
  const tarifas = new Map(((data ?? []) as unknown as Tarifa[]).map((t) => [t.id, t]));
  const hoy = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate());
  const factor = (100 - aliado.descuento_pct) / 100;

  return pool.flatMap((h) => {
    const t = tarifas.get(h.id);
    const calc = (t && (totalPareja(t) ?? totalCotizador(t, hoy))) ?? totalTexto(h.precio_texto);
    if (!calc || !h.producto) return [];
    const propias = fotosDe(h.promocion_fotos);
    return [{
      id: h.id,
      hotel: h.producto.nombre,
      titulo: h.titulo,
      destino: h.producto.destino,
      plan: h.plan ?? null,
      fotos: propias.length ? propias : fotosDe(h.producto.producto_fotos),
      fotosReferenciales: propias.length ? esSoloReferencial(h.promocion_fotos) : esSoloReferencial(h.producto.producto_fotos),
      manual: h.manual,
      ninosGratis: h.nino_gratis?.cantidad ?? 0,
      adultos: ADULTOS,
      noches: calc.noches,
      moneda: monedaDe(h, t),
      total: redondear(calc.total),
      totalAliado: redondear(calc.total * factor),
      viajeHasta: calc.viajeHasta ?? h.fecha_fin_estimada,
      ventaHasta: h.fecha_venta_fin,
    }];
  });
}
