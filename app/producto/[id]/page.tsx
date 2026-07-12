import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { FotoCarousel } from "@/components/catalogo/FotoCarousel";
import { BADGE_POR_TIPO } from "@/components/catalogo/ProductoCard";
import { fotosDe } from "@/lib/supabase/fotos";
import { whatsappHref } from "@/lib/whatsapp";
import { tipoCotizacionDe } from "@/lib/cotizarTipo";
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
    : `${producto.nombre}${producto.destino ? ` en ${producto.destino}` : ""}. Cotiza con Lotus 360.`;
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
  const tarifaVigente = producto.tarifas.find((t) => t.vigente);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildProductJsonLd(producto))}
      />
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <FotoCarousel fotos={fotos} alt={producto.nombre} />

        <div>
          <span className="mb-2 inline-block rounded-full bg-dusk/85 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-dusk-text">
            {BADGE_POR_TIPO[producto.tipo]}
          </span>
          <h1 className="mb-1 font-display text-3xl font-semibold text-ink">{producto.nombre}</h1>
          {producto.destino ? <p className="mb-4 text-ink-soft">{producto.destino}</p> : null}

          <span
            className={
              "mb-5 inline-block rounded-full px-3 py-1.5 font-mono text-sm " +
              (tarifaVigente
                ? "bg-gradient-to-br from-coral to-gold text-btn-ink"
                : "bg-seafoam-bg text-seafoam-text")
            }
          >
            {tarifaVigente?.precio_texto ?? "Consultar disponibilidad"}
          </span>
          {tarifaVigente?.vigencia_texto ? (
            <p className="mb-5 -mt-3 text-sm text-ink-soft">{tarifaVigente.vigencia_texto}</p>
          ) : null}

          {producto.descripcion ? (
            <p className="mb-4 whitespace-pre-line text-ink">{producto.descripcion}</p>
          ) : null}
          {producto.requisitos ? (
            <div className="mb-5">
              <p className="mb-1 font-mono text-xs uppercase tracking-wide text-ink-soft">
                Requisitos
              </p>
              <p className="whitespace-pre-line text-ink">{producto.requisitos}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/cotizar/${tipoCotizacionDe(producto)}?producto=${producto.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
            >
              Cotizar
            </Link>
            <a
              href={whatsappHref(`Hola! Quiero info de ${producto.nombre}`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-whatsapp px-6 font-semibold text-white"
            >
              WhatsApp
            </a>
          </div>
        </div>
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
                className="rounded-xl bg-[#FFFDF8] p-4 shadow-[0_10px_28px_-14px_rgba(36,31,26,0.28)]"
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
