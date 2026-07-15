import Image from "next/image";
import Link from "next/link";

const SERVICIOS = [
  {
    href: "/catalogo/paquetes",
    etiqueta: "Escapadas",
    titulo: "Un día puede cambiarte la semana.",
    desc: "Full days y experiencias para salir de la rutina.",
    foto: "/images/editorial/escapada-caribe.png",
    clase: "md:col-span-7 md:min-h-[520px]",
    sizes: "(min-width: 768px) 58vw, 100vw",
  },
  {
    href: "/catalogo/hoteles",
    etiqueta: "Hospedajes",
    titulo: "Descansa donde realmente quieres estar.",
    desc: "Hoteles, posadas y opciones seleccionadas para cada plan.",
    foto: null,
    clase: "md:col-span-5 md:min-h-[520px]",
    sizes: "(min-width: 768px) 42vw, 100vw",
  },
  {
    href: "/cotizar/boleteria",
    etiqueta: "Boletería",
    titulo: "Del aeropuerto a tu próxima historia.",
    desc: "Rutas nacionales e internacionales pensadas contigo.",
    foto: "/images/editorial/vuelo-a-tu-medida.png",
    clase: "md:col-span-5 md:min-h-[420px]",
    sizes: "(min-width: 768px) 42vw, 100vw",
  },
  {
    href: "/catalogo/guias-tours",
    etiqueta: "Guías y tours",
    titulo: "Descubre más que un destino.",
    desc: "Experiencias acompañadas para mirar cada lugar de otra manera.",
    foto: "/images/editorial/tour-tropical.png",
    clase: "md:col-span-7 md:min-h-[420px]",
    sizes: "(min-width: 768px) 58vw, 100vw",
  },
];

export function ServiciosGrid({ fotoHotel }: { fotoHotel?: string | null }) {
  return (
    <section aria-labelledby="servicios-heading">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral">
            Todo para tu viaje
          </p>
          <h2
            id="servicios-heading"
            className="max-w-[15ch] text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.03em] text-ink md:text-6xl"
          >
            Elige cómo quieres volver a sentirte.
          </h2>
        </div>
        <div className="max-w-sm md:text-right">
          <p className="mb-4 leading-7 text-ink-soft">
            Explora opciones listas para disfrutar o cuéntanos tu idea y la construimos contigo.
          </p>
          <Link
            href="/cotizador-personalizado"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/15 bg-card px-6 font-semibold text-ink transition-colors hover:border-coral hover:text-coral"
          >
            Diseñar mi viaje <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <nav aria-label="Servicios principales" className="grid gap-4 md:grid-cols-12">
        {SERVICIOS.map((servicio, index) => {
          const foto = index === 1 ? fotoHotel || "/images/editorial/escapada-caribe.png" : servicio.foto!;
          return (
            <Link
              key={servicio.href}
              href={servicio.href}
              className={`group relative min-h-[380px] overflow-hidden rounded-[32px] bg-dusk shadow-[0_24px_70px_rgba(36,31,26,.14)] ${servicio.clase}`}
            >
              <Image
                src={foto}
                alt=""
                fill
                sizes={servicio.sizes}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/30 bg-black/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md">
                    {servicio.etiqueta}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-[#18181b] transition-transform group-hover:rotate-45" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <h3 className="max-w-[15ch] text-balance font-display text-3xl font-semibold leading-[1.02] md:text-4xl">
                  {servicio.titulo}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/78 md:text-base">
                  {servicio.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
