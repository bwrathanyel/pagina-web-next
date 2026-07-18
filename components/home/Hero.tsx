"use client";

import Image from "next/image";
import Link from "next/link";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function Hero({ fotos }: { fotos: { url: string; alt: string }[] }) {
  const fotoPrincipal = fotos[0];
  const { content } = useSiteContent();
  const hero = content.home.hero;
  const heroImage = hero.image || fotoPrincipal?.url;
  const esWhatsapp = hero.secondaryHref === "whatsapp";
  const secondaryHref = hero.secondaryHref;

  return (
    <section className="relative overflow-hidden px-5 pb-16 pt-10 md:pb-24 md:pt-16">
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-coral/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-8 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr] lg:gap-20">
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
              <Image src={heroImage} alt={fotoPrincipal?.alt ?? "Experiencia de viaje"} fill sizes="(min-width: 1024px) 36vw, 75vw" className="object-cover" priority />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-seafoam via-dusk-2 to-dusk" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-dusk/35 via-transparent to-transparent" />
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
