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

        <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden bg-gradient-to-br from-coral to-gold p-8">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full border border-white/25" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full border border-white/25" />
          <div className="relative max-w-xs rotate-[-4deg] rounded-[28px] bg-white p-7 text-[#18181b] shadow-2xl">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#71717a]">Lotus 360 para empresas</p>
            <p className="mt-5 font-display text-3xl font-semibold leading-tight">Un plan, un equipo, una experiencia inolvidable.</p>
            <div className="mt-8 flex items-center gap-3 border-t border-black/10 pt-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f5] text-xl" aria-hidden="true">✦</span>
              <p className="text-sm font-semibold">Diseñado alrededor de tus objetivos</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
