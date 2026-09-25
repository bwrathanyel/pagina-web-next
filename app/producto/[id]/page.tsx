import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GaleriaProducto } from "@/components/producto/GaleriaProducto";
import { ProductoInfo } from "@/components/producto/ProductoInfo";
import { ProductoAccionesOverlay, ProductoFooterMobile } from "@/components/producto/ProductoAccionesMobile";
import { fotosDe, fotosDeAncho } from "@/lib/supabase/fotos";
import { jsonLdScript, buildProductJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";
import { CarpetaTarifas } from "@/components/producto/CarpetaTarifas";
import { getProductoPorId, getTodosLosProductoIds } from "@/lib/supabase/queries";
import { tarifaDestacada } from "@/lib/tarifas";

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
  // La destacada la elige la base (`tarifa_destacada_id`): la más barata por
  // persona que se pueda vender hoy, no la primera fila que llegue.
  const tarifa = tarifaDestacada(producto);
  // "Nombre — Destino" mete el destino (la keyword long-tail real: "posada en
  // Los Roques", "hotel en Margarita") en el title sin inventar texto.
  const title = producto.destino ? `${producto.nombre} — ${producto.destino}` : producto.nombre;
  const description = producto.descripcion
    ? producto.descripcion.slice(0, 155)
    : `${producto.nombre}${producto.destino ? ` en ${producto.destino}` : ""}. Precios, fotos y disponibilidad real. Cotiza en línea o por WhatsApp, estés en Venezuela o en el exterior.`;
  return {
    title,
    description,
    alternates: { canonical: `/producto/${producto.id}` },
    openGraph: {
      title,
      description,
      url: `/producto/${producto.id}`,
      images: fotosDeAncho(producto.producto_fotos, 1280).slice(0, 1),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: fotosDeAncho(producto.producto_fotos, 1280).slice(0, 1),
    },
    other: tarifa ? { "product:price:amount": tarifa.precio_texto } : undefined,
  };
}

export default async function ProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProductoPorId(Number(id));
  if (!producto) notFound();

  const fotos = fotosDe(producto.producto_fotos);

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 pb-28 md:py-10 lg:pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildProductJsonLd(producto))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: producto.nombre, url: `/producto/${producto.id}` },
          ]),
        )}
      />
      <div className="relative">
        <ProductoAccionesOverlay tipo="producto" id={producto.id} nombre={producto.nombre} />
        <GaleriaProducto fotos={fotos} alt={producto.nombre} />
      </div>
      <ProductoInfo producto={producto}>
        <CarpetaTarifas producto={producto} />
      </ProductoInfo>
      <ProductoFooterMobile cotizarHref={`/cotizar/producto/${producto.id}`} />
    </main>
  );
}
