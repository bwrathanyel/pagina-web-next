"use client";

import { useEffect } from "react";

/** Deja la barra de direcciones en `ruta` (/reservar/<slug>) sin recargar: los enlaces con query
 * (?hotel=…&desde=…) siguen funcionando, el servidor ya los leyó y el estado vive en sessionStorage
 * (borrador de useReserva y boleto de ReservarCliente). Recargar o volver del login cae en la ruta limpia. */
export function LimpiarUrl({ ruta }: { ruta: string }) {
  useEffect(() => {
    if (window.location.pathname + window.location.search !== ruta) window.history.replaceState(null, "", ruta);
  }, [ruta]);
  return null;
}
