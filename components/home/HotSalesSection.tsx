"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { EditableText } from "@/components/admin/EditableText";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
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
  // Arranca con el orden tal cual llega del server (igual en SSR y en el
  // primer render del cliente, sin mismatch de hidratación) y recién baraja
  // después de montar -- un Math.random() en el init de useState corre
  // distinto en server/cliente y React 19 lo detecta como mismatch real en
  // cada carga (hallazgo real, auditoría 2026-07-23).
  const [orden, setOrden] = useState(pool);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrden(barajar(pool));
  }, [pool]);
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

      <div className="-mx-5 flex gap-4 overflow-x-auto px-5 pb-1 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-7 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {visible.map((p) => (
          <div key={p.id} className="w-[70vw] max-w-[258px] shrink-0 snap-start sm:w-auto sm:max-w-none">
            <PromocionCard promocion={p} />
          </div>
        ))}
      </div>

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
