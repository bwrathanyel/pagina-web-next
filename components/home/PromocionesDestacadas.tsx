import Link from "next/link";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import type { Promocion } from "@/types/supabase";

/** Lo primero que ve el usuario al entrar al catálogo — a propósito antes
 * que cualquier contenido de Hoteles, ver types/supabase.ts CATEGORIAS. */
export function PromocionesDestacadas({ promociones }: { promociones: Promocion[] }) {
  if (promociones.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs uppercase tracking-wide text-coral">Lo más pedido</p>
          <h2 className="font-display text-2xl font-semibold text-ink">Promociones</h2>
        </div>
        <Link href="/catalogo/promociones" className="flex-shrink-0 text-sm font-semibold text-coral">
          Ver todas →
        </Link>
      </div>
      <CatalogoGrid>
        {promociones.slice(0, 6).map((p) => (
          <PromocionCard key={p.id} promocion={p} />
        ))}
      </CatalogoGrid>
    </section>
  );
}
