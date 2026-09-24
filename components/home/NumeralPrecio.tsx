"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { convertirPrecioTexto } from "@/lib/utils/convertirPrecio";

/** El "desde $X" gigante de la banda de niños gratis. Es PrecioMostrado con
 * una regla más: en bolívares el monto tiene el doble de cifras y a tamaño de
 * firma se saldría de la columna, así que baja de escala según el largo. */
export function NumeralPrecio({ texto }: { texto: string }) {
  const { moneda, tasaUSD, tasaEUR } = useCurrency();
  const mostrado = moneda === "VES" ? (convertirPrecioTexto(texto, tasaUSD, tasaEUR) ?? texto) : texto;
  const tamano =
    mostrado.length <= 5
      ? "text-[clamp(6.5rem,26vw,11.5rem)]"
      : mostrado.length <= 8
        ? "text-[clamp(4rem,16vw,7rem)]"
        : "text-[clamp(2.75rem,11vw,4.75rem)]";
  return (
    <span className={"block font-mono font-bold leading-[0.8] tracking-[-0.04em] text-gold tabular-nums " + tamano}>
      {mostrado}
    </span>
  );
}
