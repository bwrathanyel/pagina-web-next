"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icono } from "@/components/ui/Icono";
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
        className="fixed z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-card bg-card shadow-chrome"
        style={pos ? { top: pos.top, right: pos.right } : { top: 72, right: 16 }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-linea py-1 pl-4 pr-1">
          <h2 className="font-display text-lg font-bold text-ink">Notificaciones</h2>
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar notificaciones"
            className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-ink"
          >
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>

        <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
          {snapshot.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-seafoam-bg text-seafoam-text" aria-hidden="true">
                <Icono nombre="campana" tamano={18} />
              </span>
              <p className="text-sm font-semibold text-ink">Sin notificaciones</p>
              <p className="text-sm text-ink-soft">Las respuestas de Lotus IA aparecerán aquí.</p>
            </div>
          ) : (
            <ul>
              {snapshot.map((n) => (
                <li key={n.id} className="flex gap-3 border-b border-linea px-4 py-3 last:border-b-0">
                  <span
                    aria-hidden="true"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill bg-dusk font-display text-sm font-bold text-dusk-text"
                  >
                    L
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      Lotus IA{n.opcionTitulo ? ` · ${n.opcionTitulo}` : ""}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-ink-soft">{n.texto}</p>
                  </div>
                  {!n.leida ? (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-pill bg-acento">
                      <span className="sr-only">No leída</span>
                    </span>
                  ) : null}
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
