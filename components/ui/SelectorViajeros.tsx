"use client";

import { useId, useRef, type CSSProperties } from "react";
import { Icono } from "@/components/ui/Icono";

// Viajeros del cotizador rápido: un botón con el resumen y un popover con un
// contador por tipo, igual que SelectorFecha (capa superior, Esc y clic afuera
// lo cierran). Viaja en inputs ocultos; niños y bebés solo si hay.

export interface Viajeros {
  adultos: number;
  ninos: number;
  bebes: number;
}

const contar = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** "2 adultos · 1 niño · 1 bebé": niños y bebés solo si viajan. */
export function resumenViajeros({ adultos, ninos, bebes }: Viajeros) {
  return [
    contar(adultos, "adulto", "adultos"),
    ninos > 0 && contar(ninos, "niño", "niños"),
    bebes > 0 && contar(bebes, "bebé", "bebés"),
  ]
    .filter(Boolean)
    .join(" · ");
}

const FILAS = [
  { clave: "adultos", etiqueta: "Adultos", detalle: "12 años o más", unidad: "adulto", min: 1 },
  { clave: "ninos", etiqueta: "Niños", detalle: "De 2 a 11 años", unidad: "niño", min: 0 },
  { clave: "bebes", etiqueta: "Bebés", detalle: "Menores de 2 años", unidad: "bebé", min: 0 },
] as const;

const PASO =
  "flex h-11 w-11 items-center justify-center rounded-full border border-linea-fuerte text-ink " +
  "transition-colors duration-150 ease-salida enabled:hover:border-ink/40 enabled:hover:bg-sand-2 disabled:opacity-35";

interface Props {
  id: string;
  valor: Viajeros;
  onCambio: (valor: Viajeros) => void;
  maximos: Viajeros;
  className?: string;
}

export function SelectorViajeros({ id, valor, onCambio, maximos, className = "" }: Props) {
  const idPanel = useId();
  const panel = useRef<HTMLDivElement>(null);
  const ancla = `--viajeros-${idPanel.replace(/[^a-zA-Z0-9]/g, "")}`;
  const texto = resumenViajeros(valor);

  return (
    <>
      <button
        id={id}
        type="button"
        popoverTarget={idPanel}
        aria-label={`Viajeros: ${texto}`}
        style={{ anchorName: ancla } as CSSProperties}
        className={`flex items-center gap-2 text-left ${className}`}
      >
        <span className="min-w-0 truncate">{texto}</span>
        <Icono nombre="chevron-abajo" tamano={18} className="ml-auto shrink-0 text-ink-soft" />
      </button>
      <input type="hidden" name="adultos" value={valor.adultos} />
      <input type="hidden" name="ninos" value={valor.ninos} disabled={!valor.ninos} />
      <input type="hidden" name="bebes" value={valor.bebes} disabled={!valor.bebes} />

      <div
        ref={panel}
        id={idPanel}
        popover="auto"
        role="dialog"
        aria-label="Elegir viajeros"
        onToggle={(e) => {
          if (e.newState === "open") panel.current?.querySelector<HTMLButtonElement>("button:enabled")?.focus();
        }}
        style={{ positionAnchor: ancla } as CSSProperties}
        className="calendario-flotante w-80 rounded-card bg-card p-4 text-ink shadow-chrome"
      >
        <ul className="divide-y divide-linea">
          {FILAS.map((f) => {
            const n = valor[f.clave];
            const idEtiqueta = `${idPanel}-${f.clave}`;
            return (
              <li key={f.clave} className="flex items-center justify-between gap-4 py-3 first:pt-1">
                <div id={idEtiqueta}>
                  <p className="font-semibold">{f.etiqueta}</p>
                  <p className="text-sm text-ink-soft">{f.detalle}</p>
                </div>
                <div role="group" aria-labelledby={idEtiqueta} className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCambio({ ...valor, [f.clave]: n - 1 })}
                    disabled={n <= f.min}
                    aria-label={`Quitar un ${f.unidad}`}
                    className={PASO}
                  >
                    <Icono nombre="menos" tamano={18} />
                  </button>
                  <output aria-live="polite" className="w-7 text-center font-mono text-lg font-bold tabular-nums">
                    {n}
                  </output>
                  <button
                    type="button"
                    onClick={() => onCambio({ ...valor, [f.clave]: n + 1 })}
                    disabled={n >= maximos[f.clave]}
                    aria-label={`Agregar un ${f.unidad}`}
                    className={PASO}
                  >
                    <Icono nombre="suma" tamano={18} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-end border-t border-linea pt-3">
          <button
            type="button"
            popoverTarget={idPanel}
            popoverTargetAction="hide"
            className="rounded-control px-3 py-1.5 text-sm font-semibold text-acento transition-colors hover:bg-acento-suave"
          >
            Listo
          </button>
        </div>
      </div>
    </>
  );
}
