"use client";

import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Revelar } from "@/components/ui/Revelar";

export function AcompanamientoSection() {
  const { content } = useSiteContent();
  return (
    <section className="bg-coral px-5 py-7 text-white md:py-14">
      <Revelar as="div" className="mx-auto grid max-w-6xl gap-5 md:grid-cols-[1.3fr_1fr] md:items-center md:gap-8">
        <EditableText path="home.trust.headline" as="h2" className="max-w-[18ch] text-balance font-display text-3xl font-semibold leading-tight md:text-5xl" />
        <div className="grid grid-cols-3 gap-3 text-center">
          {content.home.trust.stats.map((stat, index) => (
            <Revelar key={index} retraso={index * 90} as="div" className="border-l border-white/25 px-2 first:border-l-0">
              <EditableText path={`home.trust.stats.${index}.title`} as="p" className="font-display text-lg font-semibold md:text-2xl" />
              <EditableText path={`home.trust.stats.${index}.detail`} as="p" className="mt-1 text-xs text-white/90 md:text-sm" />
            </Revelar>
          ))}
        </div>
      </Revelar>
    </section>
  );
}
