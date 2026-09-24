"use client";

import { EditableText } from "@/components/admin/EditableText";
import type { Categoria } from "@/types/supabase";

// Solo se ve en escritorio (la página lo envuelve en `hidden lg:block`); el
// móvil usa CatalogoMobileHeader. La etiqueta editable va debajo del título.
export function CatalogHeader({ categoria, label, count }: { categoria: Categoria; label: string; count: number }) {
  return (
    <header className="mb-7 overflow-hidden rounded-card bg-dusk px-10 py-12 text-dusk-text">
      <div className="flex items-end justify-between gap-8">
        <div>
          <h1 className="font-display text-6xl font-bold leading-none">{label}</h1>
          <EditableText
            path={`catalog.descriptions.${categoria}`}
            as="p"
            multiline
            className="mt-4 max-w-xl leading-7 text-dusk-text-soft"
          />
          <EditableText
            path="catalog.eyebrow"
            as="p"
            className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-coral-bright"
          />
        </div>
        <span className="w-fit rounded-pill border border-dusk-text/20 px-4 py-2 font-mono text-xs text-dusk-text-soft">
          {count} {count === 1 ? "opción" : "opciones"}
        </span>
      </div>
    </header>
  );
}
