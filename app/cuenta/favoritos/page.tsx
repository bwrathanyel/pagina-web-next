"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { supabaseBrowser } from "@/lib/supabase/client";
import { PRODUCTO_SELECT, PROMOCION_SELECT } from "@/lib/supabase/queries";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import type { Producto, Promocion } from "@/types/supabase";

function FavoritosLista() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!user) return;
    let vigente = true;
    supabaseBrowser()
      .from("web_favoritos")
      .select(`producto_id, promocion_id, producto:productos(${PRODUCTO_SELECT}), promocion:promociones(${PROMOCION_SELECT})`)
      .eq("usuario_id", user.id)
      .then(({ data, error: err }) => {
        if (!vigente) return;
        if (err || !data) {
          setError(true);
          setCargando(false);
          return;
        }
        const filas = data as unknown as { producto: Producto | null; promocion: Promocion | null }[];
        setProductos(filas.map((f) => f.producto).filter((p): p is Producto => Boolean(p)));
        setPromociones(filas.map((f) => f.promocion).filter((p): p is Promocion => Boolean(p)));
        setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [user]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/cuenta"
          aria-label="Volver a mi cuenta"
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <h1 className="font-display text-3xl font-semibold text-ink">Mis favoritos</h1>
      </div>

      {cargando ? (
        <p className="text-ink-soft">Cargando…</p>
      ) : error ? (
        <p className="text-coral">No pudimos cargar tus favoritos. Recarga la página.</p>
      ) : productos.length === 0 && promociones.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-coral/10 text-coral" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.7 1.8 4 5.5 4c2.1 0 3.6 1.1 4.5 2.3C10.9 5.1 12.4 4 14.5 4 18.2 4 19.7 7.7 18 11.2c-2.5 4.7-10 9.3-10 9.3z" />
            </svg>
          </span>
          <p className="font-display text-xl font-semibold text-ink">Nada guardado todavía</p>
          <p className="max-w-xs text-ink-soft">
            Toca el corazón en cualquier hotel, tour o promoción del catálogo para verlo aquí.
          </p>
          <Link
            href="/catalogo"
            className="mt-2 inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
          >
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <CatalogoGrid>
          {promociones.map((p) => (
            <PromocionCard key={`promo-${p.id}`} promocion={p} />
          ))}
          {productos.map((p) => (
            <ProductoCard key={`prod-${p.id}`} producto={p} />
          ))}
        </CatalogoGrid>
      )}
    </main>
  );
}

export default function FavoritosPage() {
  return (
    <RequiereSesion>
      <FavoritosLista />
    </RequiereSesion>
  );
}
