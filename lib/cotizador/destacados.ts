// Hoteles destacados por destino de /cotizar: el dueño elige cuáles rotan como
// «nuestra recomendación»; el resto del orden queda como alternativa.
import type { OfertaHotel } from "@/lib/cotizador/ofertas";

const MAXIMO = 3;

export const DESTACADOS: Record<string, number[]> = {
  // Margarita Village, LD Palm Beach, Hesperia Isla Margarita.
  "Isla de Margarita": [1026, 4, 2],
};

export function idsDestacados(destino: string | null | undefined): number[] {
  return (destino && DESTACADOS[destino]) || [];
}

export function destacadosDe(
  ofertas: OfertaHotel[],
  destino: string | null | undefined,
  bloqueada: (o: OfertaHotel) => boolean = () => false,
): OfertaHotel[] {
  const disponibles = ofertas.filter((o) => !bloqueada(o));
  const out: OfertaHotel[] = [];
  for (const id of idsDestacados(destino)) {
    const o = disponibles.find((x) => x.hotelId === id);
    if (o && out.length < MAXIMO && !out.includes(o)) out.push(o);
  }
  // Si un destacado está en stop sale o no se publicó, el hueco lo llena el orden del dueño.
  for (const o of disponibles) {
    if (out.length >= MAXIMO) break;
    if (!out.some((x) => x.hotelId === o.hotelId)) out.push(o);
  }
  return out;
}

export function rotarDestacados<T>(lista: T[], semilla: number): T[] {
  if (!lista.length) return [];
  const s = Number.isFinite(semilla) ? Math.abs(Math.trunc(semilla)) : 0;
  const i = s % lista.length;
  return [...lista.slice(i), ...lista.slice(0, i)];
}

export function semillaVisitante(aleatorio: () => number = Math.random): number {
  const r = aleatorio();
  return Number.isFinite(r) ? Math.min(2 ** 31, Math.max(0, Math.floor(r * 2 ** 31))) : 0;
}
