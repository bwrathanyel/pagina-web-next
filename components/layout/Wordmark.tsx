"use client";

import { useSiteContent } from "@/components/providers/SiteContentProvider";

function dosLineas(nombre: string): [string, string] {
  const palabras = nombre.trim().split(/\s+/);
  if (palabras.length < 2) return [nombre, ""];
  const corte = Math.ceil(palabras.length / 2);
  return [palabras.slice(0, corte).join(" "), palabras.slice(corte).join(" ")];
}

/** Nombre de marca partido en 2 líneas equilibradas -- reemplaza el <span>
 * de una sola línea que en móvil (max-w-[7rem], text-[0.68rem]) rompía
 * "Destino y Eventos Lotus 360" en 3 líneas ilegibles (Navbar.tsx, hallazgo
 * del rediseño 2026-08-14). */
export function Wordmark() {
  const { content } = useSiteContent();
  const [arriba, abajo] = dosLineas(content.brand.name);

  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span className="whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-ink-soft sm:text-[10px]">
        {arriba}
      </span>
      {abajo ? (
        <span className="mt-0.5 whitespace-nowrap font-display text-[15px] font-bold text-ink sm:text-lg lg:text-xl">
          {abajo}
        </span>
      ) : null}
    </span>
  );
}
