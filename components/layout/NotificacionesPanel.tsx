"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { NotificacionChat } from "@/lib/notificaciones/useNotificacionesChat";

/** Popover de notificaciones anclado a la campana del header.
 *
 * Antes era una hoja a pantalla completa con fondo negro: tapaba todo el sitio
 * para mostrar, casi siempre, dos líneas de texto -- y daba la sensación de
 * que la página se había trabado (pedido del dueño, 2026-07-26). Ahora es un
 * panel chico que sale debajo de la campana, con un click-away transparente.
 *
 * Sigue yendo por portal a document.body: el header tiene backdrop-blur-xl, y
 * un filtro CSS crea un containing block nuevo para los descendientes fixed,
 * así que sin portal el panel quedaba recortado al ancho del pill del header
 * (hallazgo real, 2026-07-23). Por eso la posición se calcula a mano desde el
 * rect del botón en vez de usar `absolute` respecto del header.
 */
export function NotificacionesPanel({
  notificaciones,
  onClose,
  onMarcarLeido,
  anclaRef,
}: {
  notificaciones: NotificacionChat[];
  onClose: () => void;
  onMarcarLeido: () => void;
  /** Botón de la campana -- el panel se alinea a su borde derecho. */
  anclaRef?: React.RefObject<HTMLElement | null>;
}) {
  // Snapshot al abrir -- así los puntos de "no leída" siguen visibles mientras
  // el panel está abierto en vez de desaparecer al instante (se marcan leídas
  // recién al cerrar, ver auditoría 2026-07-23).
  const [snapshot] = useState(notificaciones);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  function cerrar() {
    onMarcarLeido();
    onClose();
  }

  // useLayoutEffect: posiciona antes del primer paint, si no el panel
  // parpadea arriba a la izquierda antes de saltar a su lugar.
  useLayoutEffect(() => {
    const calcular = () => {
      const el = anclaRef?.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const ancho = panelRef.current?.offsetWidth ?? 320;
      const MARGEN = 12;
      // Alineado al borde derecho de la campana, pero acotado por los DOS
      // lados: en mobile la campana no está pegada al borde (hay usuario y
      // carrito a su derecha), así que alinear sin tope dejaba el panel
      // saliéndose por la izquierda (x negativo, bug real 2026-07-26).
      const deseado = window.innerWidth - r.right;
      const maximo = Math.max(MARGEN, window.innerWidth - ancho - MARGEN);
      setPos({
        top: r.bottom + 10,
        right: Math.min(Math.max(MARGEN, deseado), maximo),
      });
    };
    calcular();
    window.addEventListener("resize", calcular);
    window.addEventListener("scroll", calcular, { passive: true });
    return () => {
      window.removeEventListener("resize", calcular);
      window.removeEventListener("scroll", calcular);
    };
  }, [anclaRef]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return createPortal(
    <>
      {/* Click-away transparente: cierra al tocar fuera sin oscurecer el sitio
          -- lo que se ve detrás sigue siendo la página, no un modal. */}
      <div className="fixed inset-0 z-40" onClick={cerrar} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notificaciones"
        className="fixed z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-linea bg-card shadow-[0_20px_50px_-12px_rgba(36,31,26,.35)]"
        style={pos ? { top: pos.top, right: pos.right } : { top: 72, right: 16 }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-ink/8 px-4 py-2.5">
          <h2 className="font-display text-sm font-semibold text-ink">Notificaciones</h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar notificaciones"
            className="flex h-7 w-7 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-2 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
          {snapshot.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-seafoam-bg text-seafoam-text" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <p className="text-sm font-semibold text-ink">Sin notificaciones</p>
              <p className="text-xs leading-5 text-ink-soft">Las respuestas de Lotus IA aparecerán aquí.</p>
            </div>
          ) : (
            <ul>
              {snapshot.map((n) => (
                <li key={n.id} className="flex gap-2.5 border-b border-ink/8 px-4 py-3 last:border-b-0">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold text-xs font-bold text-btn-ink"
                  >
                    L
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.8rem] font-semibold text-ink">
                      Lotus IA{n.opcionTitulo ? ` · ${n.opcionTitulo}` : ""}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[0.78rem] leading-[1.35] text-ink-soft">{n.texto}</p>
                  </div>
                  {!n.leida ? <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-coral" aria-hidden="true" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>,
    document.body,
  );
}
