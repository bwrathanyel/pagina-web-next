"use client";

import Link from "next/link";
import { m } from "motion/react";
import { CATEGORIAS, type Categoria } from "@/types/supabase";

// Cada categoría es una página distinta, así que la pestaña se vuelve a montar
// al navegar; el layoutId anima el indicador cuando React monta la nueva
// mientras desmonta la vieja, y si no, queda fijo sin romper nada.
export function CategoriaTabs({ activa, className = "" }: { activa: Categoria; className?: string }) {
  return (
    <nav
      aria-label="Categorías del catálogo"
      className={
        "flex gap-2 overflow-x-auto py-1 snap-x snap-proximity [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_88%,transparent)] " +
        className
      }
    >
      {CATEGORIAS.map(({ slug, label }) => {
        const isActive = slug === activa;
        return (
          <Link
            key={slug}
            href={`/catalogo/${slug}`}
            aria-current={isActive ? "page" : undefined}
            className={
              "relative inline-flex min-h-11 flex-shrink-0 snap-start items-center rounded-control border px-4 text-sm font-semibold transition-colors duration-150 " +
              (isActive
                ? "border-transparent text-sobre-acento"
                : "border-linea-fuerte bg-card text-ink-soft hover:border-ink/40 hover:text-ink")
            }
          >
            {isActive ? (
              <m.span
                layoutId="categoria-activa"
                aria-hidden="true"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-control bg-acento"
              />
            ) : null}
            <span className="relative">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
