"use client";

import { useMemo, useState } from "react";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { EstadoIlustrado } from "@/components/ui/EstadoIlustrado";
import { CampoBusqueda } from "@/components/catalogo/CampoBusqueda";
import { clasesBoton } from "@/components/ui/Boton";
import { PRESION_TARJETA } from "@/components/ui/movimiento";
import Link from "next/link";
import { coincideTodas, DESTINOS_SUGERIDOS, prioridadProducto } from "@/lib/catalogo/busqueda";
import { prioridadOferta, tieneNinoGratis } from "@/lib/promociones/hotSales";
import type { HotSale, Producto, Promocion } from "@/types/supabase";

export function BuscarClient({
  productos,
  promociones,
  hotSales = [],
  autoFocus = true,
  compacto = false,
  consultaInicial = "",
}: {
  productos: Producto[];
  promociones: Promocion[];
  /** Trae el dato de niño gratis para hoteles/paquetes sueltos, que `productos`
   * no tiene (solo lo carga hot_sales_publicas(), ver prioridadProducto()). */
  hotSales?: HotSale[];
  autoFocus?: boolean;
  /** Consulta con la que arranca el campo (viene del buscador global). */
  consultaInicial?: string;
  /** Usado en /catalogo/hot-sales: sin el margen inferior heredado de
   * /buscar y sin "Destinos populares" -- esos chips ya viven en Hot Sales
   * (DestinoChips) y duplicarlos empuja la grilla hacia abajo (rediseño
   * 2026-08-14). */
  compacto?: boolean;
}) {
  const [query, setQuery] = useState(consultaInicial);

  const productosFiltrados = useMemo(() => {
    if (!query.trim()) return [];
    return productos.filter((p) => coincideTodas([p.nombre, p.destino], query));
  }, [productos, query]);

  const promocionesFiltradas = useMemo(() => {
    if (!query.trim()) return [];
    return promociones.filter(
      (p) => coincideTodas([p.titulo, p.producto?.nombre, p.producto?.destino], query),
    );
  }, [promociones, query]);

  const hotelesConNinoGratis = useMemo(
    () => new Set(hotSales.filter((h) => tieneNinoGratis(h) && h.producto?.id != null).map((h) => h.producto!.id)),
    [hotSales],
  );

  // Todo incluido y niño gratis primero (pedido del dueño, 2026-09-27): mismo
  // criterio que ya ordena las ofertas de /cotizar (prioridadOferta), acá
  // fusionado con los productos sueltos para que el resultado sea un solo
  // orden. sort() es estable, así que a igual prioridad se conserva el orden
  // de llegada (promos antes que productos, como antes de este cambio).
  const resultados = useMemo(() => {
    const promos = promocionesFiltradas.map((item) => ({ tipo: "promo" as const, item, prioridad: prioridadOferta(item) }));
    const prods = productosFiltrados.map((item) => ({
      tipo: "producto" as const,
      item,
      prioridad: prioridadProducto(item, hotelesConNinoGratis),
    }));
    return [...promos, ...prods].sort((a, b) => a.prioridad - b.prioridad);
  }, [promocionesFiltradas, productosFiltrados, hotelesConNinoGratis]);

  const sinResultados = query.trim() !== "" && productosFiltrados.length === 0 && promocionesFiltradas.length === 0;

  return (
    <div>
      <CampoBusqueda valor={query} onChange={setQuery} autoFocus={autoFocus} className={compacto ? "mb-3" : "mb-8"} />

      {query.trim() === "" ? (
        compacto ? null : (
          <div>
            <p className="mb-3 text-sm font-semibold text-ink-soft">Destinos populares</p>
            <div className="flex flex-wrap gap-2">
              {DESTINOS_SUGERIDOS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setQuery(d)}
                  className={`min-h-11 rounded-pill border border-linea-fuerte px-4 text-sm font-semibold text-ink-soft transition-colors duration-[var(--dur-rapida)] hover:border-ink/40 hover:text-ink ${PRESION_TARJETA}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )
      ) : sinResultados ? (
        <div className="flex flex-col items-center gap-5 py-10 text-center">
          <EstadoIlustrado estado="sin-resultados" tamano={8} />
          <p className="text-ink-soft">No encontramos resultados para &ldquo;{query}&rdquo;.</p>
          <div className="flex flex-col items-center gap-3">
            <p className="text-sm font-semibold text-ink-soft">Pruebe con un destino</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DESTINOS_SUGERIDOS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setQuery(d)}
                  className={`min-h-11 rounded-pill border border-linea-fuerte px-4 text-sm font-semibold text-ink-soft transition-colors duration-[var(--dur-rapida)] hover:border-ink/40 hover:text-ink ${PRESION_TARJETA}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <p className="max-w-md text-sm text-ink-soft">
            ¿No ve lo que busca? Cuéntenos su viaje y le armamos una cotización a su medida.
          </p>
          <Link href="/cotizar" className={clasesBoton({ variante: "primario" })}>
            Armar mi viaje
          </Link>
        </div>
      ) : (
        <CatalogoGrid>
          {resultados.map((r) =>
            r.tipo === "promo" ? (
              <PromocionCard key={`promo-${r.item.id}`} promocion={r.item} />
            ) : (
              <ProductoCard key={`prod-${r.item.id}`} producto={r.item} />
            ),
          )}
        </CatalogoGrid>
      )}
    </div>
  );
}
