type Ritmo = "normal" | "densa" | "intro";

const RITMO: Record<Ritmo, string> = {
  normal: "py-9 md:py-20",
  densa: "py-7 md:py-14",
  intro: "py-6 md:py-16",
};

/** Envoltorio de sección con el ritmo vertical estándar del sitio -- evita que
 * cada sección invente su propio py-* (era la causa del aire excesivo entre
 * bloques en móvil, auditoría de rediseño 2026-08-14). */
export function Seccion({
  ritmo = "normal",
  ancho = true,
  className = "",
  children,
}: {
  ritmo?: Ritmo;
  ancho?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`px-5 ${RITMO[ritmo]} ${className}`}>
      {ancho ? <div className="mx-auto max-w-6xl">{children}</div> : children}
    </section>
  );
}
