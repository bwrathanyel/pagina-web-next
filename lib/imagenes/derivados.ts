/** Anchos de las miniaturas que el loader (`lib/supabase/imageLoader.ts`) espera
 * encontrar YA generadas en `_d/<ancho>/<ruta>.jpg`. Debe coincidir con `ANCHOS`
 * de ese módulo -- no se reexporta desde ahí porque ese archivo no exporta la
 * constante, solo el tipo derivado de ella. */
export const ANCHOS_DERIVADOS = [256, 384, 640, 1280] as const;

type Fuente = ImageBitmap | HTMLImageElement;

/** Genera en el navegador los 4 derivados JPEG que normalmente produce
 * `CRM/scripts/generar_derivados_fotos.py` en el servidor, para que una foto
 * recién subida no se vea rota mientras no corre ese script. Nunca lanza: si
 * algo falla devuelve lo que haya podido generar (puede ser []). */
export async function generarDerivados(file: File): Promise<{ ancho: number; blob: Blob }[]> {
  let fuente: Fuente | null = null;
  try {
    fuente = await cargarFuente(file);
    if (!fuente) return [];
    const resultados: { ancho: number; blob: Blob }[] = [];
    for (const ancho of ANCHOS_DERIVADOS) {
      try {
        const blob = await recortar(fuente, ancho);
        if (blob) resultados.push({ ancho, blob });
      } catch {
        // Un ancho fallido no debe tumbar los demás.
      }
    }
    return resultados;
  } catch {
    return [];
  } finally {
    if (fuente && "close" in fuente) fuente.close();
  }
}

async function cargarFuente(file: File): Promise<Fuente | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Cae al método con <img> abajo (algunos navegadores viejos no decodifican ciertos formatos con createImageBitmap).
    }
  }
  return await cargarConImg(file);
}

function cargarConImg(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function recortar(fuente: Fuente, anchoObjetivo: number): Promise<Blob | null> {
  const anchoOriginal = fuente.width;
  const altoOriginal = fuente.height;
  if (!anchoOriginal || !altoOriginal) return null;

  // No agrandar: si el original ya es más angosto que el objetivo, usar el ancho del original.
  const ancho = Math.min(anchoObjetivo, anchoOriginal);
  const alto = Math.round((altoOriginal / anchoOriginal) * ancho);

  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(ancho, alto);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    dibujarSobreBlanco(ctx, fuente, ancho, alto);
    return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.78 });
  }

  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  dibujarSobreBlanco(ctx, fuente, ancho, alto);
  return await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
}

function dibujarSobreBlanco(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  fuente: Fuente,
  ancho: number,
  alto: number,
) {
  // JPEG no tiene canal alfa: sin este relleno, la transparencia del original sale negra.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, ancho, alto);
  ctx.drawImage(fuente, 0, 0, ancho, alto);
}
