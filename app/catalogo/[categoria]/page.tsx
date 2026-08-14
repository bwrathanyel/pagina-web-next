import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoriaTabs } from "@/components/catalogo/CategoriaTabs";
import { CatalogHeader } from "@/components/catalogo/CatalogHeader";
import { CatalogoMobileHeader } from "@/components/catalogo/CatalogoMobileHeader";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { Revelar } from "@/components/ui/Revelar";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import { agruparPorDestino } from "@/lib/supabase/agruparPorDestino";
import { jsonLdScript, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";
import { CATEGORIAS, type Categoria, type Producto, type Promocion } from "@/types/supabase";

const SLUGS = CATEGORIAS.map((c) => c.slug);

// SEO por categoría: los title/description apuntan a las búsquedas long-tail
// reales del nicho ("posadas en Los Roques", "paquetes todo incluido Venezuela",
// "full day Morrocoy", "boletos aéreos nacionales") en vez del label genérico.
// heading es el h1 visible — misma intención, redactado natural.
const SEO_POR_CATEGORIA: Record<Categoria, { title: string; description: string; heading: string }> = {
  promociones: {
    title: "Promociones y Ofertas de Viajes en Venezuela",
    description:
      "Ofertas de temporada en hoteles, posadas, full days y paquetes todo incluido: Los Roques, Margarita, Morrocoy y más. Precios reales, cotiza en línea o por WhatsApp.",
    heading: "Promociones",
  },
  hoteles: {
    title: "Hoteles y Posadas en Venezuela — Margarita, Los Roques, Morrocoy",
    description:
      "Reserva hoteles y posadas en Isla de Margarita, Los Roques, Morrocoy, Chichiriviche y Mérida. Fotos, precios y disponibilidad real — también si compras desde el exterior.",
    heading: "Hoteles y posadas",
  },
  paquetes: {
    title: "Paquetes Turísticos Todo Incluido en Venezuela",
    description:
      "Paquetes de viaje todo incluido en Venezuela: Los Roques, Canaima y Salto Ángel, Isla de Margarita y Mérida. Ideales para lunas de miel, familias y regalos a familiares.",
    heading: "Paquetes turísticos",
  },
  "guias-tours": {
    title: "Tours y Full Days en Venezuela — Los Roques, Canaima, Morrocoy",
    description:
      "Full days de playa y tours guiados por Venezuela: Los Roques, Canaima, Morrocoy y Chichiriviche, Mérida. Salidas con todo coordinado, cotiza tu fecha por WhatsApp.",
    heading: "Guías / Tours",
  },
};

function isCategoria(value: string): value is Categoria {
  return (SLUGS as string[]).includes(value);
}

export function generateStaticParams() {
  return SLUGS.map((categoria) => ({ categoria }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categoria: string }>;
}): Promise<Metadata> {
  const { categoria } = await params;
  if (!isCategoria(categoria)) return {};
  const { title, description } = SEO_POR_CATEGORIA[categoria];
  return {
    title,
    description,
    alternates: { canonical: `/catalogo/${categoria}` },
    openGraph: { title, description, url: `/catalogo/${categoria}` },
  };
}

export default async function CatalogoPage({
  params,
}: {
  params: Promise<{ categoria: string }>;
}) {
  const { categoria } = await params;
  if (!isCategoria(categoria)) notFound();

  const label = CATEGORIAS.find((c) => c.slug === categoria)!.label;
  const esPromociones = categoria === "promociones";
  const items = esPromociones ? await getPromociones() : await getProductosPorCategoria(categoria);

  const grupos = esPromociones
    ? agruparPorDestino(items as Promocion[], (p) => p.producto?.destino ?? null)
    : agruparPorDestino(items as Producto[], (p) => p.destino);

  const itemList = esPromociones
    ? (items as Promocion[])
        .filter((p) => p.producto)
        .map((p) => ({ name: p.titulo, url: `/producto/${p.producto!.id}` }))
    : (items as Producto[]).map((p) => ({ name: p.nombre, url: `/producto/${p.id}` }));

  return (
    <main className="mx-auto max-w-7xl px-5 py-4 md:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: label, url: `/catalogo/${categoria}` },
          ]),
        )}
      />
      {itemList.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(buildItemListJsonLd(itemList))}
        />
      ) : null}
      <CatalogoMobileHeader activa={categoria} />

      <div className="hidden lg:block">
        <CatalogHeader
          categoria={categoria}
          label={SEO_POR_CATEGORIA[categoria].heading}
          count={items.length}
        />

        <div className="mb-10">
          <CategoriaTabs activa={categoria} />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-ink-soft">
          No hay {label.toLowerCase()} disponibles ahora mismo. Escríbenos por WhatsApp y te
          contamos qué opciones podemos preparar.
        </p>
      ) : (
        <div className="flex flex-col gap-10">
          {grupos.map(({ destino, items: itemsDelGrupo }) => (
            <section key={destino}>
              <div className="mb-5 flex items-end justify-between gap-4 border-b border-ink/10 pb-3">
                <h2 className="font-display text-2xl font-semibold text-ink">{destino}</h2>
                <span className="font-mono text-xs text-ink-soft">
                  {itemsDelGrupo.length} {itemsDelGrupo.length === 1 ? "opción" : "opciones"}
                </span>
              </div>
              <CatalogoGrid>
                {esPromociones
                  ? (itemsDelGrupo as Promocion[]).map((p, i) => (
                      <Revelar key={p.id} retraso={i * 50}>
                        <PromocionCard promocion={p} />
                      </Revelar>
                    ))
                  : (itemsDelGrupo as Producto[]).map((p, i) => (
                      <Revelar key={p.id} retraso={i * 50}>
                        <ProductoCard producto={p} />
                      </Revelar>
                    ))}
              </CatalogoGrid>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
