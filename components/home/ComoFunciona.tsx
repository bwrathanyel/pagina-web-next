import Link from "next/link";

const PASOS = [
  {
    numero: "01",
    titulo: "Cuéntanos qué imaginas",
    texto: "Destino, fechas, personas y el tipo de experiencia que buscas. Solo lo esencial para empezar.",
  },
  {
    numero: "02",
    titulo: "Diseñamos opciones contigo",
    texto: "Un asesor revisa tu idea, aclara dudas y organiza alternativas que puedas comparar con calma.",
  },
  {
    numero: "03",
    titulo: "Viaja acompañado",
    texto: "Confirmas cuando estés listo y mantienes un contacto humano antes, durante y después del viaje.",
  },
];

export function ComoFunciona() {
  return (
    <section className="bg-dusk px-5 py-20 text-dusk-text md:py-28" aria-labelledby="como-funciona-heading">
      <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral">
            Así te acompañamos
          </p>
          <h2 id="como-funciona-heading" className="max-w-[11ch] text-balance font-display text-4xl font-semibold leading-[.98] tracking-[-0.03em] md:text-6xl">
            Menos vueltas. Más ganas de viajar.
          </h2>
          <p className="mt-6 max-w-md leading-7 text-dusk-text-soft">
            La tecnología ordena el proceso; las decisiones importantes siguen siendo humanas.
          </p>
          <Link href="/cotizador-personalizado" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-coral px-7 font-semibold text-white">
            Empezar mi cotización
          </Link>
        </div>

        <ol className="divide-y divide-dusk-text/12 border-y border-dusk-text/12">
          {PASOS.map((paso) => (
            <li key={paso.numero} className="grid gap-5 py-8 sm:grid-cols-[80px_1fr] md:py-10">
              <span className="font-mono text-sm font-bold text-coral">{paso.numero}</span>
              <div>
                <h3 className="font-display text-2xl font-semibold md:text-3xl">{paso.titulo}</h3>
                <p className="mt-3 max-w-xl leading-7 text-dusk-text-soft">{paso.texto}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
