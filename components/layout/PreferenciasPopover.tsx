"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PreferenciasControles } from "@/components/layout/PreferenciasControles";
import { Icono } from "@/components/ui/Icono";

/** Popover de preferencias (moneda y tema) anclado al botón de la barra del
 * escritorio. Mismo esquema que NotificacionesPanel: portal a document.body,
 * posición calculada desde el rect del botón, click-away transparente. Además
 * lleva el foco adentro al abrir, lo devuelve al botón al cerrar y se cierra
 * si el foco sale del panel. */
export function PreferenciasPopover({
  onCerrar,
  anclaRef,
}: {
  onCerrar: () => void;
  anclaRef: React.RefObject<HTMLElement | null>;
}) {
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const calcular = () => {
      const el = anclaRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const MARGEN = 12;
      const ancho = panelRef.current?.offsetWidth ?? 320;
      const maximo = Math.max(MARGEN, window.innerWidth - ancho - MARGEN);
      setPos({ top: r.bottom + 10, right: Math.min(Math.max(MARGEN, window.innerWidth - r.right), maximo) });
    };
    calcular();
    window.addEventListener("resize", calcular);
    window.addEventListener("scroll", calcular, { passive: true });
    return () => {
      window.removeEventListener("resize", calcular);
      window.removeEventListener("scroll", calcular);
    };
  }, [anclaRef]);

  // El padre pasa un onCerrar nuevo en cada render: se lee por ref para que el
  // efecto de foco corra una sola vez (si no, robaría el foco en cada render).
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = onCerrar;
  });
  const foco = useRef({ devolver: true });

  useEffect(() => {
    const ancla = anclaRef.current;
    const estado = foco.current;
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();
    const alTeclear = (e: KeyboardEvent) => e.key === "Escape" && cerrarRef.current();
    window.addEventListener("keydown", alTeclear);
    return () => {
      window.removeEventListener("keydown", alTeclear);
      if (estado.devolver) ancla?.focus();
    };
  }, [anclaRef]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-40" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Preferencias"
        tabIndex={-1}
        onBlur={(e) => {
          // El foco que vuelve al botón no cierra: en dev, StrictMode desmonta y
          // remonta el efecto de foco y su limpieza lo devuelve al ancla.
          if (e.currentTarget.contains(e.relatedTarget) || e.relatedTarget === anclaRef.current) return;
          // El foco ya se fue a otro lado (Tab o clic): no se lo quita.
          foco.current.devolver = false;
          onCerrar();
        }}
        className="fixed z-50 w-88 max-w-[calc(100%-1.5rem)] rounded-card bg-card p-4 pt-1 shadow-chrome"
        style={pos ? { top: pos.top, right: pos.right } : { top: 72, right: 16 }}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-ink">Preferencias</h2>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar preferencias"
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-ink"
          >
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>
        <PreferenciasControles />
      </div>
    </>,
    document.body,
  );
}
