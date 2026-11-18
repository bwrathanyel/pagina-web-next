"use client";

import { EditableText } from "@/components/admin/EditableText";
import type { Categoria } from "@/types/supabase";

// Solo se ve en escritorio (la página lo envuelve en `hidden lg:block`); el
// móvil lleva solo el h1 en la página. Una sola franja baja (pedido del dueño
// 2026-11-18: el bloque alto empujaba las tarjetas fuera de la pantalla).
export function CatalogHeader({ categoria, label, count }: { categoria: Categoria; label: string; count: number }) {
  return (
    <header className="mb-4 overflow-hidden rounded-card bg-dusk px-6 py-4 text-dusk-text">
      <div className="flex items-center justify-between gap-6">
        <div className="flex min-w-0 items-baseline gap-x-5">
          <h1 className="shrink-0 font-display text-3xl font-bold leading-none">{label}</h1>
          <EditableText
            path={`catalog.descriptions.${categoria}`}
            as="p"
            multiline
            className="line-clamp-1 text-sm text-dusk-text-soft"
          />
        </div>
        <span className="shrink-0 rounded-pill border border-dusk-text/20 px-3 py-1 font-mono text-xs text-dusk-text-soft">
          {count} {count === 1 ? "opción" : "opciones"}
        </span>
      </div>
    </header>
  );
}
