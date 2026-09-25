import { fotosDe } from "@/lib/supabase/fotos";
import { agruparPorDestino } from "@/lib/supabase/agruparPorDestino";
import { formatearPrecioDesde } from "@/lib/utils/formatoPrecio";
import type { HotSale, Promocion } from "@/types/supabase";

// Mismo fallback que PromocionCard: fotos propias, y solo si no tiene
// ninguna, las del hotel.
export function fotosDeLaPromo(p: Promocion): string[] {
  const propias = fotosDe(p.promocion_fotos);
  return propias.length > 0 ? propias : fotosDe(p.producto?.producto_fotos);
}

// Qué entra en Hot Sales ya no se decide acá: lo decide hot_sales_publicas()
// en la base, la misma lista que la pestaña del CRM (ver getHotSales()).

// La home muestra solo estos 5 destinos (pedido del dueño, 2026-09-24);
// /catalogo/hot-sales conserva el resto. En la base el mismo lugar aparece con
// más de un nombre, así que se compara sin acentos ni mayúsculas y se reescribe
// al nombre canónico: si no, los chips mostrarían "Margarita" dos veces.
export const DESTINOS_HOME = ["Margarita", "Los Roques", "Canaima", "Chichiriviche", "Mérida"] as const;
const ALIAS_DESTINO: Record<string, string> = { "isla margarita": "Margarita" };
const clave = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase();
const CANONICO = new Map<string, string>([
  ...DESTINOS_HOME.map((d) => [clave(d), d] as [string, string]),
  ...Object.entries(ALIAS_DESTINO),
]);

export function soloDestinosHome<T extends Promocion>(pool: T[]): T[] {
  return pool.flatMap((p) => {
    const destino = p.producto?.destino && CANONICO.get(clave(p.producto.destino));
    return destino ? [{ ...p, producto: { ...p.producto!, destino } }] : [];
  });
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
export function ordenDelDia(pool: HotSale[], ahora = new Date()): HotSale[] {
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
  const manuales = pool.filter((p) => p.manual);
  const resto = pool.filter((p) => !p.manual);
  for (let i = resto.length - 1; i > 0; i--) {
    const j = Math.floor(azar() * (i + 1));
    [resto[i], resto[j]] = [resto[j], resto[i]];
  }
  return [...manuales, ...resto];
}

export type DestinoConOfertas = {
  destino: string;
  ofertas: number;
  foto: string;
  desde: string | null;
  /** Qué plan cubre el piso cuando no es el de cualquier oferta ("todo incluido"). */
  nota?: string;
};

type ConNinoGratis = Promocion & { nino_gratis?: { cantidad: number } | null };

const normalizar = (s: string | null | undefined) =>
  (s ?? "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

export const esTodoIncluido = (p: Promocion) =>
  /todo incluido|all inclusive/.test(normalizar(`${p.plan} ${p.titulo}`));

export const tieneNinoGratis = (p: ConNinoGratis) =>
  (p.nino_gratis?.cantidad ?? 0) > 0 || (p.ninos_gratis_cantidad ?? 0) > 0;

const esPlanBasico = (p: Promocion) => /desayuno|solo alojamiento/.test(normalizar(p.plan));

/** Qué oferta se muestra primero de un destino (pedido del dueño, 2026-09-25):
 * niños gratis, después todo incluido, después el resto, y al final los planes
 * de solo desayuno o solo alojamiento. A igual prioridad manda el ranking. */
export const prioridadOferta = (p: ConNinoGratis) =>
  tieneNinoGratis(p) ? 0 : esTodoIncluido(p) ? 1 : esPlanBasico(p) ? 3 : 2;

/** Destinos que se venden por el todo incluido: su piso de precio es el del
 * todo incluido más barato, no el de una habitación con desayuno. */
export const DESTINOS_TODO_INCLUIDO = new Set(["margarita"]);

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
    const todoIncluido = DESTINOS_TODO_INCLUIDO.has(normalizar(destino).trim()) ? items.filter(esTodoIncluido) : [];
    const base = todoIncluido.length > 0 ? todoIncluido : items;
    const pisos = { $: Infinity, "€": Infinity };
    for (const p of base) {
      if (typeof p.precio_desde_usd !== "number" || !Number.isFinite(p.precio_desde_usd)) continue;
      const simbolo = p.precio_texto?.includes("€") ? "€" : "$";
      pisos[simbolo] = Math.min(pisos[simbolo], p.precio_desde_usd);
    }
    const desde = Number.isFinite(pisos.$)
      ? formatearPrecioDesde(pisos.$, null)
      : Number.isFinite(pisos["€"])
        ? formatearPrecioDesde(pisos["€"], "€")
        : null;
    resultado.push({ destino, ofertas: items.length, foto, desde, nota: todoIncluido.length > 0 ? "todo incluido" : undefined });
  }
  // Más ofertas primero; a igual cantidad queda el orden alfabético del grupo.
  return resultado.sort((a, b) => b.ofertas - a.ofertas);
}
