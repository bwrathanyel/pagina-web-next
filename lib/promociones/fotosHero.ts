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
  /** Foto del alojamiento, solo cuando el fondo es la foto del destino: el
   * hero arma el collage lugar + hospedaje. Con la foto del hotel de fondo
   * repetirla en el pase sobraría. */
  foto?: string;
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

function paseDe(p: Promocion, hotel: string, foto?: string): PaseHero | undefined {
  if (!p.producto) return undefined;
  return {
    foto,
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
 * el lugar y el pase, el hotel). Son de Pexels: licencia de uso comercial sin
 * atribución, y ninguna con personas reconocibles (regla del dueño). Viven en
 * `public/destinos/<archivo>-<ancho>.jpg` (ver `imageLoader`) porque a
 * pantalla completa piden 2560 px y el Worker de fotos no pasa de 2048.
 * El comentario de cada una es su id de Pexels, para rehacer los derivados.
 *
 * Coche, La Tortuga y Delta Amacuro tuvieron una foto del bucket (commit
 * 30351a6) y salieron: medían 1000-1300 px y se veían blandas. Vuelven cuando
 * haya una de 2500 px o más; hasta entonces no entran a la rotación.
 * Clave: el destino del producto normalizado con `claveDestino`. */
const FOTOS_DESTINO: Record<string, { archivo: string; alt: string }> = {
  canaima: { archivo: "canaima", alt: "Cascada y tepuy en el Parque Nacional Canaima" }, // 7360544
  "los roques": { archivo: "los-roques", alt: "Aguas turquesa frente a un cayo de Los Roques" }, // 30587633
  margarita: { archivo: "margarita", alt: "Bahía de Pampatar, Isla de Margarita" }, // 26241556
  merida: { archivo: "merida", alt: "Valle entre montañas en Mérida" }, // 19199162
  caracas: { archivo: "caracas", alt: "Caracas con El Ávila al fondo" }, // 38556235
};

/** Foto del alojamiento, no del flyer: primero las del hotel, después las de
 * la promo, siempre que muestren el lugar. */
export function fotoDelAlojamiento(p: Promocion): string | undefined {
  const foto = [...ordenarFotos(p.producto?.producto_fotos), ...ordenarFotos(p.promocion_fotos)].find(esFotoDeLugar);
  return foto ? fotoUrl(foto.storage_path) : undefined;
}

const claveDestino = (d: string) =>
  d.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Fotos para el hero de la home, sacadas de las Hot Sales vigentes.
 *
 * Una entrada por DESTINO con oferta y, de pase, su promo mejor rankeada
 * (`hotSales` ya viene por ranking, así que es la primera que aparece). Rotan
 * solo los destinos con foto propia (FOTOS_DESTINO), con la foto del
 * alojamiento dentro del pase. Si ningún destino con oferta tiene foto, el
 * respaldo es el de antes: la foto del alojamiento de fondo, que se prefiere a
 * la de la promoción porque esas suelen ser el flyer. Sin destino cargado,
 * una por alojamiento. */
export function fotosHeroDeHotSales(hotSales: Promocion[], limite = 8): FotoHero[] {
  const vistos = new Set<string>();
  const deDestino: FotoHero[] = [];
  const respaldo: FotoHero[] = [];

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
    const fotoHotel = fotoDelAlojamiento(p);

    if (delDestino) {
      vistos.add(llave);
      if (deDestino.length < limite) {
        deDestino.push({
          url: `/destinos/${delDestino.archivo}.jpg`,
          alt: delDestino.alt,
          destino,
          pase: paseDe(p, nombre, fotoHotel),
        });
      }
    } else if (fotoHotel) {
      vistos.add(llave);
      if (respaldo.length < limite) respaldo.push({ url: fotoHotel, alt: nombre, destino, pase: paseDe(p, nombre) });
    }
  }

  return deDestino.length > 0 ? deDestino : respaldo;
}
