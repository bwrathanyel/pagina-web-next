import Link from "next/link";
import type { Metadata } from "next";
import { REDES } from "@/lib/social";
import { NEGOCIO, aniosDeTrayectoria, direccionLegible } from "@/lib/seo/negocio";
import { jsonLdScript, buildBreadcrumbJsonLd } from "@/lib/seo/jsonld";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";
const TITLE = "Nosotros: agencia de viajes en Valencia, Venezuela";
const DESCRIPTION =
  "Quiénes somos en Destino y Eventos Lotus 360: agencia de viajes venezolana con sede en Valencia, datos legales, cómo trabajamos y cómo contactarnos.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/nosotros" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/nosotros" },
};

// BORRADOR 2026-10-28 — pendiente de revisión del dueño (historia y equipo).
export default function NosotrosPage() {
  const anios = aniosDeTrayectoria();
  const datos = [
    ["Razón social", NEGOCIO.nombre],
    ["RIF", NEGOCIO.rif],
    ["Registro Turístico Nacional", NEGOCIO.rtn],
    ["Dirección", direccionLegible()],
    ["Teléfono / WhatsApp", NEGOCIO.telefono],
    ["Correo", REDES.email],
  ].filter((d): d is [string, string] => Boolean(d[1]));

  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript({
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: `${SITE_URL}/nosotros`,
          name: TITLE,
          about: { "@id": `${SITE_URL}/#organization` },
        })}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: "Nosotros", url: "/nosotros" },
          ]),
        )}
      />
      <h1 className="mb-5 font-display text-3xl font-semibold text-ink">Quiénes somos</h1>
      <div className="flex flex-col gap-6 leading-7 text-ink-soft">
        <p className="text-lg text-ink">
          Destino y Eventos Lotus 360 es una agencia de viajes venezolana con sede en Valencia,
          Carabobo{anios ? `, con ${anios} años organizando viajes` : ""}. Vendemos hospedaje, paquetes
          con boleto aéreo, full days y excursiones en los principales destinos del país, y atendemos
          tanto a viajeros en Venezuela como a venezolanos en el exterior que compran el viaje para su
          familia.
        </p>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Cómo trabajamos</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Precios reales publicados: cada hotel del sitio muestra la tarifa vigente de nuestro tarifario.</li>
            <li>Atención directa con asesores de viaje por WhatsApp, Instagram y Facebook.</li>
            <li>Cotización y reserva en un solo lugar: hospedaje, boleto aéreo, traslados y excursiones.</li>
            <li>Pagos en bolívares o dólares, y opciones para quienes pagan desde el exterior.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Destinos que trabajamos</h2>
          <p>
            Los Roques, Isla de Margarita, Coche, Canaima y Salto Ángel, Mérida, Morrocoy y Chichiriviche,
            Caracas y Colonia Tovar, entre otros.{" "}
            <Link href="/destinos" className="underline underline-offset-4">Vea las guías por destino</Link>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Comunidad</h2>
          <p>
            Compartimos destinos y ofertas con más de 900.000 seguidores entre{" "}
            <a href={REDES.instagram} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">Instagram</a>,{" "}
            <a href={REDES.tiktok} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">TikTok</a> y{" "}
            <a href={REDES.facebook} className="underline underline-offset-4" target="_blank" rel="noopener noreferrer">Facebook</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Datos de la empresa</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {datos.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="font-semibold text-ink">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}
