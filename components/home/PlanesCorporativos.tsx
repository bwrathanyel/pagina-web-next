"use client";

import Image from "next/image";
import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function PlanesCorporativos() {
  const { content } = useSiteContent();
  const corporate = content.home.corporate;
  const primaryHref = corporate.primaryHref === "whatsapp"
    ? whatsappHref("Hola! Vengo de su página web y quiero información sobre planes corporativos.")
    : corporate.primaryHref;
  const secondaryHref = corporate.secondaryHref === "email" ? `mailto:${REDES.email}` : corporate.secondaryHref;
  return (
    <section className="px-5 py-16 md:py-24">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[36px] bg-dusk text-dusk-text lg:grid-cols-[1fr_.72fr]">
        <div className="p-8 md:p-14">
          <EditableText path="home.corporate.eyebrow" as="p" className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral" />
          <EditableText path="home.corporate.title" as="h2" className="max-w-[13ch] text-balance font-display text-4xl font-semibold leading-[1.05] md:text-6xl" />
          <EditableText path="home.corporate.description" as="p" multiline className="mt-6 max-w-xl leading-7 text-dusk-text-soft" />
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href={primaryHref} target={primaryHref.startsWith("http") ? "_blank" : undefined} rel={primaryHref.startsWith("http") ? "noopener noreferrer" : undefined} className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white">{corporate.primaryLabel}</a>
            <a href={secondaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full border border-dusk-text/20 px-7 font-semibold text-dusk-text">{corporate.secondaryLabel}</a>
          </div>
        </div>

        <div className="relative min-h-[390px] overflow-hidden lg:min-h-full">
          <Image
            src={corporate.image}
            alt="Equipo planificando una experiencia corporativa"
            fill
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl border border-white/20 bg-black/30 p-5 text-white backdrop-blur-md">
            <EditableText path="home.corporate.imageTitle" as="p" className="font-display text-2xl font-semibold" />
            <EditableText path="home.corporate.imageDescription" as="p" className="mt-1 text-sm text-white/75" />
          </div>
        </div>
      </div>
    </section>
  );
}
