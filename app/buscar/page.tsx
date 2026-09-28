import { Suspense } from "react";
import { BuscarClient } from "@/components/catalogo/BuscarClient";
import { BuscarDesdeUrl } from "@/components/catalogo/BuscarDesdeUrl";
import { getHotSales, getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import type { Metadata } from "next";

// No indexado a propósito: la página es un shell de búsqueda client-side sin
// query en la URL, siempre el mismo contenido vacío para un crawler -- no
// aporta como resultado de búsqueda propio (a diferencia de /catalogo, que
// sí lista contenido real). Ver auditoría 2026-07-23.
export const metadata: Metadata = {
  title: "Buscar",
  description: "Busque hoteles, paquetes, tours y promociones de viaje en Venezuela por nombre o destino.",
  alternates: { canonical: "/buscar" },
  robots: { index: false, follow: true },
};

export default async function BuscarPage() {
  const [hoteles, paquetes, guiasTours, promociones, hotSales] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getProductosPorCategoria("paquetes").catch(() => []),
    getProductosPorCategoria("guias-tours").catch(() => []),
    getPromociones().catch(() => []),
    getHotSales().catch(() => []),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 md:py-14">
      <h1 className="mb-4 font-display text-3xl font-semibold text-ink md:text-4xl">Buscar</h1>
      {/* El fallback es el mismo buscador vacío: el HTML estático ya trae el campo. */}
      <Suspense fallback={<BuscarClient productos={[]} promociones={[]} hotSales={[]} />}>
        <BuscarDesdeUrl productos={[...hoteles, ...paquetes, ...guiasTours]} promociones={promociones} hotSales={hotSales} />
      </Suspense>
    </main>
  );
}
