import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoriaTabs } from "@/components/catalogo/CategoriaTabs";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import { agruparPorDestino } from "@/lib/supabase/agruparPorDestino";
import { CATEGORIAS, type Categoria, type Producto, type Promocion } from "@/types/supabase";

export const revalidate = 300;

const SLUGS = CATEGORIAS.map((c) => c.slug);

const DESCRIPCIONES: Record<Categoria, string> = {
  promociones: "Opciones destacadas para aprovechar cuando encuentres el plan indicado.",
  hoteles: "Hospedajes para descansar, celebrar o descubrir un destino a tu manera.",
  paquetes: "Experiencias organizadas para que disfrutes más y coordines menos.",
  "guias-tours": "Recorridos y actividades para conocer cada lugar con más contexto.",
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
  const label = CATEGORIAS.find((c) => c.slug === categoria)!.label;
  const description = `Catálogo de ${label.toLowerCase()} de Destino y Eventos Lotus 360 — precios, fotos y disponibilidad real.`;
  return {
    title: label,
    description,
    alternates: { canonical: `/catalogo/${categoria}` },
    openGraph: { title: label, description, url: `/catalogo/${categoria}` },
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

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:py-14">
      <header className="mb-7 overflow-hidden rounded-[32px] bg-dusk px-7 py-9 text-dusk-text md:px-10 md:py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral">
              Catálogo Destino y Eventos Lotus 360
            </p>
            <h1 className="font-display text-4xl font-semibold leading-none md:text-6xl">{label}</h1>
            <p className="mt-4 max-w-xl leading-7 text-dusk-text-soft">{DESCRIPCIONES[categoria]}</p>
          </div>
          <span className="w-fit rounded-full border border-dusk-text/15 px-4 py-2 font-mono text-xs text-dusk-text-soft">
            {items.length} {items.length === 1 ? "opción" : "opciones"}
          </span>
        </div>
      </header>

      <div className="mb-10">
        <CategoriaTabs activa={categoria} />
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
                  ? (itemsDelGrupo as Promocion[]).map((p) => (
                      <PromocionCard key={p.id} promocion={p} />
                    ))
                  : (itemsDelGrupo as Producto[]).map((p) => <ProductoCard key={p.id} producto={p} />)}
              </CatalogoGrid>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
