import type { Metadata } from "next";
import { HotSalesGrid } from "@/components/catalogo/HotSalesGrid";
import { BuscarClient } from "@/components/catalogo/BuscarClient";
import { getHotSales } from "@/lib/supabase/queries";
import { jsonLdScript, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";

const TITLE = "Hot Sales — Las Mejores Ofertas de Hoteles en Venezuela";
const DESCRIPTION =
  "Las mejores promociones de hoteles en un solo lugar: Los Roques, Margarita, Morrocoy, Mérida y más. Precios reales, sin repetir hotel.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/catalogo/hot-sales" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/catalogo/hot-sales" },
};

export default async function HotSalesPage() {
  const pool = await getHotSales().catch(() => []);

  const itemList = pool
    .filter((p) => p.producto)
    .map((p) => ({ name: p.titulo, url: `/producto/${p.producto!.id}` }));

  return (
    <main className="mx-auto max-w-7xl px-5 py-6 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: "Hot Sales", url: "/catalogo/hot-sales" },
          ]),
        )}
      />
      {itemList.length > 0 ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(buildItemListJsonLd(itemList))} />
      ) : null}

      <header className="mb-4 overflow-hidden rounded-none bg-transparent px-0 py-0 text-ink md:mb-7 md:rounded-card md:bg-dusk md:px-10 md:py-12 md:text-dusk-text">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end md:gap-8">
          <div>
            <h1 className="font-display text-3xl font-bold leading-none md:text-6xl">Hot Sales</h1>
            <p className="mt-3 max-w-xl leading-7 text-ink-soft md:mt-4 md:text-dusk-text-soft">
              La mejor promoción vigente de cada hotel, con las destacadas primero.
            </p>
          </div>
          <span className="w-fit rounded-pill border border-linea-fuerte px-4 py-2 font-mono text-xs text-ink-soft md:border-dusk-text/20 md:text-dusk-text-soft">
            {pool.length} {pool.length === 1 ? "oferta" : "ofertas"}
          </span>
        </div>
      </header>

      <div className="mb-4 lg:hidden">
        <BuscarClient productos={[]} promociones={pool} autoFocus={false} compacto />
      </div>

      <HotSalesGrid pool={pool} />
    </main>
  );
}
