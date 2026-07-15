import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FotoCarousel } from "@/components/catalogo/FotoCarousel";
import { ProductoInfo } from "@/components/producto/ProductoInfo";
import { fotosDe } from "@/lib/supabase/fotos";
import { jsonLdScript, buildProductJsonLd } from "@/lib/seo/jsonld";
import {
  getProductoPorId,
  getPromocionesPorProductoId,
  getTodosLosProductoIds,
} from "@/lib/supabase/queries";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const ids = await getTodosLosProductoIds();
  return ids.map((id) => ({ id: String(id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const producto = await getProductoPorId(Number(id));
  if (!producto) return {};
  const tarifa = producto.tarifas.find((t) => t.vigente);
  const description = producto.descripcion
    ? producto.descripcion.slice(0, 155)
    : `${producto.nombre}${producto.destino ? ` en ${producto.destino}` : ""}. Cotiza con Destino y Eventos Lotus 360.`;
  return {
    title: producto.nombre,
    description,
    alternates: { canonical: `/producto/${producto.id}` },
    openGraph: {
      title: producto.nombre,
      description,
      url: `/producto/${producto.id}`,
      images: fotosDe(producto.producto_fotos).slice(0, 1),
    },
    twitter: {
      card: "summary_large_image",
      title: producto.nombre,
      description,
      images: fotosDe(producto.producto_fotos).slice(0, 1),
    },
    other: tarifa ? { "product:price:amount": tarifa.precio_texto } : undefined,
  };
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProductoPorId(Number(id));
  if (!producto) notFound();

  const [promociones, fotos] = [
    await getPromocionesPorProductoId(producto.id),
    fotosDe(producto.producto_fotos),
  ];

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildProductJsonLd(producto))}
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <FotoCarousel fotos={fotos} alt={producto.nombre} />
        <ProductoInfo producto={producto} />
      </div>

      {promociones.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-2xl font-semibold text-ink">
            Promociones activas
          </h2>
          <ul className="flex flex-col gap-3">
            {promociones.map((promo) => (
              <li
                key={promo.id}
                className="rounded-xl bg-card p-4 shadow-[0_10px_28px_-14px_rgba(36,31,26,0.28)]"
              >
                <p className="font-bold text-ink">{promo.titulo}</p>
                {promo.precio_texto ? (
                  <p className="font-mono text-sm text-seafoam-text">{promo.precio_texto}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
