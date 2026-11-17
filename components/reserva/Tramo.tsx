"use client";

import type { ReactNode } from "react";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import type { TramoId } from "@/lib/checkout/tramos";

/** Un tramo numerado del mostrador. En el teléfono, terminado y sin reabrir, se pliega a una línea de
 * resumen con «Cambiar»; el contenido sigue montado (solo `max-lg:hidden`), así no pierde estado ni
 * los `data-campo` que usa `enfocar()`. Desde `lg` siempre queda abierto y lo terminado lleva check y
 * el canto de marca. */
export function Tramo({
  id,
  numero,
  titulo,
  resumen,
  completo,
  abierto,
  editando,
  onCambiar,
  onListo,
  children,
}: {
  id: TramoId;
  numero: number;
  titulo: string;
  resumen: string;
  completo: boolean;
  abierto: boolean;
  /** Reabierto con «Cambiar»: muestra «Listo» y entra con `panel-entra`. */
  editando: boolean;
  onCambiar: () => void;
  onListo: () => void;
  children: ReactNode;
}) {
  const idTitulo = `tramo-${id}-titulo`;
  const idPanel = `tramo-${id}-panel`;
  return (
    <section id={`tramo-${id}`} aria-labelledby={idTitulo} className="relative flex scroll-mt-20 flex-col gap-3 lg:scroll-mt-28 lg:pl-6">
      <span aria-hidden="true" className={"absolute inset-y-0 left-0 hidden w-1 lg:block " + (completo ? "franja-marca" : "bg-linea")} />
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-pill font-mono text-sm font-bold transition-colors duration-150 ease-salida " +
            (completo ? "bg-acento text-sobre-acento" : "border border-linea-fuerte text-ink")
          }
        >
          {completo ? <Icono nombre="check" tamano={16} /> : numero}
        </span>
        <h2 id={idTitulo} tabIndex={-1} className="min-w-0 flex-1 font-display text-xl font-bold text-ink">
          {titulo}
          {completo ? <span className="sr-only"> (listo)</span> : null}
        </h2>
      </div>

      {!abierto ? (
        <button
          type="button"
          onClick={onCambiar}
          aria-expanded={false}
          aria-controls={idPanel}
          className="-mt-1 flex min-h-11 w-full items-center gap-3 pl-11 text-left lg:hidden"
        >
          <span className="min-w-0 flex-1 truncate text-sm text-ink-soft">{resumen}</span>
          <span className="shrink-0 text-sm font-semibold text-acento underline underline-offset-2">
            Cambiar<span className="sr-only"> {titulo.toLowerCase()}</span>
          </span>
        </button>
      ) : null}

      <div id={idPanel} className={"flex flex-col gap-4 " + (!abierto ? "max-lg:hidden" : editando ? "panel-entra" : "")}>
        {children}
        {editando && abierto ? (
          <div className="lg:hidden">
            <Boton type="button" variante="secundario" tamano="sm" onClick={onListo} aria-controls={idPanel}>
              Listo
            </Boton>
          </div>
        ) : null}
      </div>
    </section>
  );
}
