"use client";

import { useEffect, useRef, useState } from "react";
import { Icono } from "@/components/ui/Icono";

/** Copia al portapapeles y avisa 1,8 s. Sin permiso de portapapeles no hace nada:
 * el valor sigue visible para copiarlo a mano. */
export function useCopiar() {
  const [copiado, setCopiado] = useState(false);
  const [manual, setManual] = useState(false);
  const t = useRef(0);
  useEffect(() => () => window.clearTimeout(t.current), []);
  /** `visible`: el elemento que muestra el valor; si nada copia, se selecciona
   * para que el usuario lo copie con pulsación larga. */
  async function copiar(valor: string, visible?: HTMLElement | null) {
    let listo = false;
    try {
      await navigator.clipboard.writeText(valor);
      listo = true;
    } catch {
      listo = copiarConTextarea(valor);
    }
    window.clearTimeout(t.current);
    if (listo) {
      setManual(false);
      setCopiado(true);
      t.current = window.setTimeout(() => setCopiado(false), 1800);
      return;
    }
    if (visible) {
      const rango = document.createRange();
      rango.selectNodeContents(visible);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(rango);
    }
    setCopiado(false);
    setManual(true);
    t.current = window.setTimeout(() => setManual(false), 6000);
  }
  return { copiado, manual, copiar };
}

/** Respaldo para webviews (Instagram, TikTok) sin permiso de portapapeles. */
function copiarConTextarea(valor: string) {
  const area = document.createElement("textarea");
  area.value = valor;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  try {
    area.focus();
    area.select();
    area.setSelectionRange(0, valor.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    document.body.removeChild(area);
  }
}

const TEXTO_MANUAL = "Mantenga presionado para copiar";

/** Botón «Copiar» con texto (para el monto, donde el icono solo no se entiende). */
export function BotonCopiar({ valor, que, className = "" }: { valor: string; que: string; className?: string }) {
  const { copiado, manual, copiar } = useCopiar();
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
      <span className="sr-only" aria-live="polite">{copiado ? `${que} copiado` : manual ? TEXTO_MANUAL : ""}</span>
    </>
  );
}

/** Fila de datos bancarios con botón de copiar: en el teléfono se paga desde
 * otra app, y transcribir una cédula o un número de cuenta es donde se falla. */
export function DatoCopiable({ etiqueta, valor, copia }: { etiqueta: string; valor: string; copia?: string }) {
  const { copiado, manual, copiar } = useCopiar();
  const visible = useRef<HTMLElement>(null);
  return (
    <div className="flex items-center gap-3 border-b border-dashed border-linea-fuerte py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-ink-soft">{etiqueta}</dt>
        <dd ref={visible} className="break-words font-mono font-bold text-ink">{valor}</dd>
        {manual ? <p className="text-sm font-semibold text-acento">{TEXTO_MANUAL}</p> : null}
      </div>
      <button
        type="button"
        onClick={() => copiar(copia ?? valor, visible.current)}
        aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 ease-salida hover:bg-sand-2 hover:text-ink"
      >
        <Icono nombre={copiado ? "check" : "copiar"} tamano={18} className={copiado ? "text-seafoam-text" : ""} />
      </button>
      <span className="sr-only" aria-live="polite">{copiado ? `${etiqueta} copiado` : manual ? TEXTO_MANUAL : ""}</span>
    </div>
  );
}
