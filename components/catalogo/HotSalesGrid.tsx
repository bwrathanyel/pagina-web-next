"use client";

import { useMemo, useState } from "react";
import { CampoBusqueda } from "@/components/catalogo/CampoBusqueda";
import { GrillaFiltrable, type EntradaGrilla } from "@/components/catalogo/GrillaFiltrable";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { destinosDelPool } from "@/lib/promociones/hotSales";
import { montoOrden } from "@/lib/tarifas";
import type { Promocion } from "@/types/supabase";

// Grilla plana: "Recomendadas" es el orden que ya trae el pool (manuales
// primero, después ranking), sin agrupar por destino. Los chips van pegados
// bajo la barra porque la lista es larga.
export function HotSalesGrid({ pool }: { pool: Promocion[] }) {
  const [consulta, setConsulta] = useState("");
  const destinos = useMemo(() => destinosDelPool(pool), [pool]);
  const entradas = useMemo<EntradaGrilla[]>(
    () =>
      pool.map((p, i) => ({
        id: p.id,
        destino: p.producto?.destino ?? "",
        monto: montoOrden(p),
        campos: [p.titulo, p.producto?.nombre],
        tarjeta: <PromocionCard promocion={p} prioridad={i < 2} />,
      })),
    [pool],
  );

  return (
    <>
      <div className="mb-4 lg:hidden">
        <CampoBusqueda valor={consulta} onChange={setConsulta} />
      </div>
      <GrillaFiltrable
        entradas={entradas}
        destinos={destinos}
        fijo
        nombre={["oferta", "ofertas"]}
        consulta={consulta}
        vacio={
          consulta.trim()
            ? `No encontramos Hot Sales para “${consulta.trim()}”. Pruebe con otro destino o arme su viaje en /cotizar.`
            : "No hay Hot Sales en este destino ahora mismo. Escríbanos por WhatsApp y le contamos qué opciones podemos preparar."
        }
      />
    </>
  );
}
