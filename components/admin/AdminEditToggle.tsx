"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { SiteEditorPanel } from "@/components/admin/SiteEditorPanel";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

/** Flotante, esquina opuesta al botón de WhatsApp — solo se renderiza para
 * rol admin. Estar logueado como admin no activa edición sola: es un
 * toggle aparte para poder navegar el sitio normal y prender edición
 * cuando hace falta. */
export function AdminEditToggle() {
  const { rol, modoEdicion, setModoEdicion } = useAuth();
  const { setEditorOpen } = useSiteContent();
  // En /cotizar la barra al pie es más alta y no hay barra de pestañas.
  const enCotizar = usePathname()?.startsWith("/cotizar") ?? false;
  if (rol !== "admin") return null;

  return (
    <>
    <button
      type="button"
      onClick={() => {
        setModoEdicion(!modoEdicion);
        if (!modoEdicion) setEditorOpen(true);
      }}
      className={
        (enCotizar ? "bottom-28 " : "bottom-24 ") +
        "fixed left-5 z-40 flex min-h-11 items-center gap-2 rounded-pill px-4 font-mono text-xs font-semibold uppercase tracking-wide shadow-chrome lg:bottom-5 " +
        (modoEdicion ? "bg-acento text-sobre-acento" : "bg-dusk text-dusk-text")
      }
      style={{ marginLeft: "env(safe-area-inset-left)" }}
    >
      <span className={"h-2 w-2 rounded-pill " + (modoEdicion ? "bg-sobre-acento" : "bg-dusk-text-soft")} aria-hidden="true" />
      {modoEdicion ? "Modo edición: ON" : "Modo edición"}
    </button>
    {modoEdicion ? <SiteEditorPanel /> : null}
    </>
  );
}
