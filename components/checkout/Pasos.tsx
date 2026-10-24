import { Icono } from "@/components/ui/Icono";

const PASOS = ["Reservar", "Pagar", "Listo"] as const;

/** «1 Reservar · 2 Pagar · 3 Listo»: dónde está el cliente en la compra directa. */
export function Pasos({ actual, className = "" }: { actual: 1 | 2 | 3; className?: string }) {
  return (
    <ol aria-label="Pasos de la compra" className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs ${className}`}>
      {PASOS.map((nombre, i) => {
        const n = i + 1;
        const hecho = n < actual;
        const ahora = n === actual;
        return (
          <li key={nombre} aria-current={ahora ? "step" : undefined} className="flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className={
                "flex h-5 w-5 items-center justify-center rounded-pill font-mono text-xs font-bold " +
                (ahora
                  ? "bg-acento text-sobre-acento"
                  : hecho
                    ? "bg-seafoam-bg text-seafoam-text"
                    : "border border-linea-fuerte text-ink-soft")
              }
            >
              {hecho ? <Icono nombre="check" tamano={12} /> : n}
            </span>
            <span className={ahora ? "font-bold text-ink" : "font-semibold text-ink-soft"}>
              {nombre}
              {hecho ? <span className="sr-only"> (hecho)</span> : null}
            </span>
            {n < PASOS.length ? <span aria-hidden="true" className="text-ink-soft">·</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
