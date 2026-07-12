import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";

const BADGES = [
  "Líderes en Venezuela",
  "+800K seguidores",
  "Alcance Internacional",
];

export function PlanesCorporativos() {
  return (
    <section className="bg-dusk px-5 py-14 text-center">
      <div className="mx-auto max-w-2xl">
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-dusk-text-soft">
          Planes Corporativos
        </p>
        <p className="mb-6 text-dusk-text">
          Eventos corporativos y fiestas temáticas · Paquetes vacacionales y turísticos ·
          Actividades de integración institucional
        </p>

        <div className="flex flex-col items-center gap-3">
          <a
            href="https://ig.me/m/destinoyeventoslotus360"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
          >
            Ver promociones 🔥
          </a>
          <a
            href={`mailto:${REDES.email}`}
            className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full border border-dusk-text/25 px-6 font-semibold text-dusk-text"
          >
            Correo corporativo
          </a>
          <a
            href={whatsappHref("Hola! -- Vengo de su página web.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full max-w-xs items-center justify-center gap-2 rounded-full border border-dusk-text/25 px-6 font-semibold text-dusk-text"
          >
            WhatsApp corporativo
          </a>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {BADGES.map((b) => (
            <span
              key={b}
              className="rounded-full bg-dusk-2 px-3 py-1.5 text-xs text-dusk-text-soft"
            >
              {b}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
