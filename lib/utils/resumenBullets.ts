/** Divide un párrafo de descripción en oraciones para mostrarlo como lista —
 * parte en los espacios que siguen a . ! ? (nunca dentro de un número como
 * "$150.000" porque ahí no hay espacio después del punto), así ningún
 * caracter del texto original se pierde ni se reescribe. */
export function resumenBullets(texto: string | null | undefined): string[] {
  if (!texto) return [];
  return texto
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
