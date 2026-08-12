"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { convertirPrecioTexto } from "@/lib/utils/convertirPrecio";

/** Único punto de conversión USD/EUR -> Bs en toda la web: el texto que
 * llega acá (precioLabel, ya formateado por formatearPrecioCliente) NO se
 * toca en origen -- ni en el carrito ni en ningún estado guardado, solo acá
 * en el render, con la tasa que ya está en memoria del CurrencyProvider. Así
 * togglear moneda nunca deja un precio "doble convertido" guardado en algún
 * lado. Si la tasa todavía no cargó, se muestra el texto nativo (USD/EUR)
 * sin bloquear el render. */
export function PrecioMostrado({ texto }: { texto: string | null | undefined }) {
  const { moneda, tasaUSD, tasaEUR } = useCurrency();
  if (moneda !== "VES") return <>{texto}</>;
  return <>{convertirPrecioTexto(texto, tasaUSD, tasaEUR) ?? texto}</>;
}
