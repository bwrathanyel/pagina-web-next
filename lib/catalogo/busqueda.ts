export const DESTINOS_SUGERIDOS = ["Canaima", "Chichiriviche", "Los Roques", "Margarita", "Mérida"];

// Nullable: hay promociones sin título cargado y un null acá tumbaba /buscar.
export function coincide(texto: string | null | undefined, query: string): boolean {
  return (texto ?? "").toLowerCase().includes(query.toLowerCase());
}
