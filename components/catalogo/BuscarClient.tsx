"use client";

import { useMemo, useState } from "react";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { Icono } from "@/components/ui/Icono";
import { coincide, DESTINOS_SUGERIDOS, prioridadProducto } from "@/lib/catalogo/busqueda";
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
    return productos.filter((p) => coincide(p.nombre, query) || coincide(p.destino ?? "", query));
  }, [productos, query]);

  const promocionesFiltradas = useMemo(() => {
    if (!query.trim()) return [];
    return promociones.filter(
      (p) => coincide(p.titulo, query) || coincide(p.producto?.nombre, query) || coincide(p.producto?.destino, query),
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
      <div className={`flex min-h-12 items-center gap-3 rounded-pill border border-linea-fuerte bg-card px-5 transition-[border-color,box-shadow] duration-150 focus-within:border-acento focus-within:ring-2 focus-within:ring-acento/30 ${compacto ? "mb-3" : "mb-8"}`}>
        <Icono nombre="buscar" tamano={20} className="text-ink-soft" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar destinos, hoteles, paquetes…"
          className="min-h-12 w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none"
          autoFocus={autoFocus}
        />
      </div>

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
                  className="min-h-11 rounded-pill border border-linea-fuerte px-4 text-sm font-semibold text-ink-soft transition-colors duration-150 hover:border-ink/40 hover:text-ink"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )
      ) : sinResultados ? (
        <p className="py-10 text-center text-ink-soft">No encontramos resultados para &ldquo;{query}&rdquo;.</p>
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
