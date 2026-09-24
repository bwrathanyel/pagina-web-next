import { ordenarFotos, fotoUrl } from "@/lib/supabase/fotos";
import { precioTarjeta } from "@/lib/tarifas";
import type { Foto, Promocion } from "@/types/supabase";

/** La promo que acompaña a la foto: el "pase destacado" del hero. */
export interface PaseHero {
  promoId: number;
  href: string;
  hotel: string;
  plan: string | null;
  precio: ReturnType<typeof precioTarjeta>;
  /** "hasta 30 nov" (fin de venta) o el texto de vigencia del tarifario. */
  vigencia: string | null;
  incluye: string[];
}

export interface FotoHero {
  url: string;
  /** Qué muestra la foto: el lugar si es foto de destino, si no el nombre del
   * alojamiento (este último se ve en pantalla bajo el tablero cuando no hay pase). */
  alt: string;
  /** Destino del alojamiento: es lo que cae en el tablero de salidas del hero. */
  destino?: string | null;
  pase?: PaseHero;
}

const FECHA_PASE = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" });

// Fin de VENTA, no de disfrute: es hasta cuándo se puede comprar la promo
// (fecha_fin_estimada guarda el fin del disfrute y NULL no significa eterna).
function vigenciaDe(p: Promocion): string | null {
  if (p.fecha_venta_fin) {
    const fecha = new Date(`${p.fecha_venta_fin}T00:00:00Z`);
    if (!Number.isNaN(fecha.getTime())) return `hasta ${FECHA_PASE.format(fecha).replace(".", "")}`;
  }
  // Sin fecha de venta, el texto libre solo si trae una fecha: "Sujeto a
  // disponibilidad" no es una vigencia y en el talón se lee como ruido.
  const texto = p.vigencia_texto?.trim();
  return texto && /\d/.test(texto) ? texto : null;
}

function paseDe(p: Promocion, hotel: string): PaseHero | undefined {
  if (!p.producto) return undefined;
  return {
    promoId: p.id,
    href: `/producto/${p.producto.id}`,
    hotel,
    plan: p.plan?.trim() || null,
    precio: precioTarjeta(p),
    vigencia: vigenciaDe(p),
    incluye: (p.incluye_tags ?? []).filter(Boolean).slice(0, 3),
  };
}

/** Palabras que aparecen en el nombre de archivo de los FLYERS y collages
 * promocionales cargados desde Drive ("00-caption-1.jpg", "drive-01-Extras.png").
 * Esas piezas son gráficas de marketing con texto encima: recortadas en el
 * círculo del hero se ven como un collage ilegible (pasó de verdad, 2026-07-26).
 * El hero quiere fotos del lugar, no piezas de diseño. */
const PATRON_FLYER = /(caption|extras|flyer|arte|promo[-_]?\d|banner|post)/i;

function esFotoDeLugar(f: Foto): boolean {
  if (f.origen === "ia_referencial") return false; // placeholder, no es el lugar real
  if (PATRON_FLYER.test(f.storage_path)) return false;
  // Fotos muy chicas se ven pixeladas a tamaño hero. Si no hay metadata de
  // tamaño se acepta -- no se descarta por falta de dato.
  if (typeof f.width === "number" && f.width > 0 && f.width < 700) return false;
  return true;
}

/** Foto del DESTINO para el hero (pedido del dueño, 2026-09-24: el hero vende
 * el lugar; el hotel ya lo vende el pase). Elegidas a mano entre las fotos que
 * ya están en el bucket: la más espectacular de cada destino, no la de mayor
 * resolución -- casi todas rondan 1000-1300 px de ancho y no hay más grandes
 * del lugar en sí (las de 2000 px son habitaciones).
 *
 * Son fotos de la galería de algún alojamiento: si una se borra o se
 * desactiva en el CRM, hay que sacarla de acá, porque el Worker da 404 y el
 * hero mostraría un hueco. Destino sin entrada = foto del hotel, como antes.
 * Clave: el destino del producto normalizado con `claveDestino`. */
const FOTOS_DESTINO: Record<string, { path: string; alt: string }> = {
  canaima: { path: "hoteles/323/03-your-included-to-the.jpg", alt: "Salto Ángel entre las nubes, Canaima" },
  "los roques": {
    path: "hoteles/294/02-los-roques2-1920w.webp",
    alt: "Vista aérea del archipiélago de Los Roques",
  },
  margarita: { path: "hoteles/9/01-paradise-surf-2.jpg", alt: "Costa de la Isla de Margarita vista desde el aire" },
  merida: {
    path: "hoteles/319/manual-1784352668763-merida.jpg",
    alt: "Laguna y picos nevados de la Sierra Nevada de Mérida",
  },
  coche: { path: "hoteles/14/05-welcome-again-to-coche.jpg", alt: "Playa de la Isla de Coche vista desde el aire" },
  "la tortuga": { path: "hoteles/32/00-127983425-cayoherradura.jpg", alt: "Cayo Herradura, Isla La Tortuga" },
  "delta amacuro": { path: "hoteles/29/03-vj3.jpg", alt: "Palafitos a orillas de un caño del Delta del Orinoco" },
};

const claveDestino = (d: string) =>
  d.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Fotos para el hero de la home, sacadas de las Hot Sales vigentes.
 *
 * Una entrada por DESTINO con oferta: la foto del lugar (FOTOS_DESTINO) y, de
 * pase, su promo mejor rankeada (`hotSales` ya viene por ranking, así que es
 * la primera que aparece). Si el destino no tiene foto elegida, cae a la del
 * alojamiento, que se prefiere a la de la promoción: las de la promo suelen
 * ser el flyer de la oferta. Sin destino cargado, una por alojamiento. */
export function fotosHeroDeHotSales(hotSales: Promocion[], limite = 8): FotoHero[] {
  const vistos = new Set<string>();
  const out: FotoHero[] = [];

  for (const p of hotSales) {
    // Sin alojamiento asociado no hay nombre de lugar que mostrar, y caer al
    // título de la promo pone algo como "Promoción 2x1 en Hospedaje (Temporada
    // Baja)" de epígrafe -- que no es el nombre de ningún hotel. Se saltea.
    const nombre = p.producto?.nombre;
    if (!nombre) continue;
    const destino = p.producto?.destino?.trim() || null;
    const llave = destino ? `destino:${claveDestino(destino)}` : `hotel:${nombre}`;
    if (vistos.has(llave)) continue;

    const delDestino = destino ? FOTOS_DESTINO[claveDestino(destino)] : undefined;
    const delHotel = delDestino
      ? undefined
      : [...ordenarFotos(p.producto?.producto_fotos), ...ordenarFotos(p.promocion_fotos)].find(esFotoDeLugar);
    const path = delDestino?.path ?? delHotel?.storage_path;
    if (!path) continue;

    vistos.add(llave);
    out.push({ url: fotoUrl(path), alt: delDestino?.alt ?? nombre, destino, pase: paseDe(p, nombre) });
    if (out.length >= limite) break;
  }

  return out;
}
