import Link from "next/link";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import type { Promocion } from "@/types/supabase";

/** Lo primero que ve el usuario al entrar al catálogo — a propósito antes
 * que cualquier contenido de Hoteles, ver types/supabase.ts CATEGORIAS. */
export function PromocionesDestacadas({ promociones }: { promociones: Promocion[] }) {
  if (promociones.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral">Oportunidades para escapar</p>
          <h2 className="max-w-[16ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-5xl">Tu próxima aventura puede empezar hoy.</h2>
        </div>
        <Link href="/catalogo/promociones" className="hidden min-h-11 flex-shrink-0 items-center text-sm font-semibold text-coral sm:flex">
          Ver todas ↗
        </Link>
      </div>
      <CatalogoGrid>
        {promociones.slice(0, 3).map((p) => (
          <PromocionCard key={p.id} promocion={p} />
        ))}
      </CatalogoGrid>
      <Link href="/catalogo/promociones" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-coral sm:hidden">Ver todas las promociones ↗</Link>
    </section>
  );
}
