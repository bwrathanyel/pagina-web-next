import Image from "next/image";
import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";

export function PlanesCorporativos() {
  return (
    <section className="px-5 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[36px] bg-dusk text-dusk-text lg:grid-cols-[1fr_.72fr]">
        <div className="p-8 md:p-14">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral">Viajes y eventos corporativos</p>
          <h2 className="max-w-[13ch] text-balance font-display text-4xl font-semibold leading-[1.05] md:text-6xl">Grandes experiencias para grandes equipos.</h2>
          <p className="mt-6 max-w-xl leading-7 text-dusk-text-soft">Organizamos eventos, fiestas temáticas, paquetes vacacionales y actividades de integración institucional con atención cercana de principio a fin.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={whatsappHref("Hola! Vengo de su página web y quiero información sobre planes corporativos.")} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white">Planificar una experiencia</a>
            <a href={`mailto:${REDES.email}`} className="inline-flex min-h-12 items-center justify-center rounded-full border border-dusk-text/20 px-7 font-semibold text-dusk-text">Contacto corporativo</a>
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden lg:min-h-full">
          <Image
            src="/images/editorial/experiencia-corporativa.png"
            alt="Equipo planificando una experiencia corporativa"
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-black/30 p-5 text-white backdrop-blur-md">
            <p className="font-display text-2xl font-semibold">Un plan que se siente propio.</p>
            <p className="mt-1 text-sm text-white/75">Diseñado alrededor de tu equipo y tus objetivos.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
