"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EditableText } from "@/components/admin/EditableText";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { DestinoChips } from "@/components/catalogo/DestinoChips";
import { destinosDelPool } from "@/lib/promociones/hotSales";
import type { Promocion } from "@/types/supabase";

const POR_TANDA = 6;

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HotSalesSection({ pool }: { pool: Promocion[] }) {
  // Se baraja una sola vez al montar (lazy init) -- cada visita ve un orden
  // distinto sin necesitar refetch al servidor.
  const [orden] = useState(() => barajar(pool));
  const [destino, setDestino] = useState<string | null>(null);
  const [visibles, setVisibles] = useState(POR_TANDA);

  const destinos = useMemo(() => destinosDelPool(pool), [pool]);
  const filtradas = useMemo(
    () => (destino ? orden.filter((p) => p.producto?.destino === destino) : orden),
    [orden, destino],
  );
  const visible = filtradas.slice(0, visibles);

  if (pool.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <EditableText path="home.hotSales.eyebrow" as="p" className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral" />
          <EditableText path="home.hotSales.title" as="h2" className="max-w-[20ch] text-balance font-display text-3xl font-semibold leading-tight text-ink md:text-5xl" />
        </div>
        <Link href="/catalogo/hot-sales" className="hidden min-h-11 flex-shrink-0 items-center text-sm font-semibold text-coral sm:flex">
          Ver todas ↗
        </Link>
      </div>

      <DestinoChips
        destinos={destinos}
        activo={destino}
        onChange={(d) => {
          setDestino(d);
          setVisibles(POR_TANDA);
        }}
      />

      <CatalogoGrid>
        {visible.map((p) => (
          <PromocionCard key={p.id} promocion={p} />
        ))}
      </CatalogoGrid>

      {visibles < filtradas.length && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibles((v) => v + POR_TANDA)}
            className="min-h-11 rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink hover:border-ink/30"
          >
            Ver más
          </button>
        </div>
      )}

      <Link href="/catalogo/hot-sales" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-coral sm:hidden">
        Ver todas las Hot Sales ↗
      </Link>
    </section>
  );
}
