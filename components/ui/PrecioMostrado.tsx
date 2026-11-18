"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { convertirPrecioTexto, IVA_BS, montoBs, type TasaBcv } from "@/lib/utils/convertirPrecio";
import { textoEnDolares } from "@/lib/utils/formatoPrecio";

export type OpcionesPrecio = {
  /** La tarifa de BT no incluye IVA: en Bs se suma 16%. */
  ivaEnBs?: boolean;
  /** Tasa BCV de la tarifa = su `moneda` (tasaDeMoneda). Sin dato, dólar. */
  tasa?: TasaBcv;
  /** Montos que no son tarifas de BT (vuelos): tasa dólar y nunca IVA. */
  tasaDolar?: boolean;
};

function tasaDe(op: OpcionesPrecio, tasaUSD: number | null, tasaEUR: number | null) {
  return !op.tasaDolar && op.tasa === "EUR" ? tasaEUR : tasaUSD;
}

/** Único punto de conversión $ -> Bs en toda la web: el texto que llega acá
 * (precioLabel, ya formateado por formatearPrecioCliente) NO se toca en
 * origen -- ni en el carrito ni en ningún estado guardado, solo acá en el
 * render, con la tasa que ya está en memoria del CurrencyProvider. Así
 * togglear moneda nunca deja un precio "doble convertido" guardado en algún
 * lado. En divisas todo sale en $ (un € suelto se pasa a $); en Bs, a la tasa
 * BCV de la moneda de la tarifa (`tasa`; +16% si `ivaEnBs`). El símbolo del
 * texto no sirve para eso: formatearPrecioCliente pasa € a $, por eso la moneda
 * viaja como opción. Si la tasa todavía no cargó, se muestra el texto en $ sin
 * bloquear el render. */
export function PrecioMostrado({ texto, ...op }: { texto: string | null | undefined } & OpcionesPrecio) {
  return <>{usePrecioMostrado(texto, op)}</>;
}

export type ParteMonto = { monto: number } & OpcionesPrecio;

/** Total de piezas con tasas distintas (hotel a la tasa de su tarifa, con o sin
 * IVA, más vuelo a tasa dólar). El texto ya sumado no se puede pasar a Bs: cada pieza se
 * convierte por su lado y después se suma. `enDolares` da el texto en $ (el
 * mismo formato que usaba quien llama); sin tasa cargada se queda en $. */
export function usePrecioSuma(partes: ParteMonto[], enDolares: (n: number) => string, divisor = 1): string {
  const { moneda, tasaUSD, tasaEUR } = useCurrency();
  const dolares = enDolares(partes.reduce((a, p) => a + p.monto, 0) / divisor);
  if (moneda !== "VES") return dolares;
  let bs = 0;
  for (const p of partes) {
    const tasa = tasaDe(p, tasaUSD, tasaEUR);
    if (!tasa) return dolares;
    bs += p.monto * tasa * (!p.tasaDolar && p.ivaEnBs ? IVA_BS : 1);
  }
  return montoBs(bs / divisor);
}

/** El mismo texto que pinta PrecioMostrado, para quien necesita medirlo. */
export function usePrecioMostrado(texto: string | null | undefined, op: OpcionesPrecio = {}) {
  const { moneda, tasaUSD, tasaEUR } = useCurrency();
  if (texto == null) return texto;
  if (moneda === "VES") {
    const bs = convertirPrecioTexto(texto, tasaDe(op, tasaUSD, tasaEUR), !op.tasaDolar && !!op.ivaEnBs);
    if (bs !== texto) return bs;
  }
  return textoEnDolares(texto);
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
  ...op
}: OpcionesPrecio & {
  texto: string | undefined;
  tope: string;
  topeLg?: string;
  unaLinea?: boolean;
  /** Clases de la caja que se mide (p. ej. `min-w-0 flex-1` dentro de una fila). */
  className?: string;
  claseMonto?: string;
}) {
  const mostrado = usePrecioMostrado(texto, op) ?? "";
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
