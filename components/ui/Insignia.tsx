import type { ReactNode } from "react";

/** Contador sobre un icono (carrito, notificaciones, asistente). Antes había
 * dos copias distintas (HeaderControls y ContactoFab). El `key` por valor
 * reinicia la animación cada vez que sube la cuenta. */
export function Contador({ valor, max = 9, className = "" }: { valor: number; max?: number; className?: string }) {
  if (valor <= 0) return null;
  return (
    <span
      key={valor}
      className={
        "animate-carrito-rebote pointer-events-none absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center " +
        "rounded-pill bg-acento px-1 text-xs font-bold leading-none text-sobre-acento tabular-nums ring-2 ring-card " +
        className
      }
    >
      {valor > max ? `${max}+` : valor}
      <span className="sr-only"> {valor === 1 ? "elemento" : "elementos"}</span>
    </span>
  );
}

type TonoEtiqueta = "acento" | "ambar" | "seafoam" | "neutro" | "dusk";

const TONOS: Record<TonoEtiqueta, string> = {
  acento: "bg-acento-suave text-acento",
  ambar: "bg-ambar-suave text-ambar",
  seafoam: "bg-seafoam-bg text-seafoam-text",
  neutro: "bg-sand-2 text-ink-soft",
  dusk: "bg-dusk/80 text-dusk-text",
};

/** Etiqueta de estado corta, estilo sello de boleto: "Hot Sale", "Agotado",
 * "Hasta 30 nov". Mono porque es dato (fecha, código, estado), no adorno. */
export function Etiqueta({
  tono = "neutro",
  icono,
  className = "",
  children,
}: {
  tono?: TonoEtiqueta;
  icono?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={
        "inline-flex items-center gap-1 rounded-control px-2 py-1 font-mono text-xs font-bold uppercase leading-none tracking-wide " +
        TONOS[tono] +
        " " +
        className
      }
    >
      {icono}
      {children}
    </span>
  );
}
