"use client";

import Link from "next/link";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

export function ComoFunciona() {
  const { content } = useSiteContent();
  const process = content.home.process;
  return (
    <section className="bg-dusk px-5 py-20 text-dusk-text md:py-28" aria-labelledby="como-funciona-heading">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <EditableText path="home.process.eyebrow" as="p" className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral-bright" />
          <EditableText path="home.process.title" as="h2" id="como-funciona-heading" className="max-w-[11ch] text-balance font-display text-4xl font-semibold leading-[.98] tracking-[-0.03em] md:text-6xl" />
          <EditableText path="home.process.description" as="p" multiline className="mt-6 max-w-md leading-7 text-dusk-text-soft" />
          <Link href={process.ctaHref} className="mt-8 inline-flex min-h-12 items-center rounded-full bg-coral px-7 font-semibold text-white">
            {process.ctaLabel}
          </Link>
        </div>

        <ol className="divide-y divide-dusk-text/12 border-y border-dusk-text/12">
          {process.steps.map((paso, index) => (
            <li key={`${paso.number}-${index}`} className="grid gap-5 py-8 sm:grid-cols-[80px_1fr] md:py-10">
              <EditableText path={`home.process.steps.${index}.number`} className="font-mono text-sm font-bold text-coral-bright" />
              <div>
                <EditableText path={`home.process.steps.${index}.title`} as="h3" className="font-display text-2xl font-semibold md:text-3xl" />
                <EditableText path={`home.process.steps.${index}.description`} as="p" multiline className="mt-3 max-w-xl leading-7 text-dusk-text-soft" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
