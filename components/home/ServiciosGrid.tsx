"use client";

import Image from "next/image";
import Link from "next/link";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

const CARD_LAYOUTS = [
  { clase: "md:col-span-7 md:min-h-[520px]", sizes: "(min-width: 768px) 58vw, 100vw" },
  { clase: "md:col-span-5 md:min-h-[520px]", sizes: "(min-width: 768px) 42vw, 100vw" },
  { clase: "md:col-span-5 md:min-h-[420px]", sizes: "(min-width: 768px) 42vw, 100vw" },
  { clase: "md:col-span-7 md:min-h-[420px]", sizes: "(min-width: 768px) 58vw, 100vw" },
];

export function ServiciosGrid({ fotoHotel }: { fotoHotel?: string | null }) {
  const { content } = useSiteContent();
  const section = content.home.services;
  return (
    <section aria-labelledby="servicios-heading">
      <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <EditableText path="home.services.eyebrow" as="p" className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral" />
          <EditableText
            path="home.services.title"
            as="h2"
            id="servicios-heading"
            className="max-w-[15ch] text-balance font-display text-4xl font-semibold leading-[0.98] tracking-[-0.03em] text-ink md:text-6xl"
          />
        </div>
        <div className="max-w-sm md:text-right">
          <EditableText path="home.services.description" as="p" multiline className="mb-4 leading-7 text-ink-soft" />
          <Link
            href={section.ctaHref}
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-ink/15 bg-card px-6 font-semibold text-ink transition-colors hover:border-coral hover:text-coral"
          >
            {section.ctaLabel} <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      <nav aria-label="Servicios principales" className="grid gap-4 md:grid-cols-12">
        {section.cards.map((servicio, index) => {
          const layout = CARD_LAYOUTS[index] ?? CARD_LAYOUTS[0];
          const foto = servicio.image || (index === 1 ? fotoHotel : null) || "/images/editorial/escapada-caribe.png";
          return (
            <Link
              key={servicio.href}
              href={servicio.href}
              className={`group relative min-h-[380px] overflow-hidden rounded-[32px] bg-dusk shadow-[0_24px_70px_rgba(36,31,26,.14)] ${layout.clase}`}
            >
              <Image
                src={foto}
                alt=""
                fill
                sizes={layout.sizes}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/5" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="rounded-full border border-white/30 bg-black/15 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-md">
                    {servicio.label}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-[#18181b] transition-transform group-hover:rotate-45" aria-hidden="true">
                    ↗
                  </span>
                </div>
                <h3 className="max-w-[15ch] text-balance font-display text-3xl font-semibold leading-[1.02] md:text-4xl">
                  {servicio.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/78 md:text-base">
                  {servicio.description}
                </p>
              </div>
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
