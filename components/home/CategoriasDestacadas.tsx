"use client";

import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/types/supabase";
import { EditableText } from "@/components/admin/EditableText";

const FOTO_EDITORIAL: Record<Categoria, string> = {
  hoteles: "/images/editorial/escapada-caribe.png",
  paquetes: "/images/editorial/escapada-caribe.png",
  "guias-tours": "/images/editorial/tour-tropical.png",
  promociones: "/images/editorial/vuelo-a-tu-medida.png",
};

export function CategoriasDestacadas({ fotos }: { fotos: Record<string, string | null> }) {
  return (
    <section className="bg-card px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <EditableText path="home.categories.eyebrow" as="p" className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral" />
        <EditableText path="home.categories.title" as="h2" className="mb-8 max-w-[18ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-5xl" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIAS.map(({ slug, label }) => {
            const foto = fotos[slug] ?? FOTO_EDITORIAL[slug];
            return (
              <Link
                key={slug}
                href={`/catalogo/${slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand-2"
              >
                <Image
                  src={foto}
                  alt={label}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-dusk/80 via-dusk/0 to-dusk/0" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-2 text-dusk-text">
                  <span className="font-display text-xl font-semibold">{label}</span>
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm text-[#18181b]" aria-hidden="true">↗</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
