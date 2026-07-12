import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/types/supabase";

export function CategoriaTabs({ activa }: { activa: Categoria }) {
  return (
    <nav
      aria-label="Categorías del catálogo"
      className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {CATEGORIAS.map(({ slug, label }) => {
        const isActive = slug === activa;
        return (
          <Link
            key={slug}
            href={`/catalogo/${slug}`}
            aria-current={isActive ? "page" : undefined}
            className={
              "inline-flex min-h-11 flex-shrink-0 items-center rounded-[10px] border px-4 font-mono text-[0.78rem] uppercase tracking-wide " +
              (isActive
                ? "border-transparent bg-gradient-to-br from-coral to-gold font-bold text-btn-ink"
                : "border-ink/10 bg-card text-ink-soft")
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
