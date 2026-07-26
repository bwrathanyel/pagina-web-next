import { ordenarFotos, fotoUrl } from "@/lib/supabase/fotos";
import type { Foto, Promocion } from "@/types/supabase";

export interface FotoHero {
  url: string;
  /** Nombre del alojamiento -- se muestra en pantalla bajo la foto. */
  alt: string;
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

/** Fotos para el hero de la home, sacadas de las Hot Sales vigentes.
 *
 * Prioriza la foto del ALOJAMIENTO sobre la de la promoción: las de la promo
 * suelen ser el flyer de la oferta, las del hotel son fotos reales de la
 * propiedad. Devuelve una sola foto por alojamiento para que la rotación no
 * repita el mismo lugar dos veces seguidas. */
export function fotosHeroDeHotSales(hotSales: Promocion[], limite = 8): FotoHero[] {
  const vistos = new Set<string>();
  const out: FotoHero[] = [];

  for (const p of hotSales) {
    // Sin alojamiento asociado no hay nombre de lugar que mostrar, y caer al
    // título de la promo pone algo como "Promoción 2x1 en Hospedaje (Temporada
    // Baja)" de epígrafe -- que no es el nombre de ningún hotel. Se saltea.
    const nombre = p.producto?.nombre;
    if (!nombre || vistos.has(nombre)) continue;

    const candidatas = [
      ...ordenarFotos(p.producto?.producto_fotos),
      ...ordenarFotos(p.promocion_fotos),
    ].filter(esFotoDeLugar);

    const elegida = candidatas[0];
    if (!elegida) continue;

    vistos.add(nombre);
    out.push({ url: fotoUrl(elegida.storage_path), alt: nombre });
    if (out.length >= limite) break;
  }

  return out;
}
