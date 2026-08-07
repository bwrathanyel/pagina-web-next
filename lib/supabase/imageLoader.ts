const OBJECT_PREFIX = "/storage/v1/object/public/";

/** Las miniaturas se sirven desde un Worker propio respaldado por R2, no desde
 * Supabase: R2 no cobra egress, así que cada foto sale de Supabase una sola vez
 * y después es gratis para siempre. Ver `CRM/workers/fotos/`. */
const CDN_FOTOS = "https://fotos.destinoyeventoslotus360.com/";

/** Anchos de las miniaturas pregeneradas, que viven en el bucket bajo
 * `_d/<ancho>/<ruta_original>.jpg`. Los cuatro existen SIEMPRE para toda foto
 * (los genera `CRM/scripts/generar_derivados_fotos.py`), así que la URL se arma
 * por convención pura, sin consultar si el archivo está. */
export type AnchoDerivado = 256 | 384 | 640 | 1280;

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

/** next/image pide `slot_css * densidad_de_pantalla`. En un celular de 390px a
 * 3x eso da 1170 y terminaba bajando la versión de 1280 (130 KB) para pintar
 * una card de 390 -- 30 MB por recorrer el catálogo desde el teléfono.
 *
 * Se decide por RANGOS en vez de "el primero que cubra", porque el ancho pedido
 * ya viene multiplicado por la densidad y no distingue una card en pantalla
 * retina de un hero real. Los rangos sí: una card nunca pasa de ~500 css (o sea
 * ~1200 pedidos a 3x), un hero a pantalla completa pide 1440+. Servir 640 para
 * una card de 390 css es ~1.6x de densidad efectiva: nítido en el teléfono, y
 * menos de la mitad de bytes. El hero, que sí se ve grande, conserva 1280.
 *
 * El corte de 1200 no es arbitrario: por debajo solo caen cards (una card de
 * 500 css necesitaría 3x para pasarlo, y a 500 css ya no estás en un teléfono),
 * y por encima entra el hero de escritorio a 1x (1440), que sí se ve borroso
 * si se le sirve 640. */
function anchoDerivado(pedido: number): AnchoDerivado {
  if (pedido <= 320) return 256;
  if (pedido <= 500) return 384;
  if (pedido <= 1200) return 640;
  return 1280;
}

/** Reescribe una URL del bucket a su miniatura pregenerada del ancho más chico
 * que cubra `width`. Lo que no sea del bucket (assets locales de /public) pasa
 * sin tocar.
 *
 * Antes esto apuntaba al endpoint de transformación on-demand de Supabase
 * (`/storage/v1/render/image/`), pero ese es de plan Pro ("Image Resizing is
 * currently enabled for Pro Plan and above") y el proyecto está en Free: en
 * cuanto Supabase aplique la restricción devuelve 402 y el sitio se queda sin
 * NINGUNA imagen. Las miniaturas pregeneradas son objetos normales del bucket,
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
