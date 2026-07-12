/** Agrupa cualquier lista de catálogo por destino — usado para las
 * sub-secciones dentro de Hoteles/Paquetes/Guías-Tours/Promociones. Los
 * que no tienen destino (posible en promociones sin producto asociado)
 * caen en "Otros destinos", siempre al final. */
export function agruparPorDestino<T>(
  items: T[],
  destinoDe: (item: T) => string | null,
): { destino: string; items: T[] }[] {
  const OTROS = "Otros destinos";
  const grupos = new Map<string, T[]>();

  for (const item of items) {
    const destino = destinoDe(item) ?? OTROS;
    if (!grupos.has(destino)) grupos.set(destino, []);
    grupos.get(destino)!.push(item);
  }

  return [...grupos.entries()]
    .sort(([a], [b]) => (a === OTROS ? 1 : b === OTROS ? -1 : a.localeCompare(b, "es")))
    .map(([destino, items]) => ({ destino, items }));
}
