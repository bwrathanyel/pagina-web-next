"use client";

import { useMemo, useRef, useState } from "react";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { DestinoChips } from "@/components/catalogo/DestinoChips";
import { destinosDelPool } from "@/lib/promociones/hotSales";
import { Revelar } from "@/components/ui/Revelar";
import type { Promocion } from "@/types/supabase";

// Grid plano (sin agrupar por destino, para no romper el orden que ya trae el
// pool: manuales primero, después ranking) con el mismo filtro de chips que la sección del home,
// acá pegado bajo la barra porque la lista es larga.
export function HotSalesGrid({ pool }: { pool: Promocion[] }) {
  const [destino, setDestino] = useState<string | null>(null);
  const destinos = useMemo(() => destinosDelPool(pool), [pool]);
  const filtradas = destino ? pool.filter((p) => p.producto?.destino === destino) : pool;
  const raizRef = useRef<HTMLDivElement>(null);

  // Si se filtra con la fila ya pegada arriba, la lista nueva puede ser más
  // corta que el scroll actual y dejaría al usuario mirando el pie: vuelve al
  // comienzo de la lista (suave o no según scroll-behavior de globals.css).
  function elegir(d: string | null) {
    setDestino(d);
    const raiz = raizRef.current;
    if (raiz && raiz.getBoundingClientRect().top < 0) raiz.scrollIntoView({ block: "start" });
  }

  return (
    <div ref={raizRef} className="scroll-mt-(--alto-barra)">
      <DestinoChips destinos={destinos} activo={destino} onChange={elegir} fijo />
      {filtradas.length === 0 ? (
        <p className="text-ink-soft">
          No hay Hot Sales en este destino ahora mismo. Escríbanos por WhatsApp y le contamos qué opciones podemos preparar.
        </p>
      ) : (
        <CatalogoGrid>
          {filtradas.map((p, i) => (
            <Revelar key={p.id} retraso={i * 50} className="h-full">
              <PromocionCard promocion={p} prioridad={i < 2} />
            </Revelar>
          ))}
        </CatalogoGrid>
      )}
    </div>
  );
}
