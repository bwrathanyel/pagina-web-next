import Link from "next/link";

const SERVICIOS = [
  {
    href: "/catalogo/paquetes",
    numero: "01",
    titulo: "Escapadas y Full Days",
    desc: "Cambia de aire, descubre lugares increíbles y regresa con una historia nueva.",
    color: "from-[#dcefea] to-[#f4f0e6]",
    icon: <path d="M12 3a5 5 0 0 0-5 5v1H5a2 2 0 0 0-2 2v1a9 9 0 0 0 18 0v-1a2 2 0 0 0-2-2h-2V8a5 5 0 0 0-5-5Z" />,
  },
  {
    href: "/catalogo/hoteles",
    numero: "02",
    titulo: "Hospedajes seleccionados",
    desc: "Opciones para descansar, celebrar o desconectarte, con asesoría personalizada.",
    color: "from-[#fde1d8] to-[#f8eddf]",
    icon: <path d="M3 21V7a2 2 0 0 1 2-2h4v16M15 21V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12M9 21V11h4v10M3 21h18" />,
  },
  {
    href: "/cotizar/boleteria",
    numero: "03",
    titulo: "Vuelos a tu medida",
    desc: "Cotiza rutas nacionales e internacionales y recibe acompañamiento de principio a fin.",
    color: "from-[#dce9f8] to-[#f0eee5]",
    icon: <path d="M10.5 21 12 17l-5-2 1-2 6 1 3.5-3.5a1.5 1.5 0 1 0-2-2L12 12l-6-1-2 1 2 5-1 1.5" />,
  },
];

export function ServiciosGrid() {
  return (
    <section aria-labelledby="servicios-heading">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral">Todo para tu viaje</p>
          <h2 id="servicios-heading" className="max-w-[16ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">
            Tú imaginas el destino. Nosotros trazamos el camino.
          </h2>
        </div>
        <Link href="/cotizador-personalizado" className="inline-flex min-h-11 items-center gap-2 font-semibold text-coral">
          Crear un viaje personalizado <span aria-hidden="true">↗</span>
        </Link>
      </div>

      <nav aria-label="Servicios principales" className="grid gap-4 md:grid-cols-3">
        {SERVICIOS.map((s) => (
          <Link key={s.href} href={s.href} className="group relative min-h-[330px] overflow-hidden rounded-[28px] border border-ink/10 bg-card p-7 shadow-[0_14px_40px_rgba(36,31,26,.06)] transition-transform hover:-translate-y-1">
            <span className="font-mono text-xs font-bold text-ink-soft">{s.numero}</span>
            <div className={`absolute left-1/2 top-[44%] flex h-40 w-40 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-gradient-to-br ${s.color} transition-transform duration-500 group-hover:scale-110`}>
              <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.15" strokeLinecap="round" strokeLinejoin="round" className="text-ink/70" aria-hidden="true">{s.icon}</svg>
            </div>
            <div className="absolute inset-x-7 bottom-7">
              <h3 className="font-display text-2xl font-semibold text-ink">{s.titulo}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-soft">{s.desc}</p>
            </div>
          </Link>
        ))}
      </nav>
    </section>
  );
}
