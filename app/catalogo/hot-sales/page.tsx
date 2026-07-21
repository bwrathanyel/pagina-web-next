import type { Metadata } from "next";
import { HotSalesGrid } from "@/components/catalogo/HotSalesGrid";
import { getPromociones } from "@/lib/supabase/queries";
import { promosHotSales } from "@/lib/promociones/hotSales";
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
  const promociones = await getPromociones().catch(() => []);
  const pool = promosHotSales(promociones);

  const itemList = pool
    .filter((p) => p.producto)
    .map((p) => ({ name: p.titulo, url: `/producto/${p.producto!.id}` }));

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:py-14">
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

      <header className="mb-7 overflow-hidden rounded-[32px] bg-dusk px-7 py-9 text-dusk-text md:px-10 md:py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral-bright">🔥 Ofertas imperdibles</p>
            <h1 className="font-display text-4xl font-semibold leading-none md:text-6xl">Hot Sales</h1>
            <p className="mt-4 max-w-xl leading-7 text-dusk-text-soft">
              Las mejores promociones de cada hotel, ordenadas de menor a mayor precio. Sin repetir hotel, sin vueltas.
            </p>
          </div>
          <span className="w-fit rounded-full border border-dusk-text/15 px-4 py-2 font-mono text-xs text-dusk-text-soft">
            {pool.length} {pool.length === 1 ? "oferta" : "ofertas"}
          </span>
        </div>
      </header>

      <HotSalesGrid pool={pool} />
    </main>
  );
}
