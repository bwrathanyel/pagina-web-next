import Link from "next/link";
import { Revelar } from "@/components/ui/Revelar";
import { Icono } from "@/components/ui/Icono";

/** Clases del título de sección (h2): Archivo condensada, la voz de
 * señalética del sitio. Exportadas para las secciones que arman su propio
 * encabezado (MasDeLotus, Footer) y no se repitan a mano. */
export const CLASE_TITULO_SECCION =
  "max-w-[22ch] text-balance font-display text-3xl font-bold leading-[1.02] tracking-[-0.015em] md:text-5xl";

/** Clases de la etiqueta en mono que acompaña al título. Va DEBAJO del título,
 * como dato del pase (vuelo, puerta), nunca como kicker encima. */
export const CLASE_ETIQUETA_SECCION = "mt-3 font-mono text-xs font-bold uppercase tracking-[0.14em]";

/** Encabezado de sección reusable: título + etiqueta + "Ver todas" alineado a
 * la derecha sobre una regla fina. `titulo`/`etiqueta` se reciben ya
 * renderizados (normalmente `EditableText`) porque el contenido editable no es
 * un string plano. */
export function EncabezadoSeccion({
  etiqueta,
  titulo,
  verTodasHref,
  verTodasLabel = "Ver todas",
}: {
  etiqueta?: React.ReactNode;
  titulo: React.ReactNode;
  verTodasHref?: string;
  verTodasLabel?: string;
}) {
  return (
    <Revelar as="div" className="mb-6 flex items-end justify-between gap-4 border-b border-linea pb-5 md:mb-10 md:pb-6">
      <div>
        {titulo}
        {etiqueta}
      </div>
      {verTodasHref ? (
        <Link
          href={verTodasHref}
          className="hidden min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-acento underline-offset-4 hover:underline sm:flex"
        >
          {verTodasLabel}
          <Icono nombre="flecha-der" tamano={16} />
        </Link>
      ) : null}
    </Revelar>
  );
}
