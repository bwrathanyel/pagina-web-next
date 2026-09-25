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
import { Boton } from "@/components/ui/Boton";
import { EsqueletoTarjeta } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Icono";
import type { Producto, Promocion } from "@/types/supabase";

function FavoritosLista() {
  const { user } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!user) return;
    let vigente = true;
    supabaseBrowser()
      .from("web_favoritos")
      // `web_favoritos.promocion_id` ya apunta a `tarifas` (Fase 5 paso 4: los
      // flyers se mudaron y la FK se repuntó), así que el embed va a la tabla
      // real, no a la vista de compatibilidad.
      .select(`producto_id, promocion_id, producto:productos(${PRODUCTO_SELECT}), promocion:tarifas(${PROMOCION_SELECT})`)
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
  }, [user, intento]);

  const total = productos.length + promociones.length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-4 md:py-14">
      <div className="mb-6 flex items-center gap-3 md:mb-8">
        <Link
          href="/cuenta"
          aria-label="Volver a mi cuenta"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill border border-linea text-ink transition-colors duration-150 hover:bg-sand-2"
        >
          <Icono nombre="flecha-izq" tamano={18} />
        </Link>
        <h1 className="font-display text-3xl font-bold leading-none text-ink md:text-4xl">Mis favoritos</h1>
        {!cargando && !error && total > 0 ? (
          <p className="ml-auto font-mono text-sm tabular-nums text-ink-soft">
            {total} {total === 1 ? "guardado" : "guardados"}
          </p>
        ) : null}
      </div>

      {cargando ? (
        <div role="status">
          <span className="sr-only">Cargando sus favoritos…</span>
          <CatalogoGrid>
            {Array.from({ length: 4 }, (_, i) => (
              <EsqueletoTarjeta key={i} />
            ))}
          </CatalogoGrid>
        </div>
      ) : error ? (
        <div role="alert" className="flex flex-col items-start gap-4 py-10">
          <p className="text-ink">No pudimos cargar sus favoritos. Revise su conexión e intente de nuevo.</p>
          <Boton
            variante="secundario"
            onClick={() => {
              setError(false);
              setCargando(true);
              setIntento((n) => n + 1);
            }}
          >
            Reintentar
          </Boton>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-coral/10 text-coral" aria-hidden="true">
            <Icono nombre="corazon" tamano={28} />
          </span>
          <p className="font-display text-2xl font-bold text-ink">Todavía no ha guardado nada</p>
          <p className="max-w-xs text-ink-soft">
            Toque el corazón en cualquier hotel, tour o promoción y lo encontrará aquí cuando quiera volver a verlo.
          </p>
          <Boton href="/catalogo" className="mt-2" iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
            Explorar el catálogo
          </Boton>
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
