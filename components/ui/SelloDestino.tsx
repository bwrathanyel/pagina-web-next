import type { CSSProperties } from "react";
import { selloDestino } from "@/lib/arte";

/** Sello de pasaporte del destino: tinta única. Se pinta con `currentColor`
 * a través de la máscara del webp, así que el color lo pone el token de texto
 * que pase quien lo usa (gira con el tema). Decorativo. */
export function SelloDestino({
  destino,
  tamano = 40,
  className = "",
}: {
  destino: string;
  /** Lado en px; hasta 48 usa la variante de 192, si no la de 384. */
  tamano?: number;
  className?: string;
}) {
  const slug = selloDestino(destino);
  if (!slug) return null;
  const url = `url(/arte/sellos/${slug}-${tamano <= 48 ? 192 : 384}.webp)`;
  const estilo: CSSProperties = {
    width: tamano,
    height: tamano,
    backgroundColor: "currentColor",
    maskImage: url,
    WebkitMaskImage: url,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center",
  };
  return <span aria-hidden="true" style={estilo} className={`pointer-events-none inline-block shrink-0 ${className}`} />;
}
