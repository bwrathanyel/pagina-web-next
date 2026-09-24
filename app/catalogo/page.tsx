import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CATEGORIAS, type Categoria } from "@/types/supabase";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import { fotosDe } from "@/lib/supabase/fotos";
import { Icono } from "@/components/ui/Icono";
import { jsonLdScript, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";

const TITLE = "Catálogo — Hoteles, Paquetes, Tours y Promociones en Venezuela";
const DESCRIPTION =
  "Explore hoteles, paquetes todo incluido, tours/full days y promociones de viajes en Venezuela: Los Roques, Margarita, Canaima, Morrocoy, Mérida y más.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/catalogo" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/catalogo" },
};

const FOTO_EDITORIAL: Record<Categoria, string> = {
  hoteles: "/images/editorial/escapada-caribe.png",
  paquetes: "/images/editorial/escapada-caribe.png",
  "guias-tours": "/images/editorial/tour-tropical.png",
  promociones: "/images/editorial/vuelo-a-tu-medida.png",
};

export default async function CatalogoIndexPage() {
  const [hoteles, promociones] = await Promise.all([
    getProductosPorCategoria("hoteles").catch(() => []),
    getPromociones().catch(() => []),
  ]);

  const fotosPorCategoria: Record<Categoria, string | null> = {
    hoteles: fotosDe(hoteles[0]?.producto_fotos)[0] ?? null,
    paquetes: null,
    "guias-tours": null,
    promociones: fotosDe(promociones[0]?.promocion_fotos)[0] ?? null,
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildBreadcrumbJsonLd([{ name: "Inicio", url: "/" }, { name: "Catálogo", url: "/catalogo" }]))}
      />
      <header className="mb-4 md:mb-8">
        <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-5xl">¿Qué está buscando?</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIAS.map(({ slug, label }) => {
          const foto = fotosPorCategoria[slug] ?? FOTO_EDITORIAL[slug];
          return (
            <Link key={slug} href={`/catalogo/${slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-card bg-sand-2 transition-[transform,box-shadow] duration-[var(--dur-media)] ease-salida hover:-translate-y-1 hover:shadow-lift motion-reduce:transition-none">
              <Image src={foto} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-[transform,scale,filter] duration-700 ease-salida group-hover:scale-[1.06] motion-reduce:transition-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-dusk/80 via-dusk/0 to-dusk/0" />
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-2 text-dusk-text">
                <span className="font-display text-xl font-bold">{label}</span>
                <span className="flex h-10 w-10 items-center justify-center rounded-pill bg-card text-ink" aria-hidden="true"><Icono nombre="flecha-der" tamano={18} /></span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/catalogo/hot-sales"
        className="mt-4 flex items-center justify-between gap-4 rounded-card bg-dusk px-6 py-6 text-dusk-text transition-colors duration-150 hover:bg-dusk-2"
      >
        <span className="font-display text-xl font-bold">Hot Sales: la mejor promoción de cada hotel</span>
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-pill bg-coral-bright text-btn-ink" aria-hidden="true"><Icono nombre="flecha-der" tamano={18} /></span>
      </Link>
    </main>
  );
}
