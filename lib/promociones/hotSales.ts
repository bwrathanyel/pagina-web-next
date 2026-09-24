import { fotosDe } from "@/lib/supabase/fotos";
import { agruparPorDestino } from "@/lib/supabase/agruparPorDestino";
import { formatearPrecioDesde } from "@/lib/utils/formatoPrecio";
import type { Promocion } from "@/types/supabase";

// Mismo fallback que PromocionCard: fotos propias, y solo si no tiene
// ninguna, las del hotel.
export function fotosDeLaPromo(p: Promocion): string[] {
  const propias = fotosDe(p.promocion_fotos);
  return propias.length > 0 ? propias : fotosDe(p.producto?.producto_fotos);
}

// Vigencia: hasta ahora la web NO la filtraba (ver plan Hot Sales manual) y una
// promo vencida aparecía hundida con score 0 pero aparecía. Vigente = ninguna de
// sus dos fechas de fin ya pasó. Fechas 'YYYY-MM-DD' (columnas date de Postgres),
// comparables como string contra la fecha de hoy en ISO.
export function promoVigente(p: Promocion): boolean {
  const hoy = new Date().toISOString().slice(0, 10);
  if (p.fecha_venta_fin && p.fecha_venta_fin < hoy) return false;
  if (p.fecha_fin_estimada && p.fecha_fin_estimada < hoy) return false;
  return true;
}

// El pool de Hot Sales sale en dos bloques:
//  1. Manuales: el dueño las forzó desde el CRM (hot_sale_estado === 'poner').
//     Van primero, en el orden que él fijó (hot_sale_orden), sin dedup por hotel
//     y sin mínimo de fotos -- el RPC catalogo_hot_sale_marcar ya garantizó >=1
//     foto al ponerlas. Solo se exige que sigan vigentes: una promo que vence
//     estando forzada cae sola del pool.
//  2. Automáticas: las decide el ranking. Se descartan las excluidas a mano
//     ('quitar') y las no vigentes, se exigen >=2 fotos, y se dedup-ea por hotel
//     -- el array ya viene ordenado por score desc (getPromociones()), así que
//     "la primera de cada hotel" es la de mejor rendimiento. El Set de vistos
//     arranca sembrado con los hoteles del bloque manual: si no, un hotel
//     forzado volvería a entrar por la puerta automática.
export function promosHotSales(promociones: Promocion[]): Promocion[] {
  const vistos = new Set<number | string>();
  const resultado: Promocion[] = [];
  const claveHotel = (p: Promocion) => (p.producto ? p.producto.id : `promo:${p.id}`);

  const manuales = promociones
    .filter((p) => p.hot_sale_estado === "poner" && promoVigente(p))
    .sort((a, b) => (a.hot_sale_orden ?? 1e9) - (b.hot_sale_orden ?? 1e9));
  for (const p of manuales) {
    vistos.add(claveHotel(p));
    resultado.push(p);
  }

  for (const p of promociones) {
    if (p.hot_sale_estado === "poner" || p.hot_sale_estado === "quitar") continue;
    if (!promoVigente(p)) continue;
    const clave = claveHotel(p);
    if (vistos.has(clave)) continue;
    if (fotosDeLaPromo(p).length < 2) continue;
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

// Orden de Hot Sales en la home (plan 2026-09-24): las manuales quedan arriba
// en el orden que fijó el dueño y el resto rota una vez por día, con la fecha
// de Caracas como semilla. Se calcula en el servidor: antes el cliente
// barajaba después de hidratar y la grilla saltaba en cada carga.
export function ordenDelDia(pool: Promocion[], ahora = new Date()): Promocion[] {
  const dia = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(ahora);
  let semilla = 0;
  for (const c of dia) semilla = (Math.imul(semilla, 31) + c.charCodeAt(0)) | 0;
  // mulberry32: alcanza para barajar y da lo mismo en cada render del día.
  const azar = () => {
    semilla = (semilla + 0x6d2b79f5) | 0;
    let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const manuales = pool.filter((p) => p.hot_sale_estado === "poner");
  const resto = pool.filter((p) => p.hot_sale_estado !== "poner");
  for (let i = resto.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [resto[i], resto[j]] = [resto[j], resto[i]];
  }
  return [...manuales, ...resto];
}

export type DestinoConOfertas = { destino: string; ofertas: number; foto: string; desde: string | null };

// Tiras de destino de la home: cuántas Hot Sales hay en cada uno, la foto de
// la mejor rankeada (el pool llega por score) y el piso de precio. El piso
// solo compara montos de la misma moneda: `precio_desde_usd` a veces es EUR
// (ver formatearPrecioDesde), y un "desde" que mezcla monedas mentiría. Se
// prefiere el piso en dólares; si el destino no tiene ninguno, el de euros.
export function destinosConOfertas(pool: Promocion[]): DestinoConOfertas[] {
  const conDestino = pool.filter((p) => p.producto?.destino);
  const grupos = agruparPorDestino(conDestino, (p) => p.producto!.destino);
  const resultado: DestinoConOfertas[] = [];
  for (const { destino, items } of grupos) {
    const foto = items.map((p) => fotosDeLaPromo(p)[0]).find(Boolean);
    if (!foto) continue;
    const pisos = { $: Infinity, "€": Infinity };
    for (const p of items) {
      if (typeof p.precio_desde_usd !== "number" || !Number.isFinite(p.precio_desde_usd)) continue;
      const simbolo = p.precio_texto?.includes("€") ? "€" : "$";
      pisos[simbolo] = Math.min(pisos[simbolo], p.precio_desde_usd);
    }
    const desde = Number.isFinite(pisos.$)
      ? formatearPrecioDesde(pisos.$, null)
      : Number.isFinite(pisos["€"])
        ? formatearPrecioDesde(pisos["€"], "€")
        : null;
    resultado.push({ destino, ofertas: items.length, foto, desde });
  }
  // Más ofertas primero; a igual cantidad queda el orden alfabético del grupo.
  return resultado.sort((a, b) => b.ofertas - a.ofertas);
}
