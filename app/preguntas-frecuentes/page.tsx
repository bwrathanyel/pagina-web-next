import Link from "next/link";
import type { Metadata } from "next";
import { FAQ_GENERAL } from "@/lib/seo/faq";
import { jsonLdScript, buildBreadcrumbJsonLd, buildFaqJsonLd } from "@/lib/seo/jsonld";

const TITLE = "Preguntas frecuentes sobre viajar en Venezuela";
const DESCRIPTION =
  "Cómo reservar, medios de pago, comprar desde el exterior, mejores destinos y mejor época para viajar a Venezuela. Respuestas de Destino y Eventos Lotus 360.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/preguntas-frecuentes" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/preguntas-frecuentes" },
};

export default function PreguntasFrecuentesPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(buildFaqJsonLd(FAQ_GENERAL.flatMap((g) => g.faqs)))}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(
          buildBreadcrumbJsonLd([
            { name: "Inicio", url: "/" },
            { name: "Preguntas frecuentes", url: "/preguntas-frecuentes" },
          ]),
        )}
      />
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Preguntas frecuentes</h1>
      <div className="flex flex-col gap-10">
        {FAQ_GENERAL.map((g) => (
          <section key={g.grupo}>
            <h2 className="mb-3 font-display text-xl font-semibold text-ink">{g.grupo}</h2>
            <div className="flex flex-col gap-3">
              {g.faqs.map((f) => (
                <details key={f.p} className="rounded-xl bg-card p-4 open:shadow-sm">
                  <summary className="cursor-pointer font-semibold text-ink">{f.p}</summary>
                  <p className="mt-2 leading-7 text-ink-soft">{f.r}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
      <p className="mt-10 text-ink-soft">
        ¿No encontró su respuesta? Vea nuestras <Link href="/destinos" className="underline underline-offset-4">guías por destino</Link> o
        conozca <Link href="/nosotros" className="underline underline-offset-4">quiénes somos</Link>.
      </p>
    </main>
  );
}
