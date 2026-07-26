"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

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
  const heroImage = hero.image || actual?.url;
  const heroAlt = actual?.alt ?? fotoPrincipal?.alt ?? "Experiencia de viaje";

  return (
    <section className="relative overflow-hidden px-5 pb-8 pt-6 md:pb-24 md:pt-16">
      {/* Hero card mobile-only -- versión "app" pedida en el rediseño (foto
          full-bleed + gradiente + pill + CTA). Desktop mantiene el layout
          original (círculo + badges flotantes) sin tocar. */}
      <div className="relative mb-2 h-[300px] overflow-hidden rounded-[28px] bg-sand-2 lg:hidden">
        {heroImage ? (
          <Image
            key={heroImage}
            src={heroImage}
            alt={heroAlt}
            fill
            sizes="100vw"
            className="animate-hero-fade object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-seafoam via-dusk-2 to-dusk" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-dusk/90 via-dusk/25 to-transparent" />
        <p className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-white backdrop-blur-md">
          <span className="h-1.5 w-1.5 rounded-full bg-coral-bright" aria-hidden="true" />
          <EditableText path="home.hero.eyebrow" />
        </p>
        {/* Nombre del alojamiento que se está viendo -- sutil, para que se
            entienda que la foto es de una promo real y no decorativa. */}
        {rotando && actual?.alt ? (
          <p
            key={actual.alt}
            className="animate-hero-fade absolute right-4 top-4 max-w-[55%] truncate rounded-full bg-black/35 px-3 py-1.5 text-[11px] font-medium text-white/95 backdrop-blur-md"
          >
            {actual.alt}
          </p>
        ) : null}
        <div className="absolute inset-x-4 bottom-4">
          <h1 className="max-w-[14ch] text-balance font-display text-[34px] font-semibold leading-[0.98] text-white">
            <EditableText path="home.hero.title" />{" "}
            <EditableText path="home.hero.accent" className="text-coral-bright" />
          </h1>
          <div className="mt-4 flex items-center gap-2">
            <Link href={hero.primaryHref} className="flex min-h-11 flex-1 items-center justify-center rounded-full bg-coral px-5 text-sm font-semibold text-white">
              {hero.primaryLabel}
            </Link>
            {esWhatsapp ? (
              <WhatsAppLeadButton
                mensajeBase="Hola! Vengo de su página web y quiero planificar mi próximo viaje."
                triggerAriaLabel={hero.secondaryLabel}
                triggerClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md"
              >
                <span aria-hidden="true">↗</span>
              </WhatsAppLeadButton>
            ) : (
              <a
                href={secondaryHref}
                target={secondaryHref.startsWith("http") ? "_blank" : undefined}
                rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
                aria-label={hero.secondaryLabel}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md"
              >
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative mx-auto hidden max-w-6xl items-center gap-12 lg:grid lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
        <div className="text-center lg:text-left">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink/10 bg-card px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-ink-soft shadow-sm">
            <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
            <EditableText path="home.hero.eyebrow" />
          </p>

          <h1 className="mx-auto max-w-[10ch] text-balance font-display text-[clamp(3.5rem,8vw,7.5rem)] font-semibold leading-[0.88] tracking-[-0.055em] text-ink lg:mx-0">
            <EditableText path="home.hero.title" />
            <EditableText path="home.hero.accent" className="block text-coral" />
          </h1>

          <div className="mx-auto mt-8 max-w-xl lg:mx-0 lg:grid lg:grid-cols-[1fr_auto] lg:items-end lg:gap-8">
            <EditableText path="home.hero.description" as="p" multiline className="text-balance text-base leading-7 text-ink-soft md:text-lg" />
            <svg className="mx-auto mt-6 hidden text-coral lg:block" width="74" height="44" viewBox="0 0 74 44" fill="none" aria-hidden="true">
              <path d="M2 5c17 1 25 4 35 13 7 6 13 13 28 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="m57 24 9 8-11 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href={hero.primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white shadow-[0_12px_28px_rgba(206,56,10,.22)] transition-transform hover:-translate-y-0.5">
              {hero.primaryLabel}
            </Link>
            {esWhatsapp ? (
              <WhatsAppLeadButton
                mensajeBase="Hola! Vengo de su página web y quiero planificar mi próximo viaje."
                triggerClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 bg-card px-7 font-semibold text-ink transition-colors hover:border-ink/30"
              >
                {hero.secondaryLabel}
                <span aria-hidden="true">↗</span>
              </WhatsAppLeadButton>
            ) : (
              <a href={secondaryHref} target={secondaryHref.startsWith("http") ? "_blank" : undefined} rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 bg-card px-7 font-semibold text-ink transition-colors hover:border-ink/30">
                {hero.secondaryLabel}
                <span aria-hidden="true">↗</span>
              </a>
            )}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[470px]">
          <div className="relative mx-auto aspect-[4/5] w-[82%] overflow-hidden rounded-[999px] border border-ink/10 bg-sand-2 shadow-[0_30px_80px_rgba(36,31,26,.18)]">
            {heroImage ? (
              <Image
                key={heroImage}
                src={heroImage}
                alt={heroAlt}
                fill
                sizes="(min-width: 1024px) 36vw, 75vw"
                className="animate-hero-fade object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-seafoam via-dusk-2 to-dusk" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dusk/45 via-transparent to-transparent" />
            {rotando && actual?.alt ? (
              <p
                key={actual.alt}
                className="animate-hero-fade absolute inset-x-6 bottom-6 truncate text-center text-[0.72rem] font-medium tracking-wide text-white/90 drop-shadow-[0_1px_6px_rgba(0,0,0,.7)]"
              >
                {actual.alt}
              </p>
            ) : null}
          </div>

          <div className="absolute -left-1 top-[18%] rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-left shadow-xl backdrop-blur-md sm:left-0">
            <EditableText path="home.hero.badgeTopLabel" as="p" className="font-mono text-[10px] uppercase tracking-wider text-[#71717a]" />
            <EditableText path="home.hero.badgeTopValue" as="p" className="mt-1 text-sm font-bold text-[#18181b]" />
          </div>
          <div className="absolute -right-1 bottom-[15%] rounded-2xl border border-white/70 bg-white/85 px-4 py-3 text-left shadow-xl backdrop-blur-md sm:right-0">
            <EditableText path="home.hero.badgeBottomLabel" as="p" className="font-mono text-[10px] uppercase tracking-wider text-[#71717a]" />
            <EditableText path="home.hero.badgeBottomValue" as="p" className="mt-1 text-sm font-bold text-[#18181b]" />
          </div>
        </div>
      </div>
    </section>
  );
}
