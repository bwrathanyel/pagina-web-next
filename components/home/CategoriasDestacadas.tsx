import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/types/supabase";

const ICONO_POR_CATEGORIA: Record<Categoria, ReactNode> = {
  hoteles: (
    <path d="M3 21V7a2 2 0 0 1 2-2h4v16M15 21V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v12M9 21V11h4v10M3 21h18" />
  ),
  paquetes: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  "guias-tours": (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m14.5 9.5-1.5 3.5-3.5 1.5 1.5-3.5 3.5-1.5Z" />
    </>
  ),
  promociones: (
    <>
      <path d="M12 2h7a1 1 0 0 1 1 1v7a1 1 0 0 1-.29.71l-9 9a1 1 0 0 1-1.42 0l-7-7a1 1 0 0 1 0-1.42l9-9A1 1 0 0 1 12 2Z" />
      <circle cx="16.5" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
};

export function CategoriasDestacadas({ fotos }: { fotos: Record<string, string | null> }) {
  return (
    <section className="bg-card px-5 py-16 md:py-24">
      <div className="mx-auto max-w-6xl">
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral">
          Encuentra tu manera de viajar
        </p>
        <h2 className="mb-8 max-w-[18ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">
          Experiencias pensadas para ti.
        </h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {CATEGORIAS.map(({ slug, label }) => {
            const foto = fotos[slug];
            return (
              <Link
                key={slug}
                href={`/catalogo/${slug}`}
                className="group relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand-2"
              >
                {foto ? (
                  <Image
                    src={foto}
                    alt={label}
                    fill
                    sizes="(min-width: 768px) 25vw, 50vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-coral to-gold transition-transform group-hover:scale-105">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-btn-ink/70"
                      aria-hidden="true"
                    >
                      {ICONO_POR_CATEGORIA[slug]}
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-dusk/80 via-dusk/0 to-dusk/0" />
                <span className="absolute bottom-5 left-5 font-display text-xl font-semibold text-dusk-text">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
