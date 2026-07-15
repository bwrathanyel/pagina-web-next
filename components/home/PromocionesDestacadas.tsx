"use client";

import Link from "next/link";
import { PromocionesCarousel } from "@/components/home/PromocionesCarousel";
import { EditableText } from "@/components/admin/EditableText";
import type { Promocion } from "@/types/supabase";

/** Lo primero que ve el usuario al entrar al catálogo — a propósito antes
 * que cualquier contenido de Hoteles, ver types/supabase.ts CATEGORIAS. */
export function PromocionesDestacadas({ promociones }: { promociones: Promocion[] }) {
  if (promociones.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <EditableText path="home.promotions.eyebrow" as="p" className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral" />
          <EditableText path="home.promotions.title" as="h2" className="max-w-[16ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-5xl" />
        </div>
        <Link href="/catalogo/promociones" className="hidden min-h-11 flex-shrink-0 items-center text-sm font-semibold text-coral sm:flex">
          Ver todas ↗
        </Link>
      </div>
      <PromocionesCarousel promociones={promociones} />
      <Link href="/catalogo/promociones" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-coral sm:hidden">Ver todas las promociones ↗</Link>
    </section>
  );
}
