export type ModalidadEmpleo = "presencial" | "freelance";

// Mismo límite y mimes que valida el backend (_shared/cv.ts) -- validar acá
// primero es solo para dar feedback inmediato, la Edge Function es la
// frontera real que decide si el archivo se acepta.
export const CV_MIME_ACEPTADOS = ["application/pdf", "image/jpeg", "image/png"];
export const CV_LIMITE_BYTES = 5 * 1024 * 1024;

/** null = archivo válido. Si no, el código de error para mostrarle al usuario. */
export function validarArchivoCV(file: File): "formato" | "tamano" | null {
  if (!CV_MIME_ACEPTADOS.includes(file.type)) return "formato";
  if (file.size > CV_LIMITE_BYTES) return "tamano";
  return null;
}

export interface PostulacionEmpleo {
  nombre: string;
  telefono: string;
  email?: string;
  modalidad: ModalidadEmpleo;
  rolInteres?: string;
  mensaje?: string;
  cvBase64?: string;
  cvMime?: string;
}

export interface RespuestaPostulacion {
  ok: boolean;
  error?: string;
}

export async function enviarPostulacion(datos: PostulacionEmpleo): Promise<RespuestaPostulacion> {
  const response = await fetch("/api/postular-empleo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      nombre: datos.nombre,
      telefono: datos.telefono,
      email: datos.email,
      modalidad: datos.modalidad,
      rol_interes: datos.rolInteres,
      mensaje: datos.mensaje,
      cv_base64: datos.cvBase64,
      cv_mime: datos.cvMime,
    }),
  });
  const resultado = (await response.json().catch(() => null)) as RespuestaPostulacion | null;
  if (!response.ok || !resultado?.ok) {
    throw new Error(resultado?.error ?? "No se pudo enviar la postulación.");
  }
  return resultado;
}

/** Lee un File del <input type="file"> como base64 puro (sin el prefijo
 * "data:<mime>;base64," de FileReader) -- el backend solo necesita los
 * bytes, el mime ya viaja aparte en cv_mime. */
export function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      resolve(resultado.includes(",") ? resultado.slice(resultado.indexOf(",") + 1) : resultado);
    };
    reader.onerror = () => reject(reader.error ?? new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}
