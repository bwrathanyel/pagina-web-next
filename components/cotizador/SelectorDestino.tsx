"use client";

import Image from "next/image";
import { useId, useRef, type CSSProperties, type KeyboardEvent } from "react";
import { Icono } from "@/components/ui/Icono";
import { DESTINOS } from "@/lib/cotizador/estado";
import { portadaDestino } from "@/lib/promociones/fotosDestino";

// Destino de /cotizar: un botón con la foto y el nombre, y un popover con una
// tarjeta con foto por destino (pedido del dueño al revisar E1, 2026-09-25).
// Mismo patrón que SelectorViajeros: capa superior, Esc y clic afuera cierran.
// Las tarjetas son un radiogroup: flechas mueven y eligen, Enter o clic cierran.
// Destino sin foto propia: fondo de marca, nunca la foto de otro lugar.

const nombreDe = (d: string) => (d === "Extranjero" ? "Viajar al extranjero" : d);

export function SelectorDestino({
  id,
  valor,
  onCambio,
  className = "",
}: {
  id: string;
  valor: string;
  onCambio: (destino: string) => void;
  className?: string;
}) {
  const idPanel = useId();
  const panel = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const ancla = `--destino-${idPanel.replace(/[^a-zA-Z0-9]/g, "")}`;
  const portada = portadaDestino(valor);

  const cerrar = () => {
    panel.current?.hidePopover();
    boton.current?.focus();
  };

  const mover = (ev: KeyboardEvent<HTMLDivElement>) => {
    const paso = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!paso) return;
    ev.preventDefault();
    const i = DESTINOS.indexOf(valor);
    const siguiente = DESTINOS[(i + paso + DESTINOS.length) % DESTINOS.length];
    onCambio(siguiente);
    panel.current?.querySelector<HTMLButtonElement>(`[data-destino="${siguiente}"]`)?.focus();
  };

  return (
    <>
      <button
        ref={boton}
        id={id}
        type="button"
        popoverTarget={idPanel}
        aria-label={`Destino: ${nombreDe(valor)}`}
        style={{ anchorName: ancla } as CSSProperties}
        className={`flex items-center gap-3 text-left ${className}`}
      >
        <span className="relative -my-1 h-8 w-11 shrink-0 overflow-hidden rounded-md bg-dusk-2" aria-hidden="true">
          {portada ? <Image src={portada.url} alt="" fill sizes="44px" className="object-cover" /> : null}
        </span>
        <span className="min-w-0 truncate">{nombreDe(valor)}</span>
        <Icono nombre="chevron-abajo" tamano={18} className="ml-auto shrink-0 text-ink-soft" />
      </button>

      <div
        ref={panel}
        id={idPanel}
        popover="auto"
        role="dialog"
        aria-labelledby={`${idPanel}-titulo`}
        onToggle={(e) => {
          if (e.newState === "open")
            panel.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
        }}
        style={{ positionAnchor: ancla } as CSSProperties}
        className="calendario-flotante w-[min(46rem,calc(100vw-2rem))] rounded-card bg-card p-4 text-ink shadow-chrome"
      >
        <p id={`${idPanel}-titulo`} className="mb-3 font-semibold">
          ¿A dónde quiere viajar?
        </p>
        <div
          role="radiogroup"
          aria-labelledby={`${idPanel}-titulo`}
          onKeyDown={mover}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {DESTINOS.map((d) => {
            const foto = portadaDestino(d);
            const elegido = d === valor;
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={elegido}
                tabIndex={elegido ? 0 : -1}
                data-destino={d}
                onClick={() => {
                  onCambio(d);
                  cerrar();
                }}
                className={`group relative flex aspect-4/3 flex-col justify-end overflow-hidden rounded-card bg-dusk-2 text-left text-dusk-text transition-[box-shadow,scale] duration-150 ease-salida motion-reduce:transition-none motion-reduce:active:scale-100 active:scale-[0.985] ${
                  elegido ? "ring-3 ring-acento ring-offset-2 ring-offset-card" : ""
                }`}
              >
                {foto ? (
                  <>
                    <Image
                      src={foto.url}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 11rem, 45vw"
                      className="object-cover transition-[scale] duration-700 ease-salida motion-reduce:transition-none motion-reduce:group-hover:scale-100 group-hover:scale-[1.04]"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-dusk from-10% via-dusk/60 to-transparent"
                    />
                  </>
                ) : null}
                <span className="relative p-3 text-balance font-display text-lg font-bold leading-tight tracking-[-0.01em]">
                  {nombreDe(d)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
