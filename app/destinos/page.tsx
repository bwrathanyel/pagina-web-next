import Link from "next/link";
import type { Metadata } from "next";
import { DESTINOS } from "@/lib/seo/destinos";
import { jsonLdScript, buildBreadcrumbJsonLd, buildItemListJsonLd } from "@/lib/seo/jsonld";

const TITLE = "Destinos turísticos de Venezuela: guías y hoteles";
const DESCRIPTION =
  "Guías de viaje a Los Roques, Isla de Margarita, Canaima, Mérida y Morrocoy: cómo llegar, mejor época, qué hacer y hoteles con precio real.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/destinos" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/destinos" },
};

export default function DestinosPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-6 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: "Destinos", url: "/destinos" },
          ]),
        )}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildItemListJsonLd(DESTINOS.map((d) => ({ name: d.nombre, url: `/destinos/${d.slug}` }))),
        )}
      />
      <h1 className="mb-3 font-display text-3xl font-bold text-ink md:text-5xl">Destinos en Venezuela</h1>
      <p className="mb-8 max-w-2xl leading-7 text-ink-soft">
        Las guías que usamos con nuestros clientes: cómo llegar, cuándo ir, dónde dormir y qué hacer en
        cada destino, con los hoteles que vendemos y su precio actualizado.
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {DESTINOS.map((d) => (
          <Link key={d.slug} href={`/destinos/${d.slug}`} className="group overflow-hidden rounded-2xl bg-card">
            <img
              src={`${d.foto}-828.jpg`}
              alt={`${d.nombre}, Venezuela`}
              width={828}
              height={466}
              loading="lazy"
              className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
            />
            <div className="p-4">
              <h2 className="font-display text-xl font-bold text-ink">{d.nombre}</h2>
              <p className="mt-1 line-clamp-3 text-sm text-ink-soft">{d.intro}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
