"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { NotificacionChat } from "@/lib/notificaciones/useNotificacionesChat";

export function NotificacionesPanel({
  notificaciones,
  onClose,
  onMarcarLeido,
}: {
  notificaciones: NotificacionChat[];
  onClose: () => void;
  onMarcarLeido: () => void;
}) {
  // Snapshot al abrir -- así los puntos de "no leída" siguen visibles
  // mientras el panel está abierto en vez de desaparecer al instante
  // (se marcan leídas recién al cerrar, ver auditoría 2026-07-23).
  const [snapshot] = useState(notificaciones);

  function cerrar() {
    onMarcarLeido();
    onClose();
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Portal a document.body -- el header (Navbar) tiene backdrop-blur-xl, que
  // crea containing block nuevo para descendientes fixed (mismo efecto que
  // "filter"). Sin portal, este panel quedaba encogido al tamaño del pill
  // del header en vez de cubrir la pantalla (hallazgo real, 2026-07-23).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 sm:items-center sm:p-4" onClick={cerrar}>
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-sand sm:h-[85vh] sm:max-w-sm sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-ink/10 bg-card px-4 py-3">
          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h2 className="font-display text-lg font-semibold text-ink">Notificaciones</h2>
        </header>

        <div className="flex-1 overflow-y-auto">
          {snapshot.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-seafoam-bg text-seafoam-text" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </span>
              <p className="font-semibold text-ink">Sin notificaciones</p>
              <p className="text-sm text-ink-soft">Las respuestas de Lotus IA aparecerán aquí.</p>
            </div>
          ) : (
            <ul>
              {snapshot.map((n) => (
                <li key={n.id} className="flex gap-3 border-b border-ink/8 px-4 py-4">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold text-sm font-bold text-btn-ink"
                  >
                    L
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">
                      Lotus IA{n.opcionTitulo ? ` · ${n.opcionTitulo}` : ""}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{n.texto}</p>
                  </div>
                  {!n.leida ? <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-coral" aria-hidden="true" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
