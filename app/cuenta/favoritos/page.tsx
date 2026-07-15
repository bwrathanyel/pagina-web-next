"use client";

import { useEffect, useState } from "react";
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
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Mis favoritos</h1>

      {cargando ? (
        <p className="text-ink-soft">Cargando…</p>
      ) : error ? (
        <p className="text-coral">No pudimos cargar tus favoritos. Recargá la página.</p>
      ) : productos.length === 0 && promociones.length === 0 ? (
        <p className="text-ink-soft">
          Todavía no guardaste nada. Tocá el corazón en cualquier hotel, tour o promoción del
          catálogo para guardarlo acá.
        </p>
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
