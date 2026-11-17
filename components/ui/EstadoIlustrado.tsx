import Image from "next/image";
import type { CSSProperties } from "react";
import type { EstadoArte } from "@/lib/arte";

/** Ventanilla cuadrada con la ilustración de un estado (sin resultados, error…).
 * Siempre sobre `dusk` fijo, en claro y en oscuro. Decorativa: el texto vecino
 * dice lo que pasa. El loader de imágenes deja pasar las rutas locales tal cual. */
export function EstadoIlustrado({
  estado,
  tamano = 8,
  className = "",
}: {
  estado: EstadoArte;
  /** Lado en rem; hasta 10 usa la variante de 320, si no la de 640. */
  tamano?: number;
  className?: string;
}) {
  const px = tamano * 16;
  const estilo: CSSProperties = { width: `${tamano}rem`, height: `${tamano}rem` };
  return (
    <span aria-hidden="true" style={estilo} className={`relative block shrink-0 overflow-hidden rounded-card bg-dusk ${className}`}>
      <Image
        src={`/arte/estados/${estado}-${tamano <= 10 ? 320 : 640}.webp`}
        alt=""
        width={px}
        height={px}
        sizes={`${px}px`}
        loading="lazy"
        className="size-full object-cover"
      />
    </span>
  );
}
