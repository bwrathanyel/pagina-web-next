"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Revelar } from "@/components/ui/Revelar";

const MS_POR_FOTO = 5000;

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

export function Hero({ fotos }: { fotos: { url: string; alt: string }[] }) {
  const fotoPrincipal = fotos[0];
  const { content } = useSiteContent();
  const hero = content.home.hero;
  const esWhatsapp = hero.secondaryHref === "whatsapp";
  const secondaryHref = hero.secondaryHref;

  // Rotación de fotos de Hot Sales (pedido del dueño, 2026-07-26). El orden se
  // baraja DESPUÉS de montar y el índice arranca en 0: un Math.random() en el
  // init de useState corre distinto en server y cliente, y React 19 lo marca
  // como mismatch de hidratación en cada carga (mismo motivo documentado en
  // HotSalesSection). Si el admin fijó una imagen fija en el contenido
  // (hero.image), esa manda y no se rota nada.
  const [orden, setOrden] = useState(fotos);
  const [i, setI] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrden(barajar(fotos));
    setI(0);
  }, [fotos]);

  const rotando = !hero.image && orden.length > 1;

  useEffect(() => {
    if (!rotando) return;
    const t = setInterval(() => setI((v) => (v + 1) % orden.length), MS_POR_FOTO);
    return () => clearInterval(t);
  }, [rotando, orden.length]);

  const actual = hero.image ? null : orden[i] ?? fotoPrincipal;
  const heroAlt = actual?.alt ?? fotoPrincipal?.alt ?? "Experiencia de viaje";

  // Solo se montan la foto actual y la siguiente -- son fotos de Hot Sales a
  // ancho completo, montar el pool entero dispararía la descarga de todas
  // (mismo problema que CardPhotoGallery resolvió con el lazy-mount).
  const indiceSiguiente = orden.length > 1 ? (i + 1) % orden.length : -1;

  return (
    // Un solo árbol responsive (antes había una tarjeta móvil y una grilla
    // desktop separadas por lg:hidden/hidden lg:grid -- eso fue lo que hizo
    // que el pase mobile del 14-ago rompiera desktop sin que nadie lo viera.
    // Ahora es una sola foto a sangre con el contenido anclado abajo,
    // reescritura editorial redesign desktop 2026-08-22).
    <section className="relative isolate flex min-h-[62svh] flex-col justify-end overflow-hidden sm:min-h-[68svh] lg:min-h-[78svh] lg:max-h-[820px]">
      <div className="grano hero-parallax absolute inset-0 overflow-hidden">
        {hero.image ? (
          <Image src={hero.image} alt={heroAlt} fill sizes="100vw" className="hero-kenburns object-cover" priority />
        ) : actual ? (
          // Tres nodos, no uno: este contenedor solo hace parallax (arriba);
          // la capa de acá abajo es la que cruza (opacidad + scale de
          // entrada); el <Image> de adentro solo hace Ken Burns. Mezclar el
          // cruce y el Ken Burns en el mismo nodo hacía que las dos
          // animaciones de transform se anularan (hallazgo pasada 3).
          [i, indiceSiguiente].map((idx, pos) => {
            if (idx < 0) return null;
            const foto = orden[idx];
            if (!foto) return null;
            return (
              <div
                key={foto.url}
                className={
                  "absolute inset-0 transition-[opacity,transform] duration-[1200ms] ease-in-out " +
                  (idx === i ? "opacity-100 scale-100" : "pointer-events-none opacity-0 scale-[1.03]")
                }
              >
                <Image
                  src={foto.url}
                  alt={idx === i ? heroAlt : ""}
                  fill
                  sizes="100vw"
                  className={"object-cover " + (idx === i ? "hero-kenburns" : "")}
                  priority={pos === 0 && i === 0}
                  loading={pos === 0 && i === 0 ? undefined : "eager"}
                />
              </div>
            );
          })
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-seafoam via-dusk-2 to-dusk" />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-dusk via-dusk/70 to-dusk/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-dusk/60 via-dusk/10 to-transparent" />

      {rotando && actual?.alt ? (
        <p
          key={actual.alt}
          className="animate-hero-fade absolute right-5 top-5 max-w-[55%] truncate rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md sm:right-8 sm:top-8"
        >
          {actual.alt}
        </p>
      ) : null}

      <Revelar retraso={120} className="relative mx-auto w-full max-w-[var(--ancho-contenido)] px-5 pb-8 pt-28 sm:pb-12 sm:pt-32 lg:pb-16 lg:pt-36">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-coral-bright" aria-hidden="true" />
          <EditableText path="home.hero.eyebrow" />
        </p>

        <h1 className="max-w-[14ch] text-balance font-display text-[clamp(2.75rem,6.5vw,5.5rem)] font-semibold leading-[0.92] tracking-[-0.03em] text-white">
          <EditableText path="home.hero.title" />{" "}
          <EditableText path="home.hero.accent" className="text-coral-bright" />
        </h1>

        <EditableText
          path="home.hero.description"
          as="p"
          multiline
          className="mt-5 max-w-lg text-balance text-base leading-7 text-white/80 md:text-lg"
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={hero.primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.25)] transition-transform hover:-translate-y-0.5">
            {hero.primaryLabel}
          </Link>
          {esWhatsapp ? (
            <WhatsAppLeadButton
              mensajeBase="Hola! Vengo de su página web y quiero planificar mi próximo viaje."
              triggerClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              {hero.secondaryLabel}
              <span aria-hidden="true">↗</span>
            </WhatsAppLeadButton>
          ) : (
            <a
              href={secondaryHref}
              target={secondaryHref.startsWith("http") ? "_blank" : undefined}
              rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              {hero.secondaryLabel}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="mt-10 flex max-w-md flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-6">
          <div>
            <EditableText path="home.hero.badgeTopLabel" as="p" className="font-mono text-[10px] uppercase tracking-wider text-white/60" />
            <EditableText path="home.hero.badgeTopValue" as="p" className="mt-1 text-sm font-bold text-white" />
          </div>
          <div>
            <EditableText path="home.hero.badgeBottomLabel" as="p" className="font-mono text-[10px] uppercase tracking-wider text-white/60" />
            <EditableText path="home.hero.badgeBottomValue" as="p" className="mt-1 text-sm font-bold text-white" />
          </div>
        </div>
      </Revelar>
    </section>
  );
}
