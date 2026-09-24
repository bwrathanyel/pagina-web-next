"use client";

import { useMemo, useState } from "react";
import { EditableText } from "@/components/admin/EditableText";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { DestinoChips } from "@/components/catalogo/DestinoChips";
import { destinosDelPool } from "@/lib/promociones/hotSales";
import { Seccion } from "@/components/ui/Seccion";
import { Carrusel } from "@/components/ui/Carrusel";
import { CLASE_ETIQUETA_SECCION, CLASE_TITULO_SECCION, EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import type { Promocion } from "@/types/supabase";

const EN_LA_HOME = 8;
// En lg la grilla es de 3 columnas: la 7.ª y la 8.ª dejarían una fila coja.
const HASTA_LG = 6;

// Grilla densa estilo Booking (plan 2026-09-24): 2/3/4 columnas desde sm y
// carrusel con 1,15 tarjetas a la vista en el teléfono, en un solo árbol. El
// pool llega en el orden del día (ordenDelDia, en el servidor): el cliente no
// reordena nada, así que la grilla no salta al hidratar.
export function HotSalesSection({ pool }: { pool: Promocion[] }) {
  const [destino, setDestino] = useState<string | null>(null);
  const destinos = useMemo(() => destinosDelPool(pool), [pool]);
  const filtradas = useMemo(
    () => (destino ? pool.filter((p) => p.producto?.destino === destino) : pool),
    [pool, destino],
  );

  if (pool.length === 0) return null;

  const hrefLista = destino
    ? `/catalogo/hot-sales?destino=${encodeURIComponent(destino)}`
    : "/catalogo/hot-sales";

  return (
    <Seccion ritmo="intro">
      <EncabezadoSeccion
        titulo={<EditableText path="home.hotSales.title" as="h2" className={CLASE_TITULO_SECCION + " text-ink"} />}
        etiqueta={<EditableText path="home.hotSales.eyebrow" as="p" className={CLASE_ETIQUETA_SECCION + " text-acento"} />}
        verTodasHref="/catalogo/hot-sales"
      />

      <DestinoChips destinos={destinos} activo={destino} onChange={setDestino} />

      {/* La key reinicia el scroll del carrusel móvil al cambiar de destino. */}
      <Carrusel
        key={destino ?? "todos"}
        anchoItem="85%"
        maxItem="360px"
        gap="gap-4 sm:gap-6"
        desktop="sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3 xl:grid-cols-4"
        claseItem={(i) => (i >= HASTA_LG ? "lg:max-xl:hidden" : "")}
        items={filtradas.slice(0, EN_LA_HOME).map((p) => (
          <PromocionCard key={p.id} promocion={p} />
        ))}
      />

      {filtradas.length > HASTA_LG ? (
        <div className="mt-6 flex justify-center sm:mt-10">
          <Boton href={hrefLista} variante="secundario" iconoFin={<Icono nombre="flecha-der" tamano={16} />}>
            Ver las {filtradas.length} ofertas
          </Boton>
        </div>
      ) : null}
    </Seccion>
  );
}
