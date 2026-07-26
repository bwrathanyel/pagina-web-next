import Link from "next/link";

/** Aviso de vacantes en la home. Reemplaza a "Experiencias pensadas para ti"
 * (CategoriasDestacadas) -- pedido del dueño 2026-07-26: esas categorías ya
 * están en el nav y en el catálogo, el espacio rinde más avisando que estamos
 * contratando. Es un Server Component a propósito: solo texto y un link, no
 * necesita JS en el cliente. */
export function TrabajaConNosotrosBanner() {
  return (
    <section className="bg-card px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[32px] bg-dusk">
          <div className="grid gap-8 p-8 md:grid-cols-[1.4fr_1fr] md:items-center md:p-14">
            <div>
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-gold">
                Estamos contratando
              </p>
              <h2 className="max-w-[16ch] text-balance font-display text-3xl font-semibold leading-tight text-dusk-text md:text-5xl">
                ¿Y si tu próximo destino es trabajar con nosotros?
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-dusk-text-soft">
                Buscamos gente para sumarse al equipo, en la oficina de Naguanagua y también en
                modalidad freelance desde casa. Conoce las vacantes, los requisitos y postúlate en
                minutos — puedes conversar con nuestra asistente y contarle tu perfil ahí mismo.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/trabaja-con-nosotros"
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 font-display text-base font-semibold text-dusk transition-transform hover:-translate-y-0.5"
                >
                  Ver vacantes y postularme
                  <span aria-hidden="true">↗</span>
                </Link>
                <span className="text-sm text-dusk-text-soft">Presencial en Valencia · Freelance remoto</span>
              </div>
            </div>

            <ul className="flex flex-col gap-3">
              {[
                "Asesor de Ventas",
                "Asistente Administrativo",
                "Community Manager / Diseñador",
                "Asesor de Boletería",
                "Asesor de Ventas Freelance",
              ].map((rol) => (
                <li
                  key={rol}
                  className="flex items-center gap-3 rounded-2xl border border-dusk-text/12 bg-dusk-2 px-4 py-3 text-sm text-dusk-text"
                >
                  <span aria-hidden="true" className="text-gold">
                    ✦
                  </span>
                  {rol}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
