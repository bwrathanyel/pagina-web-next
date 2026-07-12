import Image from "next/image";
import Link from "next/link";
import { whatsappHref } from "@/lib/whatsapp";

export function Hero({ fotos }: { fotos: { url: string; alt: string }[] }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-dusk-2 to-dusk px-5 pt-8">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 pb-10 md:grid-cols-2 md:pb-16">
        <div>
          <h1 className="mb-4 max-w-[15ch] text-balance font-display text-4xl font-semibold leading-tight text-dusk-text md:text-5xl">
            Tu próximo viaje, a un mensaje de distancia.
          </h1>
          <p className="mb-7 max-w-[38ch] text-dusk-text-soft">
            Hoteles, paquetes y tours en Venezuela y el mundo — con un asesor real
            respondiendo por WhatsApp.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/catalogo/hoteles"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
            >
              Ver catálogo
            </Link>
            <a
              href={whatsappHref("Hola! Vengo de su página web.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dusk-text/30 px-6 font-semibold text-dusk-text"
            >
              <span className="h-2 w-2 rounded-full bg-[#25D366]" aria-hidden="true" />
              Escríbenos por WhatsApp
            </a>
          </div>
        </div>

        <div className="relative h-[260px] md:h-[340px]">
          {fotos[0] ? (
            <div className="absolute left-[2%] top-0 z-20 w-[58%] -rotate-[7deg] overflow-hidden rounded-xl border-[3px] border-sand shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image src={fotos[0].url} alt={fotos[0].alt} fill sizes="30vw" className="object-cover" priority />
              </div>
            </div>
          ) : null}
          {fotos[1] ? (
            <div className="absolute right-0 top-[12%] z-10 w-[52%] rotate-6 overflow-hidden rounded-xl border-[3px] border-sand shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image src={fotos[1].url} alt={fotos[1].alt} fill sizes="28vw" className="object-cover" />
              </div>
            </div>
          ) : null}
          {fotos[2] ? (
            <div className="absolute bottom-[-4%] left-[22%] z-30 w-[46%] -rotate-2 overflow-hidden rounded-xl border-[3px] border-sand shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image src={fotos[2].url} alt={fotos[2].alt} fill sizes="24vw" className="object-cover" />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className="block h-auto w-full" aria-hidden="true">
        <path d="M0,90 L0,50 L100,10 L165,44 L230,16 L290,46 L1440,46 L1440,90 Z" fill="var(--color-sand)" />
      </svg>
    </section>
  );
}
