import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoriaTabs } from "@/components/catalogo/CategoriaTabs";
import { CatalogHeader } from "@/components/catalogo/CatalogHeader";
import { FILA_FIJA } from "@/components/layout/filaFija";
import { GrillaFiltrable, type EntradaGrilla } from "@/components/catalogo/GrillaFiltrable";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { montoOrden, precioPorPersona, tarifaDestacada } from "@/lib/tarifas";
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
      "Ofertas de temporada en hoteles, posadas, full days y paquetes todo incluido: Los Roques, Margarita, Morrocoy y más. Precios reales, cotice en línea o por WhatsApp.",
    heading: "Promociones",
  },
  hoteles: {
    title: "Hoteles y Posadas en Venezuela — Margarita, Los Roques, Morrocoy",
    description:
      "Hoteles y posadas en Isla de Margarita, Los Roques, Morrocoy, Chichiriviche y Mérida. Fotos, precios y disponibilidad real, también si compra desde el exterior.",
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
      "Full days de playa y tours guiados por Venezuela: Los Roques, Canaima, Morrocoy y Chichiriviche, Mérida. Salidas con todo coordinado, cotice su fecha por WhatsApp.",
    heading: "Guías y tours",
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

  // "Recomendadas" = el orden de antes (destinos de la A a la Z, "Otros" al
  // final), ahora en una sola grilla que los chips filtran.
  const planas = (grupos as { destino: string; items: (Promocion | Producto)[] }[]).flatMap(
    ({ destino, items: delGrupo }) => delGrupo.map((item) => ({ destino, item })),
  );
  const entradas: EntradaGrilla[] = planas.map(({ destino, item }, i) => {
    if (esPromociones) {
      const p = item as Promocion;
      return { id: p.id, destino, monto: montoOrden(p), tarjeta: <PromocionCard promocion={p} prioridad={i < 2} /> };
    }
    const p = item as Producto;
    const destacada = tarifaDestacada(p);
    return {
      id: p.id,
      destino,
      monto: destacada?.precios ? precioPorPersona(destacada) : null,
      tarjeta: <ProductoCard producto={p} prioridad={i < 2} />,
    };
  });

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
      <h1 className="mb-4 font-display text-3xl font-bold text-ink lg:hidden">Catálogo</h1>
      <div className="hidden lg:block">
        <CatalogHeader
          categoria={categoria}
          label={SEO_POR_CATEGORIA[categoria].heading}
          count={items.length}
        />
      </div>

      {/* Hija directa de <main>: sticky no sale de su padre. */}
      <div className={FILA_FIJA + " mb-6 lg:mb-10"}>
        <CategoriaTabs activa={categoria} className="px-5 scroll-px-5" />
      </div>

      {items.length === 0 ? (
        <p className="text-ink-soft">
          No hay {label.toLowerCase()} disponibles ahora mismo. Escríbanos por WhatsApp y le
          contamos qué opciones podemos preparar.
        </p>
      ) : (
        <GrillaFiltrable
          entradas={entradas}
          destinos={grupos.map((g) => g.destino)}
          vacio="No hay opciones en este destino ahora mismo. Escríbanos por WhatsApp y le contamos qué podemos preparar."
        />
      )}
    </main>
  );
}
