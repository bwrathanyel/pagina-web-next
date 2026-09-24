import type { CSSProperties, ReactNode } from "react";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";

// Tarjeta con forma de pase de abordar: cuerpo + talón separados por una
// perforación, con las muescas recortadas de verdad (máscara boleto-h/-v en
// globals.css). El talón tiene tamaño fijo para que la perforación caiga
// siempre justo en la unión, midan lo que midan las fotos o el texto.
//
// - "h": talón abajo (tarjetas de catálogo, columna angosta en el teléfono).
// - "v": talón a la derecha (filas anchas, CTA de precio en escritorio).
export function Boleto({
  children,
  talon,
  orientacion = "h",
  tamanoTalon = "5rem",
  className = "",
}: {
  children: ReactNode;
  talon: ReactNode;
  orientacion?: "h" | "v";
  /** Alto (en "h") o ancho (en "v") del talón, en unidades CSS. */
  tamanoTalon?: string;
  className?: string;
}) {
  const horizontal = orientacion === "h";
  const estilo = { "--corte": `calc(100% - ${tamanoTalon})` } as CSSProperties;

  return (
    <div
      style={estilo}
      className={
        "relative flex overflow-hidden rounded-card border border-linea bg-card " +
        (horizontal ? "boleto-h flex-col " : "boleto-v flex-row ") +
        className
      }
    >
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
      <div
        style={horizontal ? { height: tamanoTalon } : { width: tamanoTalon }}
        className={"relative shrink-0 " + (horizontal ? "perforacion-h" : "perforacion-v")}
      >
        {talon}
      </div>
    </div>
  );
}

// Contenido típico del talón: precio en mono (convertido a la moneda elegida)
// con su nota, el código de la oferta y el canto con el degradado del logo.
export function TalonPrecio({
  precio,
  nota,
  codigo,
  apagado = false,
  accion,
}: {
  /** Texto ya formateado (precioLabel); PrecioMostrado lo convierte a Bs. */
  precio: string | null | undefined;
  nota?: string | null;
  codigo?: string | null;
  /** Precio "a consultar": se ve en tono secundario. */
  apagado?: boolean;
  /** Botón o enlace del talón (Cotizar, carrito). */
  accion?: ReactNode;
}) {
  return (
    <div className="flex h-full items-center gap-3 px-4">
      <div className="min-w-0 flex-1">
        {codigo ? (
          <p className="truncate font-mono text-xs font-bold uppercase tracking-widest text-ink-soft">{codigo}</p>
        ) : null}
        <p
          className={
            "line-clamp-2 font-mono text-base font-bold leading-tight tabular-nums " +
            (apagado ? "text-ink-soft" : "text-ink")
          }
        >
          <PrecioMostrado texto={precio} />
        </p>
        {nota ? <p className="truncate text-xs text-ink-soft">{nota}</p> : null}
      </div>
      {accion}
      <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
    </div>
  );
}
