"use client";

import { EditableText } from "@/components/admin/EditableText";
import type { Categoria } from "@/types/supabase";

export function CatalogHeader({ categoria, label, count }: { categoria: Categoria; label: string; count: number }) {
  return (
    <header className="mb-7 overflow-hidden rounded-[32px] bg-dusk px-7 py-9 text-dusk-text md:px-10 md:py-12">
      <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
        <div>
          <EditableText
            path="catalog.eyebrow"
            as="p"
            className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral-bright"
          />
          <h1 className="font-display text-4xl font-semibold leading-none md:text-6xl">{label}</h1>
          <EditableText
            path={`catalog.descriptions.${categoria}`}
            as="p"
            multiline
            className="mt-4 max-w-xl leading-7 text-dusk-text-soft"
          />
        </div>
        <span className="w-fit rounded-full border border-dusk-text/15 px-4 py-2 font-mono text-xs text-dusk-text-soft">
          {count} {count === 1 ? "opción" : "opciones"}
        </span>
      </div>
    </header>
  );
}
