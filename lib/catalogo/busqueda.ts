export const DESTINOS_SUGERIDOS = ["Canaima", "Chichiriviche", "Los Roques", "Margarita", "Mérida"];

export function coincide(texto: string, query: string): boolean {
  return texto.toLowerCase().includes(query.toLowerCase());
}
