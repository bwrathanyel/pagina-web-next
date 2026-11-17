"use client";

import { useSyncExternalStore } from "react";

// Mismo corte que `lg` de Tailwind (64rem). Para lo que debe existir UNA sola vez en la página
// (Turnstile, la casilla de aceptación) y cambia de lugar entre el aside de escritorio y el
// final de la columna en el teléfono. En el servidor se asume teléfono.
const CONSULTA = "(min-width: 64rem)";

function suscribir(avisar: () => void) {
  const m = window.matchMedia(CONSULTA);
  m.addEventListener("change", avisar);
  return () => m.removeEventListener("change", avisar);
}

const leer = () => window.matchMedia(CONSULTA).matches;

export function useEsEscritorio(): boolean {
  return useSyncExternalStore(suscribir, leer, () => false);
}

/** null en el servidor y durante la hidratación (B-15): lo que vive una sola vez no se monta hasta
 * saber dónde va, así no aparece en la columna para saltar al aside (CLS y Turnstile doble). */
export function useEsEscritorioConocido(): boolean | null {
  return useSyncExternalStore(suscribir, leer, () => null);
}
