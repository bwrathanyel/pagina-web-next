// Arte generado de public/arte/: sellos de destino (tinta única, fondo transparente)
// e ilustraciones de estado (sobre dusk). Los nombres salen de DESTINOS.

export type EstadoArte = "sin-resultados" | "sin-cupo" | "error" | "no-encontrado" | "solicitud-enviada";

const SELLOS = new Set([
  "margarita",
  "coche",
  "morrocoy",
  "los-roques",
  "merida",
  "canaima",
  "catatumbo",
  "colonia-tovar",
  "caracas",
  "extranjero",
]);

/** «Isla de Margarita» → «margarita», «Mérida» → «merida». Desconocido → undefined. */
export function selloDestino(destino: string): string | undefined {
  const slug = destino
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/^isla de /, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return SELLOS.has(slug) ? slug : undefined;
}
