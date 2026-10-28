// Datos verificables del negocio: una sola fuente para JSON-LD, footer,
// /nosotros y llms.txt. Google y los asistentes con IA (Gemini, ChatGPT)
// recomiendan entidades cuyos datos coinciden en todos lados (NAP consistente
// con el perfil de Google Business). Un campo en null no se publica.
export const NEGOCIO = {
  nombre: "Destino y Eventos Lotus 360",
  razonSocial: "Destino y Eventos Lotus 360, C.A.",
  rif: "J-41280131-7" as string | null,
  // Registro Turístico Nacional (MINTUR).
  rtn: "23.115" as string | null,
  // Año (YYYY) o fecha ISO.
  fundacion: "2019" as string | null,
  telefono: "+58-424-4634041",
  direccion: {
    // Igual a la ficha de Google Business (NAP consistente).
    calle: "C.C. Profesional Dinastía, Piso 3, Oficina 54, Av. 181 Valencia" as string | null,
    localidad: "Naguanagua",
    region: "Carabobo",
    codigoPostal: null as string | null,
    pais: "VE",
  },
  // Perfil de Google Business (se suma a sameAs).
  googleBusiness: "https://share.google/oeIdt5lV8qDTp68XP" as string | null,
} as const;

export function direccionLegible() {
  const d = NEGOCIO.direccion;
  return [d.calle, d.localidad, d.region, "Venezuela"].filter(Boolean).join(", ");
}

export function aniosDeTrayectoria(): number | null {
  if (!NEGOCIO.fundacion) return null;
  return new Date().getFullYear() - Number(NEGOCIO.fundacion.slice(0, 4));
}
