"use client";

import dynamic from "next/dynamic";

/* El chat del asistente (~34 KB de fuente) solo se usa al abrirlo, pero iba en
   el JS inicial de todas las páginas porque el botón flotante está en el
   layout. Ahora baja aparte; `precargarAsistente` lo pide en un rato libre
   después de cargar para que, al tocar el botón, ya esté. */
const cargar = () => import("@/components/layout/AsistenteVirtualPanel");

export const AsistenteVirtualPanel = dynamic(() => cargar().then((m) => m.AsistenteVirtualPanel), { ssr: false });

export function precargarAsistente() {
  const t = setTimeout(() => void cargar().catch(() => {}), 4000);
  return () => clearTimeout(t);
}
