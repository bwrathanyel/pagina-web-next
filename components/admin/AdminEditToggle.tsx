"use client";

import { useAuth } from "@/components/providers/AuthProvider";

/** Flotante, esquina opuesta al botón de WhatsApp — solo se renderiza para
 * rol admin. Estar logueado como admin no activa edición sola: es un
 * toggle aparte para poder navegar el sitio normal y prender edición
 * cuando hace falta. */
export function AdminEditToggle() {
  const { rol, modoEdicion, setModoEdicion } = useAuth();
  if (rol !== "admin") return null;

  return (
    <button
      type="button"
      onClick={() => setModoEdicion(!modoEdicion)}
      className={
        "fixed bottom-5 left-5 z-40 flex min-h-11 items-center gap-2 rounded-full px-4 font-mono text-xs font-semibold uppercase tracking-wide shadow-[0_10px_28px_-8px_rgba(0,0,0,0.4)] " +
        (modoEdicion ? "bg-coral text-white" : "bg-dusk text-dusk-text")
      }
      style={{ marginBottom: "env(safe-area-inset-bottom)", marginLeft: "env(safe-area-inset-left)" }}
    >
      <span className={"h-2 w-2 rounded-full " + (modoEdicion ? "bg-white" : "bg-dusk-text-soft")} aria-hidden="true" />
      {modoEdicion ? "Modo edición: ON" : "Modo edición"}
    </button>
  );
}
