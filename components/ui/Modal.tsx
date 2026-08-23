"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export function Modal({
  titulo,
  onClose,
  children,
  icono,
  acentoClassName,
}: {
  titulo: string;
  onClose: () => void;
  children: React.ReactNode;
  /** Badge circular junto al título (ej. ícono de WhatsApp). Opcional: sin
   * esto el modal se ve como siempre -- lo usan también formularios de admin
   * y de postulación que no deben heredar ningún acento de marca. */
  icono?: React.ReactNode;
  /** Clases de degradé para el badge y la franja superior, ej.
   * "from-whatsapp to-[#0a5c30]". Sin efecto si no viene `icono`. */
  acentoClassName?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Portal a document.body: un ancestro con backdrop-blur/filter (ej. el
  // navbar) crea un containing block nuevo para position:fixed -- sin el
  // portal, el modal quedaba encuadrado dentro de ese ancestro filtrado en
  // vez de centrado en toda la pantalla (bug real reportado: se veía
  // pegado arriba cuando se abría desde el botón de WhatsApp del navbar).
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-card shadow-2xl"
      >
        {icono ? (
          <div aria-hidden="true" className={"h-[3px] w-full bg-gradient-to-r " + acentoClassName} />
        ) : null}
        <div className="p-6">
          <div className="mb-4 flex items-center gap-3">
            {icono ? (
              <span
                className={
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-[0_8px_20px_-6px_rgba(15,122,64,0.5)] " +
                  acentoClassName
                }
                aria-hidden="true"
              >
                {icono}
              </span>
            ) : null}
            <h2 className="flex-1 font-display text-xl font-semibold text-ink">{titulo}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand-2 hover:text-ink"
            >
              ✕
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
