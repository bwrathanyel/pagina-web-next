"use client";

import { useSyncExternalStore } from "react";
import { hoyCaracas } from "@/lib/cotizador/estado";

const sinSuscripcion = () => () => {};

/** Hoy en Caracas, solo en el navegador. Las páginas de paquetes son estáticas:
 * calcular el precio con la fecha del build daría otro recargo de vuelo que el
 * de hoy (y un error de hidratación). En el servidor devuelve null. */
export function useHoy(): string | null {
  return useSyncExternalStore(sinSuscripcion, hoyCaracas, () => null);
}
