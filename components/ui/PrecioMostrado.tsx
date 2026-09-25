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
  return <>{usePrecioMostrado(texto)}</>;
}

/** El mismo texto que pinta PrecioMostrado, para quien necesita medirlo. */
export function usePrecioMostrado(texto: string | null | undefined) {
  const { moneda, tasaUSD, tasaEUR } = useCurrency();
  if (moneda !== "VES") return texto;
  return convertirPrecioTexto(texto, tasaUSD, tasaEUR) ?? texto;
}

// Monto grande que se achica hasta entrar en el ancho de su caja: en Bs
// ("Bs 1.155.160,00") el número triplica el largo del de USD/EUR y a tamaño
// fijo se cortaba. Mide la palabra más larga (o el texto entero si va en una
// línea) a 0,62em por glifo mono; `tope`/`topeLg` son el tamaño de siempre.
export function MontoAjustado({
  texto,
  tope,
  topeLg,
  unaLinea = false,
  className = "",
  claseMonto = "",
}: {
  texto: string | undefined;
  tope: string;
  topeLg?: string;
  unaLinea?: boolean;
  /** Clases de la caja que se mide (p. ej. `min-w-0 flex-1` dentro de una fila). */
  className?: string;
  claseMonto?: string;
}) {
  const mostrado = usePrecioMostrado(texto) ?? "";
  const largo = unaLinea ? mostrado.length : Math.max(...mostrado.split(/\s+/).map((p) => p.length));
  const vars = { "--glifos": Math.max(4, largo) * 0.62, "--tope": tope, "--tope-lg": topeLg ?? tope };
  return (
    <span className={`@container block ${className}`}>
      <span
        style={vars as React.CSSProperties}
        className={
          "block font-mono font-bold tabular-nums " +
          "[font-size:max(0.75rem,min(var(--tope),calc(100cqi/var(--glifos))))] " +
          "lg:[font-size:max(0.75rem,min(var(--tope-lg),calc(100cqi/var(--glifos))))] " +
          claseMonto
        }
      >
        {mostrado}
      </span>
    </span>
  );
}
