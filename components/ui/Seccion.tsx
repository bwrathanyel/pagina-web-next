type Ritmo = "normal" | "densa" | "intro";
type Ancho = true | false | "medio";

const RITMO: Record<Ritmo, string> = {
  normal: "py-9 md:py-20 xl:py-24",
  densa: "py-7 md:py-14 xl:py-20",
  intro: "py-6 md:py-16 xl:py-20",
};

const ANCHO: Record<"true" | "medio", string> = {
  true: "mx-auto max-w-[var(--ancho-contenido)]",
  medio: "mx-auto max-w-[var(--ancho-medio)]",
};

/** Envoltorio de sección con el ritmo vertical estándar del sitio -- evita que
 * cada sección invente su propio py-* (era la causa del aire excesivo entre
 * bloques en móvil, auditoría de rediseño 2026-08-14). `ancho="medio"` es
 * para bloques de puro texto -- a --ancho-contenido (86rem) la línea de
 * lectura queda demasiado larga (auditoría redesign desktop 2026-08-22). */
export function Seccion({
  ritmo = "normal",
  ancho = true,
  className = "",
  children,
}: {
  ritmo?: Ritmo;
  ancho?: Ancho;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`px-5 ${RITMO[ritmo]} ${className}`}>
      {ancho ? <div className={ANCHO[ancho === true ? "true" : "medio"]}>{children}</div> : children}
    </section>
  );
}
