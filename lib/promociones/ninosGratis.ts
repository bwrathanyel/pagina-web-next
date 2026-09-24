import { montoConMoneda, montoDoble } from "@/lib/tarifas";
import { fotoDelAlojamiento } from "@/lib/promociones/fotosHero";
import type { HotSale, NinoGratis } from "@/types/supabase";

// Bloque "Niños gratis en Margarita" de la home (opción C aprobada por el
// dueño, 2026-09-24). El regalo lo lee tarifa_nino_gratis() del texto del PDF;
// acá solo se decide qué sigue vigente y cómo se muestra.

const hoyCaracas = (ahora: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Caracas" }).format(ahora);

/** El regalo vale hasta el día `hasta` inclusive (hora de Caracas). Sin fecha
 * lo acota la vigencia de la propia Hot Sale, que ya filtró la base. Se aplica
 * en getHotSales(), así ninguna tarjeta muestra un sello vencido. */
export function ninoGratisVigente(ng: NinoGratis | null, ahora = new Date()): NinoGratis | null {
  if (!ng || !(ng.cantidad > 0)) return null;
  return !ng.hasta || ng.hasta >= hoyCaracas(ahora) ? ng : null;
}

export interface HotelNinoGratis {
  id: number;
  hotel: string;
  plan: string | null;
  foto: string | null;
  href: string;
  /** Doble por adulto y noche, ya formateado; null si la fila no trae grilla. */
  precio: string | null;
  hasta: string | null;
  /** Días que quedan para viajar con el regalo (0 = hoy es el último). */
  dias: number | null;
}

export interface BloqueNinosGratis {
  hoteles: HotelNinoGratis[];
  /** El piso de los `precio` de arriba, en una sola moneda. */
  desde: string | null;
  cantidad: number;
  edades: string | null;
}

const DIA = 864e5;
export const diaMes = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Hoteles con niño gratis vigente en un destino, el que vence primero
 * adelante: es el que se lleva la tarjeta grande y la cuenta regresiva. Al
 * vencer los Hesperia (15/10) el bloque degrada solo a lo que quede, y sin
 * ninguno devuelve null y la home no lo monta. Espera el pool ya pasado por
 * soloDestinosHome (destino canónico) y por getHotSales (regalo vigente). */
export function ninosGratisEn(pool: HotSale[], destino: string, ahora = new Date()): BloqueNinosGratis | null {
  const hoy = Date.parse(hoyCaracas(ahora));
  const vistos = new Set<number>();
  const filas: { h: HotelNinoGratis; ng: NinoGratis; monto: number | null; moneda: string }[] = [];

  for (const p of pool) {
    const ng = p.nino_gratis;
    if (!ng || !p.producto || p.producto.destino !== destino || vistos.has(p.producto.id)) continue;
    vistos.add(p.producto.id);
    const monto = montoDoble(p.precios);
    const moneda = String(p.moneda || "USD").toUpperCase() === "EUR" ? "EUR" : "USD";
    filas.push({
      ng,
      monto,
      moneda,
      h: {
        id: p.id,
        hotel: p.producto.nombre,
        plan: p.plan?.trim() || null,
        foto: fotoDelAlojamiento(p) ?? null,
        href: `/producto/${p.producto.id}`,
        precio: monto === null ? null : montoConMoneda(monto, moneda),
        hasta: ng.hasta,
        dias: ng.hasta ? Math.max(0, Math.round((Date.parse(ng.hasta) - hoy) / DIA)) : null,
      },
    });
  }
  if (filas.length === 0) return null;

  filas.sort((a, b) => (a.h.hasta ?? "9999").localeCompare(b.h.hasta ?? "9999"));

  // Mismo criterio que destinosConOfertas: un "desde" nunca mezcla monedas, y
  // se prefiere el piso en dólares.
  const piso = (moneda: string) =>
    Math.min(...filas.filter((f) => f.moneda === moneda && f.monto !== null).map((f) => f.monto as number));
  const usd = piso("USD");
  const eur = piso("EUR");
  const desde = Number.isFinite(usd) ? montoConMoneda(usd, "USD") : Number.isFinite(eur) ? montoConMoneda(eur, "EUR") : null;

  // El titular promete lo que cumplen TODOS: la menor cantidad, y las edades
  // solo si coinciden en todos los hoteles.
  const edades = new Set(filas.map((f) => f.ng.edades?.trim().replace(/\s*-\s*/, " a ") || ""));
  return {
    hoteles: filas.map((f) => f.h),
    desde,
    cantidad: Math.min(...filas.map((f) => f.ng.cantidad)),
    edades: edades.size === 1 ? [...edades][0] || null : null,
  };
}
