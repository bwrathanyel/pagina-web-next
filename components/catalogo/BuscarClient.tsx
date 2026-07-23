"use client";

import { useMemo, useState } from "react";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import type { Producto, Promocion } from "@/types/supabase";

const DESTINOS_SUGERIDOS = ["Canaima", "Chichiriviche", "Los Roques", "Margarita", "Mérida"];

function coincide(texto: string, query: string): boolean {
  return texto.toLowerCase().includes(query.toLowerCase());
}

export function BuscarClient({ productos, promociones }: { productos: Producto[]; promociones: Promocion[] }) {
  const [query, setQuery] = useState("");

  const productosFiltrados = useMemo(() => {
    if (!query.trim()) return [];
    return productos.filter((p) => coincide(p.nombre, query) || coincide(p.destino ?? "", query));
  }, [productos, query]);

  const promocionesFiltradas = useMemo(() => {
    if (!query.trim()) return [];
    return promociones.filter(
      (p) => coincide(p.titulo, query) || coincide(p.producto?.destino ?? "", query),
    );
  }, [promociones, query]);

  const sinResultados = query.trim() !== "" && productosFiltrados.length === 0 && promocionesFiltradas.length === 0;

  return (
    <div>
      <div className="mb-8 flex min-h-12 items-center gap-3 rounded-full border border-ink/15 bg-card px-5">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-soft" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar destinos, hoteles, paquetes…"
          className="min-h-12 w-full bg-transparent text-ink placeholder:text-ink-soft focus:outline-none"
          autoFocus
        />
      </div>

      {query.trim() === "" ? (
        <div>
          <p className="mb-3 text-sm font-semibold text-ink-soft">Destinos populares</p>
          <div className="flex flex-wrap gap-2">
            {DESTINOS_SUGERIDOS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setQuery(d)}
                className="rounded-full border border-ink/15 px-4 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink/30"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      ) : sinResultados ? (
        <p className="py-10 text-center text-ink-soft">No encontramos resultados para &ldquo;{query}&rdquo;.</p>
      ) : (
        <CatalogoGrid>
          {promocionesFiltradas.map((p) => (
            <PromocionCard key={`promo-${p.id}`} promocion={p} />
          ))}
          {productosFiltrados.map((p) => (
            <ProductoCard key={`prod-${p.id}`} producto={p} />
          ))}
        </CatalogoGrid>
      )}
    </div>
  );
}
