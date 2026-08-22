"use client";

import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Revelar } from "@/components/ui/Revelar";

export function AcompanamientoSection() {
  const { content } = useSiteContent();
  return (
    <section className="grano relative bg-dusk-2 px-5 py-10 text-dusk-text md:py-16">
      <Revelar as="div" className="mx-auto grid max-w-[var(--ancho-contenido)] gap-6 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-10">
        <EditableText path="home.trust.headline" as="h2" className="max-w-[18ch] text-balance font-display text-3xl font-semibold leading-tight md:text-5xl" />
        <div className="grid grid-cols-3 gap-3 border-t border-dusk-text/15 pt-5 text-center md:border-t-0 md:pt-0">
          {content.home.trust.stats.map((stat, index) => (
            <Revelar key={index} retraso={index * 90} as="div" className="border-l border-dusk-text/20 px-2 first:border-l-0">
              <EditableText path={`home.trust.stats.${index}.title`} as="p" className="font-display text-lg font-semibold text-gold md:text-2xl" />
              <EditableText path={`home.trust.stats.${index}.detail`} as="p" className="mt-1 text-xs text-dusk-text-soft md:text-sm" />
            </Revelar>
          ))}
        </div>
      </Revelar>
    </section>
  );
}
