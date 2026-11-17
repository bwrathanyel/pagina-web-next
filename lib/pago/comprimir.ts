// Comprobante: los pantallazos del teléfono pesan 3–8 MB y `pago-publico` corta
// en 5 MB. Las imágenes se achican en el cliente (canvas → WebP, o JPEG donde el
// navegador no codifica WebP) antes del base64; el PDF va tal cual.
import { COMPROBANTE_LIMITE_BYTES, COMPROBANTE_MIMES } from "./pagar";

/** A lo que se apunta al comprimir. Por debajo de esto la imagen va sin tocar. */
export const OBJETIVO_BYTES = 1.5 * 1024 * 1024;
/** Más que esto no se intenta decodificar: en un teléfono gama baja revienta la memoria. */
export const IMAGEN_MAX_BYTES = 30 * 1024 * 1024;

/** Lado mayor y calidad de cada intento, de más fiel a más liviano. 1600 px sigue
 *  leyendo bien una referencia bancaria; 1280 es el último recurso. */
export const INTENTOS: ReadonlyArray<readonly [lado: number, calidad: number]> = [
  [2000, 0.82],
  [1600, 0.78],
  [1600, 0.62],
  [1280, 0.6],
];

export type DecisionComprobante = "formato" | "tamano" | "comprimir" | "tal_cual";

/** Qué hacer con el archivo elegido, antes de tocarlo. */
export function decidirComprobante(mime: string, bytes: number): DecisionComprobante {
  if (!COMPROBANTE_MIMES.includes(mime)) return "formato";
  if (mime === "application/pdf") return bytes > COMPROBANTE_LIMITE_BYTES ? "tamano" : "tal_cual";
  if (bytes > IMAGEN_MAX_BYTES) return "tamano";
  return bytes > OBJETIVO_BYTES ? "comprimir" : "tal_cual";
}

/** Ancho y alto con el lado mayor en `lado` como mucho. Nunca agranda. */
export function medidas(ancho: number, alto: number, lado: number): { ancho: number; alto: number } {
  const mayor = Math.max(ancho, alto);
  if (mayor <= lado || mayor <= 0) return { ancho, alto };
  const k = lado / mayor;
  return { ancho: Math.max(1, Math.round(ancho * k)), alto: Math.max(1, Math.round(alto * k)) };
}

/** «captura.png» → «captura.webp». */
export function nombreCon(nombre: string, mime: string): string {
  const ext = mime === "image/webp" ? "webp" : "jpg";
  const base = nombre.replace(/\.[^.]+$/, "") || "comprobante";
  return `${base}.${ext}`;
}

// ---------- solo navegador ----------

type Fuente = { dibujo: CanvasImageSource; ancho: number; alto: number; soltar: () => void };

async function cargar(file: File): Promise<Fuente> {
  if (typeof createImageBitmap === "function") {
    try {
      const b = await createImageBitmap(file);
      return { dibujo: b, ancho: b.width, alto: b.height, soltar: () => b.close() };
    } catch {
      // Safari viejo: cae al <img>.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { dibujo: img, ancho: img.naturalWidth, alto: img.naturalHeight, soltar: () => URL.revokeObjectURL(url) };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

function aBlob(canvas: HTMLCanvasElement, mime: string, calidad: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, mime, calidad));
}

/** Devuelve la imagen achicada, o la original si ningún intento la mejora.
 *  Lanza si el navegador no puede leerla (el que llama decide el mensaje). */
export async function comprimirImagen(file: File): Promise<File> {
  const fuente = await cargar(file);
  let mejor: Blob | null = null;
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    for (const [lado, calidad] of INTENTOS) {
      const m = medidas(fuente.ancho, fuente.alto, lado);
      canvas.width = m.ancho;
      canvas.height = m.alto;
      // Fondo blanco: un PNG con transparencia en JPEG quedaría negro.
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, m.ancho, m.alto);
      ctx.drawImage(fuente.dibujo, 0, 0, m.ancho, m.alto);
      let blob = await aBlob(canvas, "image/webp", calidad);
      // Sin codificador WebP, toBlob devuelve PNG: se pide JPEG.
      if (!blob || blob.type !== "image/webp") blob = await aBlob(canvas, "image/jpeg", calidad);
      if (!blob) continue;
      if (!mejor || blob.size < mejor.size) mejor = blob;
      if (blob.size <= OBJETIVO_BYTES) break;
    }
    canvas.width = canvas.height = 0;
  } finally {
    fuente.soltar();
  }
  if (!mejor || mejor.size >= file.size) return file;
  return new File([mejor], nombreCon(file.name, mejor.type), { type: mejor.type, lastModified: Date.now() });
}
