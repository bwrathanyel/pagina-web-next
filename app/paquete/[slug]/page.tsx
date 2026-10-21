import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FichaPaquete } from "@/components/paquetes/FichaPaquete";
import { rutasVuelo } from "@/lib/supabase/queries";
import { getPaquetePorSlug, getSlugsPaquetes } from "@/lib/paquetes/queries";
import { origenesValidos } from "@/lib/paquetes/precio";
import { fotoDerivada } from "@/lib/supabase/imageLoader";
import { jsonLdScript, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";

export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getSlugsPaquetes();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const paquete = await getPaquetePorSlug(slug);
  if (!paquete) return {};
  const title = `${paquete.titulo} — boleto y hotel`;
  const description = (
    paquete.descripcion ??
    `Paquete con boleto aéreo ida y vuelta y hotel ${paquete.hotel.nombre}${paquete.hotel.destino ? ` en ${paquete.hotel.destino}` : ""}.`
  ).slice(0, 155);
  const imagen = paquete.hotel.fotos[0] ? [fotoDerivada(paquete.hotel.fotos[0], 1280)] : undefined;
  return {
    title,
    description,
    alternates: { canonical: `/paquete/${paquete.slug}` },
    openGraph: { title, description, url: `/paquete/${paquete.slug}`, images: imagen },
    twitter: { card: "summary_large_image", title, description, images: imagen },
  };
}

export default async function PaquetePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [paquete, rutas] = await Promise.all([getPaquetePorSlug(slug), rutasVuelo()]);
  if (!paquete || !origenesValidos(paquete, rutas, paquete.fecha_entrada).length) notFound();

  return (
    <main className="mx-auto max-w-7xl px-5 py-6 pb-44 md:py-10 lg:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: "Paquetes", url: "/catalogo/paquetes" },
            { name: paquete.titulo, url: `/paquete/${paquete.slug}` },
          ]),
        )}
      />
      <FichaPaquete paquete={paquete} rutas={rutas} />
    </main>
  );
}
