"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { registrarEvento } from "@/lib/analitica/eventos";

/** Un solo punto de entrada de analítica, montado en el layout. En cada
 * cambio de ruta manda un `pageview`; si la ruta es la ficha de un producto
 * o promoción, además manda `ver_producto` con el id. Sin librería, sin
 * cookies: todo cae en `web_eventos` vía /api/evento. */
export function Analitica() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    registrarEvento("pageview", { ruta: pathname });

    // /producto/<id>, /cotizar/producto/<id>, /cotizar/promocion/<id>
    const m = pathname.match(/^\/(?:cotizar\/)?(?:producto|promocion)\/([^/]+)/);
    if (m) {
      registrarEvento("ver_producto", { ruta: pathname, producto_slug: decodeURIComponent(m[1]) });
    }
  }, [pathname]);

  return null;
}
