import Link from "next/link";
import { RegistroEvento } from "@/components/evento/RegistroEvento";

export const metadata = {
  title: "Juega y viaja | Destino y Eventos Lotus 360",
  description: "Regístrate y participa en el stand de Lotus 360 por hospedajes y descuentos en tu próximo viaje.",
  robots: { index: false, follow: false },
};

const EVENTO = "naguanagua-akapellah-2026-09-18";

export default function JuegaPage() {
  return (
    <main className="min-h-[100svh] bg-dusk">
      <section className="mx-auto max-w-lg px-5 pb-8 pt-6 md:pt-16">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Volver al inicio"
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-dusk-text/15 text-dusk-text"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-gold">Stand Lotus 360 · C.C. Cristal</p>
        </div>
        <h1 className="mt-2 text-balance font-display text-4xl font-semibold leading-tight text-dusk-text">
          Juega y <span className="text-gold">viaja</span>.
        </h1>
        <p className="mt-3 leading-6 text-dusk-text-soft">
          Regístrate, recibe tu código y muéstralo en el stand para jugar por hospedajes,
          Margarita todo incluido y descuentos.
        </p>
        <div className="mt-5">
          <RegistroEvento evento={EVENTO} />
        </div>
      </section>
    </main>
  );
}
