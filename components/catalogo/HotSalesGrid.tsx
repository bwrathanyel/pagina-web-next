"use client";

import { useMemo } from "react";
import { GrillaFiltrable, type EntradaGrilla } from "@/components/catalogo/GrillaFiltrable";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { destinosDelPool } from "@/lib/promociones/hotSales";
import { montoOrden } from "@/lib/tarifas";
import type { Promocion } from "@/types/supabase";

// Grilla plana: "Recomendadas" es el orden que ya trae el pool (manuales
// primero, después ranking), sin agrupar por destino. Los chips van pegados
// bajo la barra porque la lista es larga.
export function HotSalesGrid({ pool }: { pool: Promocion[] }) {
  const destinos = useMemo(() => destinosDelPool(pool), [pool]);
  const entradas = useMemo<EntradaGrilla[]>(
    () =>
      pool.map((p, i) => ({
        id: p.id,
        destino: p.producto?.destino ?? "",
        monto: montoOrden(p),
        tarjeta: <PromocionCard promocion={p} prioridad={i < 2} />,
      })),
    [pool],
  );

  return (
    <GrillaFiltrable
      entradas={entradas}
      destinos={destinos}
      fijo
      nombre={["oferta", "ofertas"]}
      vacio="No hay Hot Sales en este destino ahora mismo. Escríbanos por WhatsApp y le contamos qué opciones podemos preparar."
    />
  );
}
