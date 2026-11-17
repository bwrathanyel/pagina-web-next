"use client";

import { useState } from "react";
import { usePrecioMostrado } from "@/components/ui/PrecioMostrado";

/** Monto del cotizador que cambia como una paleta del tablero de salidas
 * (`monto-flap` en globals.css, el mismo `flap-caer`). Cae solo cuando el
 * número cambia, nunca al montar: la primera pintura queda quieta. Convierte a
 * Bs igual que PrecioMostrado; un texto que no es precio pasa tal cual.
 * `convertir={false}` (checkout): el texto va tal cual, siempre en la moneda que fija el servidor. */
export function MontoTablero({ texto, convertir = true }: { texto: string | null | undefined; convertir?: boolean }) {
  const convertido = usePrecioMostrado(texto) ?? "";
  const mostrado = convertir ? convertido : (texto ?? "");
  // Se compara el monto crudo: cargar la tasa Bs o cambiar de moneda cambia el
  // texto mostrado pero no el monto, y eso no debe animar.
  const crudo = texto ?? "";
  const [visto, setVisto] = useState({ crudo, vuelta: 0 });
  if (visto.crudo !== crudo) setVisto({ crudo, vuelta: visto.vuelta + 1 });
  return (
    <span key={visto.vuelta} className={visto.vuelta ? "monto-flap" : undefined}>
      {mostrado}
    </span>
  );
}
