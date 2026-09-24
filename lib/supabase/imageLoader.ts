const OBJECT_PREFIX = "/storage/v1/object/public/";

/** Las miniaturas se sirven desde un Worker propio respaldado por R2, no desde
 * Supabase: R2 no cobra egress, así que cada foto sale de Supabase una sola vez
 * y después es gratis para siempre. Ver `CRM/workers/fotos/`. */
const CDN_FOTOS = "https://fotos.destinoyeventoslotus360.com/";

/** Anchos de las miniaturas pregeneradas, que viven en el bucket bajo
 * `_d/<ancho>/<ruta_original>.jpg`. Existen SIEMPRE para toda foto (los genera
 * `CRM/scripts/generar_derivados_fotos.py`), así que la URL se arma por
 * convención pura, sin consultar si el archivo está.
 *
 * 2048 es en la práctica "resolución original" (mediana de los originales:
 * 1000 px de ancho) recomprimida a q86 en vez de q78. */
export type AnchoDerivado = 256 | 384 | 640 | 1280 | 2048;

/** Las miniaturas se sirven con `max-age=31536000, immutable`, así que cambiar el
 * archivo en el origen NO alcanza: el navegador que ya lo tiene no vuelve a
 * pedirlo en un año, ni siquiera para revalidar. La única forma de forzar la
 * bajada es cambiar la URL.
 *
 * Subir este número cuando cambie el CONTENIDO de las fotos sin cambiar su ruta.
 * v=2: 2026-07-31, se devolvieron 504 fotos a su versión sin el relleno
 * espejado. La query no toca la clave de R2 -- el Worker solo mira el pathname
 * -- así que no invalida la caché del servidor.
 *
 * Tiene que coincidir con FOTOS_VERSION de `lotus-crm-preview/app.js`: si no,
 * el CRM y la web bajan dos copias de la misma imagen. */
const FOTOS_VERSION = "?v=2";

/** next/image pide `slot_css * densidad_de_pantalla`; se sirve el derivado más
 * chico que lo cubra. Una card de 390 css a 3x pide 1170 y recibe 1280; un
 * hero o galería de escritorio pide 1440+ y recibe 2048.
 *
 * Hasta el 2026-09-23 esto iba por rangos que le daban 640 a esa misma card
 * (~1.6x de densidad efectiva) para ahorrar datos: se veía blando. El dueño
 * priorizó nitidez aunque recorrer el catálogo desde el celular pese ~2x. Los
 * bytes salen de R2, no de Supabase: no le cuestan nada a Lotus. */
function anchoDerivado(pedido: number): AnchoDerivado {
  if (pedido <= 256) return 256;
  if (pedido <= 384) return 384;
  if (pedido <= 640) return 640;
  if (pedido <= 1280) return 1280;
  return 2048;
}

/** Reescribe una URL del bucket a su miniatura pregenerada del ancho más chico
 * que cubra `width`. Lo que no sea del bucket (assets locales de /public) pasa
 * sin tocar.
 *
 * Antes esto apuntaba al endpoint de transformación on-demand de Supabase
 * (`/storage/v1/render/image/`), pero ese es de plan Pro ("Image Resizing is
 * currently enabled for Pro Plan and above") y el proyecto estaba en Free. Ya
 * en Pro (sep-2026) tampoco conviene: incluye 100 imágenes origen por mes y el
 * catálogo pasa de 1.000. Las miniaturas pregeneradas son objetos normales del bucket,
 * no dependen de ninguna función de pago, y además pesan ~11x menos que el
 * original -- servir originales reventó la cuota de Cached Egress (21,6 GB
 * sobre 5 GB). */
export default function supabaseImageLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  if (src.startsWith(CDN_FOTOS)) return src;
  if (!src.includes(OBJECT_PREFIX)) return src;

  const [sinQuery] = src.split("?");
  const corte = sinQuery.indexOf(OBJECT_PREFIX) + OBJECT_PREFIX.length;
  const rutaConBucket = sinQuery.slice(corte);
  const barra = rutaConBucket.indexOf("/");
  if (barra < 0) return src;

  const ruta = rutaConBucket.slice(barra + 1);
  // Si ya es un derivado, devolverla tal cual en vez de anidar `_d/` sobre `_d/`.
  if (ruta.startsWith("_d/")) return src;

  return `${CDN_FOTOS}_d/${anchoDerivado(width)}/${ruta}.jpg${FOTOS_VERSION}`;
}

/** Para los consumidores que NO pasan por next/image y por lo tanto nunca
 * invocan el loader: meta tags Open Graph/Twitter y JSON-LD. Esos servían el
 * original a resolución completa en cada preview de link de WhatsApp/Facebook. */
export function fotoDerivada(urlOriginal: string, ancho: AnchoDerivado): string {
  return supabaseImageLoader({ src: urlOriginal, width: ancho });
}
