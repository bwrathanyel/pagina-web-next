"use client";

import { useMemo, useState } from "react";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { DestinoChips } from "@/components/catalogo/DestinoChips";
import { destinosDelPool } from "@/lib/promociones/hotSales";
import { Revelar } from "@/components/ui/Revelar";
import type { Promocion } from "@/types/supabase";

// Grid plano (sin agrupar por destino, para no romper el orden por precio
// que ya trae el pool) con el mismo filtro de chips que la sección del home.
export function HotSalesGrid({ pool }: { pool: Promocion[] }) {
  const [destino, setDestino] = useState<string | null>(null);
  const destinos = useMemo(() => destinosDelPool(pool), [pool]);
  const filtradas = destino ? pool.filter((p) => p.producto?.destino === destino) : pool;

  return (
    <div>
      <DestinoChips destinos={destinos} activo={destino} onChange={setDestino} />
      {filtradas.length === 0 ? (
        <p className="text-ink-soft">
          No hay Hot Sales en este destino ahora mismo. Escríbenos por WhatsApp y te contamos qué opciones podemos preparar.
        </p>
      ) : (
        <CatalogoGrid>
          {filtradas.map((p, i) => (
            <Revelar key={p.id} retraso={i * 50} className="h-full">
              <PromocionCard promocion={p} />
            </Revelar>
          ))}
        </CatalogoGrid>
      )}
    </div>
  );
}
