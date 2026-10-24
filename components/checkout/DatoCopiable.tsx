"use client";

import { useEffect, useRef, useState } from "react";
import { Icono } from "@/components/ui/Icono";

/** Copia al portapapeles y avisa 1,8 s. Sin permiso de portapapeles no hace nada:
 * el valor sigue visible para copiarlo a mano. */
export function useCopiar() {
  const [copiado, setCopiado] = useState(false);
  const t = useRef(0);
  useEffect(() => () => window.clearTimeout(t.current), []);
  async function copiar(valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      window.clearTimeout(t.current);
      t.current = window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* sin permiso */
    }
  }
  return { copiado, copiar };
}

/** Botón «Copiar» con texto (para el monto, donde el icono solo no se entiende). */
export function BotonCopiar({ valor, que, className = "" }: { valor: string; que: string; className?: string }) {
  const { copiado, copiar } = useCopiar();
  return (
    <>
      <button
        type="button"
        onClick={() => copiar(valor)}
        aria-label={copiado ? `${que} copiado` : `Copiar ${que}`}
        className={
          "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-control border border-linea-fuerte bg-card px-3 text-sm font-semibold text-ink " +
          "transition-colors duration-150 ease-salida hover:bg-sand-2 " + className
        }
      >
        <Icono nombre={copiado ? "check" : "copiar"} tamano={16} className={copiado ? "text-seafoam-text" : ""} />
        {copiado ? "Copiado" : "Copiar"}
      </button>
      <span className="sr-only" aria-live="polite">{copiado ? `${que} copiado` : ""}</span>
    </>
  );
}

/** Fila de datos bancarios con botón de copiar: en el teléfono se paga desde
 * otra app, y transcribir una cédula o un número de cuenta es donde se falla. */
export function DatoCopiable({ etiqueta, valor, copia }: { etiqueta: string; valor: string; copia?: string }) {
  const { copiado, copiar } = useCopiar();
  return (
    <div className="flex items-center gap-3 border-b border-dashed border-linea-fuerte py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-ink-soft">{etiqueta}</dt>
        <dd className="break-words font-mono font-bold text-ink">{valor}</dd>
      </div>
      <button
        type="button"
        onClick={() => copiar(copia ?? valor)}
        aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 ease-salida hover:bg-sand-2 hover:text-ink"
      >
        <Icono nombre={copiado ? "check" : "copiar"} tamano={18} className={copiado ? "text-seafoam-text" : ""} />
      </button>
      <span className="sr-only" aria-live="polite">{copiado ? `${etiqueta} copiado` : ""}</span>
    </div>
  );
}
