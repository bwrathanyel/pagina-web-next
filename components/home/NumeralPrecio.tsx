"use client";

import { usePrecioMostrado, type OpcionesPrecio } from "@/components/ui/PrecioMostrado";

/** El "desde $X" gigante de la banda de niños gratis. Es PrecioMostrado con
 * una regla más: en bolívares el monto tiene el doble de cifras y a tamaño de
 * firma se saldría de la columna, así que baja de escala según el largo. */
export function NumeralPrecio({ texto, tasa }: { texto: string; tasa?: OpcionesPrecio["tasa"] }) {
  const mostrado = usePrecioMostrado(texto, { tasa }) ?? texto;
  const tamano =
    mostrado.length <= 5
      ? "text-[clamp(4.5rem,18vw,7.5rem)]"
      : mostrado.length <= 8
        ? "text-[clamp(3.25rem,13vw,5rem)]"
        : "text-[clamp(2.5rem,10vw,3.75rem)]";
  return (
    <span className={"block font-mono font-bold leading-[0.8] tracking-[-0.04em] text-gold tabular-nums " + tamano}>
      {mostrado}
    </span>
  );
}
