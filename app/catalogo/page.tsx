import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { CATEGORIAS, type Categoria } from "@/types/supabase";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import { fotosDe } from "@/lib/supabase/fotos";
import { jsonLdScript, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";

const TITLE = "Catálogo — Hoteles, Paquetes, Tours y Promociones en Venezuela";
const DESCRIPTION =
  "Explora hoteles, paquetes todo incluido, tours/full days y promociones de viajes en Venezuela: Los Roques, Margarita, Canaima, Morrocoy, Mérida y más.";

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
    <main className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildBreadcrumbJsonLd([{ name: "Inicio", url: "/" }, { name: "Catálogo", url: "/catalogo" }]))}
      />
      <header className="mb-8">
        <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral">Catálogo</p>
        <h1 className="font-display text-4xl font-semibold leading-none text-ink md:text-5xl">¿Qué estás buscando?</h1>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CATEGORIAS.map(({ slug, label }) => {
          const foto = fotosPorCategoria[slug] ?? FOTO_EDITORIAL[slug];
          return (
            <Link key={slug} href={`/catalogo/${slug}`} className="group relative aspect-[3/4] overflow-hidden rounded-[28px] bg-sand-2">
              <Image src={foto} alt={label} fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-dusk/80 via-dusk/0 to-dusk/0" />
              <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-2 text-dusk-text">
                <span className="font-display text-xl font-semibold">{label}</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm text-[#18181b]" aria-hidden="true">↗</span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/catalogo/hot-sales"
        className="mt-4 flex items-center justify-between gap-4 rounded-[28px] bg-coral px-6 py-6 text-white"
      >
        <span className="font-display text-xl font-semibold">🔥 Hot Sales — ofertas imperdibles</span>
        <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-sm text-[#18181b]" aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
