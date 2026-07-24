"use client";

import { EditableText } from "@/components/admin/EditableText";
import type { Categoria } from "@/types/supabase";

export function CatalogHeader({ categoria, label, count }: { categoria: Categoria; label: string; count: number }) {
  return (
    <header className="mb-7 overflow-hidden rounded-none bg-transparent px-0 py-0 text-ink md:rounded-[32px] md:bg-dusk md:px-10 md:py-12 md:text-dusk-text">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
        <div>
          <EditableText
            path="catalog.eyebrow"
            as="p"
            className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral md:mb-3 md:text-coral-bright"
          />
          <h1 className="font-display text-3xl font-semibold leading-none md:text-6xl">{label}</h1>
          <EditableText
            path={`catalog.descriptions.${categoria}`}
            as="p"
            multiline
            className="mt-3 max-w-xl leading-7 text-ink-soft md:mt-4 md:text-dusk-text-soft"
          />
        </div>
        <span className="w-fit rounded-full border border-ink/15 px-4 py-2 font-mono text-xs text-ink-soft md:border-dusk-text/15 md:text-dusk-text-soft">
          {count} {count === 1 ? "opción" : "opciones"}
        </span>
      </div>
    </header>
  );
}
