"use client";

import { useEffect, useState, type ReactNode } from "react";

const ESCRIBE = "input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]";

/** Barra al pie del teléfono con el total y la única acción (mismo patrón que /cotizar).
 * Se esconde mientras el cliente escribe: con el teclado abierto tapaba el campo.
 * Deja debajo de la página un espacio de su altura para no tapar el final. Solo < lg. */
export function BarraFijaMovil({
  children,
  visible = true,
  ocultarAlEscribir = true,
  etiqueta,
}: {
  children: ReactNode;
  /** false = no se muestra (p. ej. cuando el formulario ya está a la vista). */
  visible?: boolean;
  ocultarAlEscribir?: boolean;
  etiqueta: string;
}) {
  const [escribiendo, setEscribiendo] = useState(false);

  useEffect(() => {
    if (!ocultarAlEscribir) return;
    const entra = (e: FocusEvent) => {
      const t = e.target;
      if (t instanceof Element && t.matches(ESCRIBE)) setEscribiendo(true);
    };
    const sale = () => setEscribiendo(false);
    document.addEventListener("focusin", entra);
    document.addEventListener("focusout", sale);
    return () => {
      document.removeEventListener("focusin", entra);
      document.removeEventListener("focusout", sale);
    };
  }, [ocultarAlEscribir]);

  const oculta = !visible || escribiendo;
  return (
    <>
      <div aria-hidden="true" className="h-28 lg:hidden" />
      <div
        role="region"
        aria-label={etiqueta}
        aria-hidden={oculta || undefined}
        inert={oculta || undefined}
        className={
          "fixed inset-x-0 bottom-0 z-40 border-t border-linea bg-card/95 px-4 pt-3 shadow-chrome backdrop-blur " +
          "transition-transform duration-[var(--dur-media)] ease-salida motion-reduce:transition-none lg:hidden " +
          (oculta ? "translate-y-full" : "translate-y-0")
        }
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        {children}
      </div>
    </>
  );
}
