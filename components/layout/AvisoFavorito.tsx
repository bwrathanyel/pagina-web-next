"use client";

import { useEffect } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { ENTRA_ESCALONADO } from "@/components/ui/movimiento";
import { useAuth } from "@/components/providers/AuthProvider";
import { aplicarFavoritoPendiente, useAvisoFavorito } from "@/lib/favoritos/pendiente";

/** Global (vive en el Navbar): aplica el favorito que quedó pendiente al
 * iniciar sesión y muestra el aviso de éxito o de error de los corazones. */
export function AvisoFavorito() {
  const { user } = useAuth();
  const aviso = useAvisoFavorito((s) => s.aviso);
  const cerrar = useAvisoFavorito((s) => s.cerrar);
  const usuarioId = user?.id ?? null;

  useEffect(() => {
    if (usuarioId) void aplicarFavoritoPendiente(usuarioId);
  }, [usuarioId]);

  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(cerrar, 4000);
    return () => window.clearTimeout(t);
  }, [aviso, cerrar]);

  if (!aviso) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(7rem+env(safe-area-inset-bottom))] z-50 flex justify-center px-4 lg:bottom-6">
      <Aviso tono={aviso.tono} className={ENTRA_ESCALONADO + " pointer-events-auto max-w-sm shadow-chrome"}>
        {aviso.texto}
      </Aviso>
    </div>
  );
}
