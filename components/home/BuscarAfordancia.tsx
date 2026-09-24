"use client";

import { Icono } from "@/components/ui/Icono";
import { usePaneles } from "@/lib/layout/paneles";

/** Campo de búsqueda de la home en el teléfono. Parece un input pero abre el
 * buscador global (el mismo del header y de ⌘K): antes montaba BuscarClient
 * acá y eso obligaba a mandar el catálogo entero (hoteles, paquetes y tours
 * con sus tarifas) dentro de la home, solo para filtrar en vivo. */
export function BuscarAfordancia() {
  const abrirBuscador = usePaneles((s) => s.abrirBuscador);
  return (
    <div className="px-5 pb-2 pt-5 lg:hidden">
      <button
        type="button"
        onClick={abrirBuscador}
        aria-haspopup="dialog"
        className="flex min-h-12 w-full items-center gap-3 rounded-pill border border-linea-fuerte bg-card px-5 text-left text-base text-ink-soft transition-colors duration-150 hover:border-ink/40"
      >
        <Icono nombre="buscar" tamano={18} />
        ¿A dónde quiere viajar?
      </button>
    </div>
  );
}
