"use client";

import { useRef, useState, type ReactNode } from "react";

/** Carrusel horizontal con snap + puntos indicadores, para no repetir el
 * mismo patrón de scroll-x a mano en cada sección (Hot Sales, Más de Lotus
 * 360, etc). En `sm`/`lg` puede volver a grid vía la prop `desktop`. */
export function Carrusel({
  items,
  anchoItem = "78%",
  maxItem = "280px",
  desktop = "",
  gap = "gap-4",
  className = "",
}: {
  items: ReactNode[];
  anchoItem?: string;
  maxItem?: string;
  desktop?: string;
  gap?: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);
  const raf = useRef<number | null>(null);

  function onScroll() {
    const el = scrollerRef.current;
    if (!el || raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const anchoItemPx = el.scrollWidth / items.length;
      const indice = Math.round(el.scrollLeft / anchoItemPx);
      setActivo(Math.min(items.length - 1, Math.max(0, indice)));
    });
  }

  function irA(i: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const anchoItemPx = el.scrollWidth / items.length;
    el.scrollTo({ left: anchoItemPx * i, behavior: "smooth" });
  }

  return (
    <div className={className}>
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
            className="shrink-0 snap-start sm:w-auto sm:max-w-none"
            style={{ width: anchoItem, maxWidth: maxItem }}
          >
            {item}
          </div>
        ))}
      </div>
      {items.length > 1 ? (
        <div className={"mt-3 flex justify-center gap-1.5 " + (desktop ? "sm:hidden" : "")}>
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Ir a ${i + 1}`}
              onClick={() => irA(i)}
              className={
                "h-1.5 rounded-full transition-all " +
                (i === activo ? "w-5 bg-coral" : "w-1.5 bg-ink/15")
              }
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
