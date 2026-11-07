import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { FondoPaisaje } from "@/components/layout/FondoPaisaje";
import { ProductoCard } from "@/components/catalogo/ProductoCard";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { getProductosPorCategoria } from "@/lib/supabase/queries";
import { DESTINOS, destinoPorSlug } from "@/lib/seo/destinos";
import {
  jsonLdScript,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
  buildItemListJsonLd,
  buildTouristDestinationJsonLd,
} from "@/lib/seo/jsonld";

export const dynamicParams = false;

export function generateStaticParams() {
  return DESTINOS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const destino = destinoPorSlug((await params).slug);
  if (!destino) return {};
  const imagen = [`${destino.foto}-1280.jpg`];
  return {
    title: destino.titulo,
    description: destino.descripcion,
    alternates: { canonical: `/destinos/${destino.slug}` },
    openGraph: { title: destino.titulo, description: destino.descripcion, url: `/destinos/${destino.slug}`, images: imagen },
    twitter: { card: "summary_large_image", title: destino.titulo, description: destino.descripcion, images: imagen },
  };
}

export default async function DestinoPage({ params }: { params: Promise<{ slug: string }> }) {
  const destino = destinoPorSlug((await params).slug);
  if (!destino) notFound();

  const hoteles = (await getProductosPorCategoria("hoteles")).filter(
    (p) => p.destino && destino.destinosDb.includes(p.destino),
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 md:py-12">
      <FondoPaisaje destino={destino.destinosDb[0]} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(buildTouristDestinationJsonLd(destino))} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(buildFaqJsonLd(destino.faqs))} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: "Destinos", url: "/destinos" },
            { name: destino.nombre, url: `/destinos/${destino.slug}` },
          ]),
        )}
      />
      {hoteles.length > 0 ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(
            buildItemListJsonLd(hoteles.map((p) => ({ name: p.nombre, url: `/producto/${p.id}` }))),
          )}
        />
      ) : null}

      <nav aria-label="Migas de pan" className="mb-4 text-sm text-ink-soft">
        <Link href="/destinos" className="underline underline-offset-4">Destinos</Link> › {destino.nombre}
      </nav>

      <article className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-balance font-display text-3xl font-bold leading-tight text-ink md:text-5xl">
          {destino.titulo}
        </h1>
        <img
          src={`${destino.foto}-1280.jpg`}
          srcSet={`${destino.foto}-828.jpg 828w, ${destino.foto}-1280.jpg 1280w, ${destino.foto}-1920.jpg 1920w`}
          sizes="(min-width: 768px) 768px, 100vw"
          alt={`Paisaje de ${destino.nombre}, Venezuela`}
          width={1280}
          height={720}
          className="mb-6 aspect-video w-full rounded-2xl object-cover"
          fetchPriority="high"
        />
        <p className="mb-8 text-lg leading-8 text-ink">{destino.intro}</p>

        <div className="flex flex-col gap-8 leading-7 text-ink-soft">
          {destino.secciones.map((s) => (
            <section key={s.titulo}>
              <h2 className="mb-2 font-display text-2xl font-semibold text-ink">{s.titulo}</h2>
              {s.parrafos.map((t) => (
                <p key={t.slice(0, 40)} className="mb-3">{t}</p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <section aria-labelledby="hoteles" className="mt-12">
        <h2 id="hoteles" className="mb-5 font-display text-2xl font-bold text-ink md:text-3xl">
          Hoteles y posadas en {destino.nombre}
        </h2>
        {hoteles.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {hoteles.map((p, i) => (
              <ProductoCard key={p.id} producto={p} prioridad={i < 2} />
            ))}
          </div>
        ) : (
          <p className="text-ink-soft">
            Ahora mismo no tenemos tarifas publicadas en {destino.nombre}. Escríbanos por WhatsApp y le
            preparamos opciones.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Boton href={`/cotizar?destino=${encodeURIComponent(destino.destinoCotizador)}`}>Cotizar mi viaje</Boton>
          {hoteles.length === 0 ? (
            <WhatsAppLeadButton
              mensajeBase={`Hola, vengo de la guía de ${destino.nombre} y quiero opciones de hospedaje.`}
              destinoInicial={destino.destinoCotizador}
              triggerClassName={clasesBoton({ variante: "whatsapp" })}
            >
              <WhatsAppIcon size={20} />
              Escribir por WhatsApp
            </WhatsAppLeadButton>
          ) : null}
          <Boton href="/catalogo/paquetes" variante="secundario">Ver paquetes con boleto</Boton>
        </div>
      </section>

      <section aria-labelledby="faq" className="mx-auto mt-12 max-w-3xl">
        <h2 id="faq" className="mb-4 font-display text-2xl font-bold text-ink">
          Preguntas frecuentes sobre {destino.nombre}
        </h2>
        <div className="flex flex-col gap-3">
          {destino.faqs.map((f) => (
            <details key={f.p} className="rounded-xl bg-card p-4 open:shadow-sm">
              <summary className="cursor-pointer font-semibold text-ink">{f.p}</summary>
              <p className="mt-2 leading-7 text-ink-soft">{f.r}</p>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
