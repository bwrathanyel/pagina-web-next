"use client";

import Link from "next/link";
import { Icono } from "@/components/ui/Icono";
import { usd } from "@/lib/checkout/formato";
import type { PlanEstado } from "@/lib/planes/planes";

// Piezas compartidas de /cuenta/planes y /cuenta/planes/[id].

export function Encabezado({ titulo, volver }: { titulo: string; volver: string }) {
  return (
    <div className="mb-6 flex items-center gap-3 md:mb-8">
      <Link
        href={volver}
        aria-label="Volver"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-linea text-ink transition-colors duration-150 hover:bg-sand-2"
      >
        <Icono nombre="flecha-izq" tamano={18} />
      </Link>
      <h1 className="font-display text-3xl font-bold leading-none text-ink md:text-4xl">{titulo}</h1>
    </div>
  );
}

/** Barra de avance: cuánto del total ya está pagado. */
export function Avance({ plan }: { plan: PlanEstado }) {
  const pct = plan.total_usd > 0 ? Math.min(100, Math.round((plan.pagado_usd / plan.total_usd) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="h-2 overflow-hidden rounded-pill bg-sand-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Pagado">
        <div className="h-full rounded-pill bg-acento" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-sm text-ink-soft">
        Pagado <span className="font-mono font-bold tabular-nums text-ink">{usd(plan.pagado_usd)}</span> de{" "}
        <span className="font-mono tabular-nums">{usd(plan.total_usd)}</span>
      </p>
    </div>
  );
}

