import Link from "next/link";
import { Revelar } from "@/components/ui/Revelar";

/** Encabezado de sección reusable: eyebrow + título + "Ver todas" alineado a
 * la derecha sobre una regla fina. Antes cada sección de home armaba este
 * bloque a mano con clases repetidas (auditoría redesign desktop 2026-08-22).
 * `eyebrow`/`titulo` se reciben ya renderizados (normalmente `EditableText`)
 * porque el contenido editable no es un string plano. */
export function EncabezadoSeccion({
  eyebrow,
  titulo,
  verTodasHref,
  verTodasLabel = "Ver todas",
}: {
  eyebrow?: React.ReactNode;
  titulo: React.ReactNode;
  verTodasHref?: string;
  verTodasLabel?: string;
}) {
  return (
    <Revelar as="div" className="mb-6 flex items-end justify-between gap-4 border-b border-linea pb-5 md:mb-10 md:pb-6">
      <div>
        {eyebrow}
        {titulo}
      </div>
      {verTodasHref ? (
        <Link
          href={verTodasHref}
          className="hidden min-h-11 shrink-0 items-center gap-1.5 text-sm font-semibold text-coral sm:flex"
        >
          {verTodasLabel}
          <span aria-hidden="true">↗</span>
        </Link>
      ) : null}
    </Revelar>
  );
}
