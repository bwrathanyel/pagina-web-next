import { ordenarFotos, fotoUrl } from "@/lib/supabase/fotos";
import { precioTarjeta } from "@/lib/tarifas";
import { DESTINOS_TODO_INCLUIDO, esTodoIncluido, prioridadOferta, tieneNinoGratis } from "@/lib/promociones/hotSales";
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

export interface FondoHero {
  url: string;
  alt: string;
}

export interface FotoHero {
  url: string;
  /** Qué muestra la foto: el lugar si es foto de destino, si no el nombre del
   * alojamiento (este último se ve en pantalla bajo el tablero cuando no hay pase). */
  alt: string;
  /** Solo destinos con foto propia: todas sus fotos, empezando por `url`. El
   * hero usa la siguiente en cada vuelta de la rotación. */
  fondos?: FondoHero[];
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
 * El comentario de cada una es su id de Pexels, para rehacer los derivados;
 * las verticales se recortaron a 4:3 para no mandarle 2560x3840 al escritorio.
 *
 * Varias por destino (pedido del dueño, 2026-09-25): en cada vuelta de la
 * rotación el destino entra con la siguiente, así la home abierta va
 * cambiando. Canaima tiene una sola porque Pexels no tiene otra del parque, y
 * Los Roques tres por lo mismo: el resto se le pide a marketing en 2500 px o
 * más. Coche, La Tortuga y Delta Amacuro tuvieron una foto del bucket (commit
 * 30351a6) y salieron: medían 1000-1300 px y se veían blandas.
 * Clave: el destino del producto normalizado con `claveDestino`. */
const FOTOS_DESTINO: Record<string, { archivo: string; alt: string }[]> = {
  canaima: [
    { archivo: "canaima", alt: "Cascada y tepuy en el Parque Nacional Canaima" }, // 7360544
  ],
  "los roques": [
    { archivo: "los-roques", alt: "Aguas turquesa frente a un cayo de Los Roques" }, // 30587633
    { archivo: "los-roques-orilla", alt: "Orilla de arena blanca y agua turquesa en Los Roques" }, // 31871910
    { archivo: "los-roques-gran-roque", alt: "El Gran Roque visto desde el mar" }, // 16230240
  ],
  margarita: [
    { archivo: "margarita", alt: "Bahía de Pampatar, Isla de Margarita" }, // 26241556
    { archivo: "margarita-laguna", alt: "Laguna y montañas de la Isla de Margarita" }, // 32690921
    { archivo: "margarita-playa", alt: "Playa larga entre el mar y la laguna en Margarita" }, // 32699741
    { archivo: "margarita-pescadores", alt: "Peñeros en una bahía de Margarita" }, // 26241551
    { archivo: "margarita-costa", alt: "Playa de aguas tranquilas en Nueva Esparta" }, // 32699665
  ],
  merida: [
    { archivo: "merida", alt: "Valle entre montañas en Mérida" }, // 19199162
    { archivo: "merida-valle", alt: "Pueblos en el valle andino de Mérida" }, // 19199169
    { archivo: "merida-iglesia", alt: "Torre neogótica de una iglesia en Mérida" }, // 14055474
    { archivo: "merida-campanario", alt: "Campanario colonial en Mérida" }, // 14094180
  ],
  caracas: [
    { archivo: "caracas", alt: "Caracas con El Ávila al fondo" }, // 38556235
    { archivo: "caracas-noche", alt: "Caracas de noche al pie de El Ávila" }, // 4148187
    { archivo: "caracas-torres", alt: "Torres de Parque Central de noche en Caracas" }, // 39648321
    { archivo: "caracas-panorama", alt: "Valle de Caracas con El Ávila entre nubes" }, // 20733321
    { archivo: "caracas-atardecer", alt: "Caracas al atardecer frente a El Ávila" }, // 14377784
  ],
};

/** Las fotos del destino empezando por la n-ésima: cada entrada de un mismo
 * destino (Margarita tiene varias) arranca en otra, así en una misma vuelta
 * no se repite el fondo. */
function fondosDesde(fotos: { archivo: string; alt: string }[], n: number): FondoHero[] {
  return fotos.map((_, k) => {
    const f = fotos[(n + k) % fotos.length];
    return { url: `/destinos/${f.archivo}.jpg`, alt: f.alt };
  });
}

/** Foto del alojamiento, no del flyer: primero las del hotel, después las de
 * la promo, siempre que muestren el lugar. */
export function fotoDelAlojamiento(p: Promocion): string | undefined {
  const foto = [...ordenarFotos(p.producto?.producto_fotos), ...ordenarFotos(p.promocion_fotos)].find(esFotoDeLugar);
  return foto ? fotoUrl(foto.storage_path) : undefined;
}

const claveDestino = (d: string) =>
  d.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");

/** Cuántas ofertas rotan por destino en el hero. Margarita se vende por sus
 * todo incluido y sus niños gratis (pedido del dueño, 2026-09-25): rota entre
 * varios hoteles, cada uno con otra foto del lugar (`fondosDesde`). */
const PASES_POR_DESTINO: Record<string, number> = { margarita: 4 };

/** Fotos para el hero de la home, sacadas de las Hot Sales vigentes.
 *
 * Una entrada por DESTINO con oferta (Margarita, varias: PASES_POR_DESTINO) y,
 * de pase, sus ofertas por `prioridadOferta` (niños gratis, todo incluido, el
 * resto, y al final solo desayuno), a igual prioridad por ranking. En Margarita
 * los planes de solo desayuno no entran si hay todo incluido o niños gratis.
 * Rotan solo los destinos con foto propia (FOTOS_DESTINO), con la foto del
 * alojamiento dentro del pase. Si ningún destino con oferta tiene foto, el
 * respaldo es la foto del alojamiento de fondo, que se prefiere a la de la
 * promoción porque esas suelen ser el flyer. Sin destino cargado, una por
 * alojamiento. */
export function fotosHeroDeHotSales(
  hotSales: (Promocion & { nino_gratis?: { cantidad: number } | null })[],
  limite = 10,
): FotoHero[] {
  const grupos = new Map<string, typeof hotSales>();
  for (const p of hotSales) {
    // Sin alojamiento asociado no hay nombre de lugar que mostrar, y caer al
    // título de la promo pone algo como "Promoción 2x1 en Hospedaje (Temporada
    // Baja)" de epígrafe -- que no es el nombre de ningún hotel. Se saltea.
    const nombre = p.producto?.nombre;
    if (!nombre) continue;
    const destino = p.producto?.destino?.trim();
    const llave = destino ? `destino:${claveDestino(destino)}` : `hotel:${nombre}`;
    grupos.set(llave, [...(grupos.get(llave) ?? []), p]);
  }

  const deDestino: FotoHero[] = [];
  const respaldo: FotoHero[] = [];

  for (const items of grupos.values()) {
    const destino = items[0].producto?.destino?.trim() || null;
    const clave = destino ? claveDestino(destino) : "";
    const ordenadas = [...items].sort((a, b) => prioridadOferta(a) - prioridadOferta(b));
    const delDestino = destino ? FOTOS_DESTINO[clave] : undefined;

    if (delDestino) {
      const vendedoras = DESTINOS_TODO_INCLUIDO.has(clave)
        ? ordenadas.filter((p) => tieneNinoGratis(p) || esTodoIncluido(p))
        : [];
      const hoteles = new Set<string>();
      for (const p of vendedoras.length > 0 ? vendedoras : ordenadas) {
        if (hoteles.size >= (PASES_POR_DESTINO[clave] ?? 1) || deDestino.length >= limite) break;
        const nombre = p.producto!.nombre;
        if (hoteles.has(nombre)) continue;
        const fondos = fondosDesde(delDestino, hoteles.size);
        hoteles.add(nombre);
        deDestino.push({
          ...fondos[0],
          fondos,
          destino,
          pase: paseDe(p, nombre, fotoDelAlojamiento(p)),
        });
      }
    } else if (respaldo.length < limite) {
      const p = ordenadas.find((o) => fotoDelAlojamiento(o));
      const fotoHotel = p ? fotoDelAlojamiento(p) : undefined;
      if (p && fotoHotel) {
        const nombre = p.producto!.nombre;
        respaldo.push({ url: fotoHotel, alt: nombre, destino, pase: paseDe(p, nombre) });
      }
    }
  }

  return deDestino.length > 0 ? deDestino : respaldo;
}
