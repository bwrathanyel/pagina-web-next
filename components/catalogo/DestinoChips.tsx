"use client";

import { useId } from "react";
import { m } from "motion/react";
import { FILA_FIJA } from "@/components/layout/filaFija";

// Filtro por destino. El fondo del chip elegido es un solo elemento que se
// desliza de un chip al siguiente (layoutId); con reduced-motion MotionConfig
// lo deja saltar sin animar. El id de instancia evita que dos filtros en la
// misma página compartan el indicador. `fijo` la pega bajo la barra (listas
// largas); en el carrusel de la home no hace falta.
export function DestinoChips({
  destinos,
  activo,
  onChange,
  fijo = false,
}: {
  destinos: string[];
  activo: string | null;
  onChange: (destino: string | null) => void;
  fijo?: boolean;
}) {
  const instancia = useId();
  if (destinos.length === 0) return null;

  const chip = (valor: string | null, etiqueta: string) => {
    const elegido = activo === valor;
    return (
      <button
        key={valor ?? "todos"}
        type="button"
        onClick={() => onChange(valor)}
        aria-pressed={elegido}
        className={
          "relative min-h-11 shrink-0 snap-start rounded-pill border px-4 text-sm font-semibold transition-colors duration-150 " +
          (elegido
            ? "border-transparent text-sobre-acento"
            : "border-linea-fuerte bg-card text-ink-soft hover:border-ink/40 hover:text-ink")
        }
      >
        {elegido ? (
          <m.span
            layoutId={`destino-activo-${instancia}`}
            aria-hidden="true"
            transition={{ type: "spring", stiffness: 500, damping: 38 }}
            className="absolute inset-0 rounded-pill bg-acento"
          />
        ) : null}
        <span className="relative">{etiqueta}</span>
      </button>
    );
  };

  const fila = (
    <div
      className={
        "flex gap-2 overflow-x-auto px-5 py-1 scroll-px-5 snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_92%,transparent)] " +
        (fijo ? "" : "-mx-5 mb-6")
      }
    >
      {chip(null, "Todos")}
      {destinos.map((destino) => chip(destino, destino))}
    </div>
  );

  return fijo ? <div className={FILA_FIJA + " mb-6"}>{fila}</div> : fila;
}
