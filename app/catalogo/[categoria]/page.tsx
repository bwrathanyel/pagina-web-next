import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CategoriaTabs } from "@/components/catalogo/CategoriaTabs";
import { CatalogoGrid } from "@/components/catalogo/CatalogoGrid";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { PromocionCard } from "@/components/catalogo/PromocionCard";
import { getProductosPorCategoria, getPromociones } from "@/lib/supabase/queries";
import { CATEGORIAS, type Categoria } from "@/types/supabase";

export const revalidate = 300;

const SLUGS = CATEGORIAS.map((c) => c.slug);

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
  const description = `Catálogo de ${label.toLowerCase()} de Lotus 360 — precios, fotos y disponibilidad real.`;
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
  const items =
    categoria === "promociones"
      ? await getPromociones()
      : await getProductosPorCategoria(categoria);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">{label}</h1>
      <p className="mb-6 text-ink-soft">
        {items.length} {items.length === 1 ? "resultado" : "resultados"}
      </p>

      <div className="mb-8">
        <CategoriaTabs activa={categoria} />
      </div>

      {items.length === 0 ? (
        <p className="text-ink-soft">
          No hay {label.toLowerCase()} disponibles ahora mismo. Escribinos por WhatsApp y te
          contamos qué hay.
        </p>
      ) : (
        <CatalogoGrid>
          {categoria === "promociones"
            ? (items as Awaited<ReturnType<typeof getPromociones>>).map((p) => (
                <PromocionCard key={p.id} promocion={p} />
              ))
            : (items as Awaited<ReturnType<typeof getProductosPorCategoria>>).map((p) => (
                <ProductoCard key={p.id} producto={p} />
              ))}
        </CatalogoGrid>
      )}
    </main>
  );
}
