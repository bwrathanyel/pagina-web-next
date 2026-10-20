// Orden de los chips de destino (pedido del dueño 2026-10-20): primero los que
// más se venden, después el resto alfabético y "Otros destinos" siempre al
// final. La home usa esta misma lista para decidir qué destinos muestra en Hot
// Sales, así que el orden de los chips es el mismo en todo el sitio.
export const DESTINOS_PRIORITARIOS = ["Margarita", "Los Roques", "Canaima", "Chichiriviche", "Mérida"];

const OTROS = "Otros destinos";
const rango = (destino: string) => {
  const i = DESTINOS_PRIORITARIOS.indexOf(destino);
  return i === -1 ? DESTINOS_PRIORITARIOS.length : i;
};

export function ordenarDestinos(destinos: string[]): string[] {
  return [...destinos].sort((a, b) =>
    a === OTROS || b === OTROS
      ? Number(a === OTROS) - Number(b === OTROS)
      : rango(a) - rango(b) || a.localeCompare(b, "es"),
  );
}
