// Datos verificables del negocio: una sola fuente para JSON-LD, footer,
// /nosotros y llms.txt. Google y los asistentes con IA (Gemini, ChatGPT)
// recomiendan entidades cuyos datos coinciden en todos lados (NAP consistente
// con el perfil de Google Business). Un campo en null no se publica.
export const NEGOCIO = {
  nombre: "Destino y Eventos Lotus 360",
  rif: "J-41280131-7" as string | null,
  // Registro Turístico Nacional (MINTUR).
  rtn: "23.115" as string | null,
  // Año (YYYY) o fecha ISO.
  fundacion: "2019" as string | null,
  telefono: "+58-424-4634041",
  direccion: {
    calle: "C.C. Dinastía, Piso 3, Oficina 5-4" as string | null,
    localidad: "Naguanagua",
    region: "Carabobo",
    codigoPostal: null as string | null,
    pais: "VE",
  },
  // URL del perfil de Google Business cuando exista (se suma a sameAs).
  googleBusiness: null as string | null,
} as const;

export function direccionLegible() {
  const d = NEGOCIO.direccion;
  return [d.calle, d.localidad, d.region, "Venezuela"].filter(Boolean).join(", ");
}

export function aniosDeTrayectoria(): number | null {
  if (!NEGOCIO.fundacion) return null;
  return new Date().getFullYear() - Number(NEGOCIO.fundacion.slice(0, 4));
}
