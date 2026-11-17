import Image from "next/image";

/** Panorámica marina para bandas `dusk`: capa decorativa que va dentro de un
 * contenedor `relative overflow-hidden bg-dusk`; el texto va encima, en un
 * hijo `relative`. La imagen se ancla a la derecha (el lado libre de texto) y
 * un velo desde `dusk` cubre el lado del texto para sostener el contraste AA.
 * Sobre `dusk` fijo, igual en claro y en oscuro. */
export function FondoDusk({
  fondo,
  prioridad = false,
}: {
  /** costa-dusk: palmeras abajo a la derecha. cielo-dusk: avión a la derecha. */
  fondo: "costa-dusk" | "cielo-dusk";
  prioridad?: boolean;
}) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 [contain:strict]">
      <Image
        src={`/arte/fondos/${fondo}.webp`}
        alt=""
        fill
        sizes="100vw"
        loading={prioridad ? undefined : "lazy"}
        priority={prioridad}
        className={`object-cover ${fondo === "costa-dusk" ? "object-right-bottom" : "object-right"}`}
      />
      <span className="absolute inset-0 bg-gradient-to-r from-dusk from-30% via-dusk/85 to-dusk/50" />
    </div>
  );
}
