"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import type { Promocion } from "@/types/supabase";

function Flecha({ direccion }: { direccion: "anterior" | "siguiente" }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {direccion === "anterior" ? <path d="m15 18-6-6 6-6" /> : <path d="m9 18 6-6-6-6" />}
    </svg>
  );
}

export function PromocionesCarousel({ promociones }: { promociones: Promocion[] }) {
  const carril = useRef<HTMLDivElement>(null);
  const [puedeAnterior, setPuedeAnterior] = useState(false);
  const [puedeSiguiente, setPuedeSiguiente] = useState(promociones.length > 1);

  const actualizar = useCallback(() => {
    const elemento = carril.current;
    if (!elemento) return;
    setPuedeAnterior(elemento.scrollLeft > 4);
    setPuedeSiguiente(elemento.scrollLeft + elemento.clientWidth < elemento.scrollWidth - 4);
  }, []);

  useEffect(() => {
    actualizar();
    window.addEventListener("resize", actualizar);
    return () => window.removeEventListener("resize", actualizar);
  }, [actualizar]);

  function mover(direccion: 1 | -1) {
    const elemento = carril.current;
    const tarjeta = elemento?.firstElementChild as HTMLElement | null;
    if (!elemento || !tarjeta) return;
    const gap = Number.parseFloat(getComputedStyle(elemento).columnGap || "0");
    elemento.scrollBy({ left: direccion * (tarjeta.offsetWidth + gap), behavior: "smooth" });
  }

  return (
    <div className="relative">
      <button type="button" onClick={() => mover(-1)} disabled={!puedeAnterior} aria-label="Ver promoción anterior" className="absolute -left-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-card text-ink shadow-xl transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 md:flex">
        <Flecha direccion="anterior" />
      </button>
      <div ref={carril} onScroll={actualizar} className="flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {promociones.map((promocion) => (
          <div key={promocion.id} className="min-w-[88%] snap-start sm:min-w-[calc(50%-0.625rem)] lg:min-w-[calc(33.333%-0.84rem)]">
            <PromocionCard promocion={promocion} />
          </div>
        ))}
      </div>
      <button type="button" onClick={() => mover(1)} disabled={!puedeSiguiente} aria-label="Ver promoción siguiente" className="absolute -right-5 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-card text-ink shadow-xl transition hover:scale-105 disabled:pointer-events-none disabled:opacity-0 md:flex">
        <Flecha direccion="siguiente" />
      </button>
      <div className="mt-3 flex justify-end gap-2 md:hidden">
        <button type="button" onClick={() => mover(-1)} disabled={!puedeAnterior} aria-label="Ver promoción anterior" className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/15 text-ink disabled:opacity-35"><Flecha direccion="anterior" /></button>
        <button type="button" onClick={() => mover(1)} disabled={!puedeSiguiente} aria-label="Ver promoción siguiente" className="flex h-11 w-11 items-center justify-center rounded-xl border border-ink/15 text-ink disabled:opacity-35"><Flecha direccion="siguiente" /></button>
      </div>
    </div>
  );
}
