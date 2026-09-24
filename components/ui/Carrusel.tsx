"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icono } from "@/components/ui/Icono";

// scrollTo/scrollBy con `behavior: "smooth"` no pasan por el bloque global de
// prefers-reduced-motion (eso solo cubre CSS), así que se decide acá.
const comportamiento = (): ScrollBehavior =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

const CLASE_FLECHA =
  "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-pill border border-linea-fuerte " +
  "bg-card text-ink transition-colors duration-150 hover:border-ink hover:text-acento pointer-fine:flex";

/** Carrusel horizontal con snap + puntos indicadores, para no repetir el
 * mismo patrón de scroll-x a mano en cada sección (Hot Sales, Más de Lotus
 * 360, etc). En `sm`/`lg` puede volver a grid vía la prop `desktop`. Con
 * `flechas` agrega botones prev/next a los costados (solo puntero fino —
 * mouse ya trae swipe/touch en mobile, no hace falta ahí) para el caso en
 * que el carrusel se mantiene horizontal también en desktop (catálogo). */
export function Carrusel({
  items,
  anchoItem = "78%",
  maxItem = "280px",
  desktop = "",
  gap = "gap-4",
  className = "",
  flechas = false,
}: {
  items: ReactNode[];
  anchoItem?: string;
  maxItem?: string;
  desktop?: string;
  gap?: string;
  className?: string;
  flechas?: boolean;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);
  const [puedeIzq, setPuedeIzq] = useState(false);
  const [puedeDer, setPuedeDer] = useState(false);
  const raf = useRef<number | null>(null);

  function actualizarLimites() {
    const el = scrollerRef.current;
    if (!el) return;
    setPuedeIzq(el.scrollLeft > 4);
    setPuedeDer(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    actualizarLimites();
  }, [items.length]);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el || raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const anchoItemPx = el.scrollWidth / items.length;
      const indice = Math.round(el.scrollLeft / anchoItemPx);
      setActivo(Math.min(items.length - 1, Math.max(0, indice)));
      actualizarLimites();
    });
  }

  function irA(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const anchoItemPx = el.scrollWidth / items.length;
    el.scrollTo({ left: anchoItemPx * i, behavior: comportamiento() });
  }

  function desplazar(sentido: 1 | -1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: sentido * el.clientWidth * 0.8, behavior: comportamiento() });
  }

  return (
    <div className={"relative " + className}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={
          `-mx-5 flex snap-x snap-mandatory overflow-x-auto px-5 pb-1 ${gap} ` +
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
          desktop
        }
      >
        {items.map((item, i) => (
          <div
            key={i}
            className={
              "w-[var(--ancho-item)] max-w-[var(--max-item)] shrink-0 snap-start " +
              (desktop ? "sm:w-auto sm:max-w-none" : "")
            }
            style={{ "--ancho-item": anchoItem, "--max-item": maxItem } as React.CSSProperties}
          >
            {item}
          </div>
        ))}
      </div>
      {flechas && puedeIzq ? (
        <button
          type="button"
          aria-label="Anterior"
          onClick={() => desplazar(-1)}
          className={CLASE_FLECHA + " left-1"}
        >
          <Icono nombre="flecha-izq" tamano={20} />
        </button>
      ) : null}
      {flechas && puedeDer ? (
        <button
          type="button"
          aria-label="Siguiente"
          onClick={() => desplazar(1)}
          className={CLASE_FLECHA + " right-1"}
        >
          <Icono nombre="flecha-der" tamano={20} />
        </button>
      ) : null}
      {items.length > 1 ? (
        <div className={"mt-3 flex justify-center gap-1.5 " + (desktop ? "sm:hidden" : "")}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir a ${i + 1}`}
              onClick={() => irA(i)}
              aria-current={i === activo}
              className="flex h-6 min-w-6 items-center justify-center"
            >
              <span
                className={
                  "block h-1.5 rounded-pill transition-[width,background-color] duration-150 " +
                  (i === activo ? "w-5 bg-acento" : "w-1.5 bg-ink/20")
                }
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
