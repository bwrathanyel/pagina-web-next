export type ModalidadEmpleo = "presencial" | "freelance";

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
