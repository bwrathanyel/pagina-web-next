import Link from "next/link";
import { RegistroEvento } from "@/components/evento/RegistroEvento";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { hoyCaracas } from "@/lib/cotizador/estado";

export const metadata = {
  title: "Juega y viaja | Destino y Eventos Lotus 360",
  description: "Regístrese y participe en el stand de Lotus 360 por hospedajes y descuentos en su próximo viaje.",
  robots: { index: false, follow: false },
};

const EVENTO = "naguanagua-akapellah-2026-09-18";

// El vencimiento se compara contra el día de hoy: la página se arma en cada visita.
export const dynamic = "force-dynamic";

export default function JuegaPage() {
  const fechaEvento = EVENTO.match(/(\d{4}-\d{2}-\d{2})$/)?.[1];
  const vencido = Boolean(fechaEvento && hoyCaracas() > fechaEvento);
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
          Juegue y <span className="text-gold">viaje</span>.
        </h1>
        {vencido ? (
          <div role="status" className="mt-4 rounded-card border border-gold/30 bg-dusk-2 p-5">
            <p className="font-bold text-dusk-text">Este evento ya terminó.</p>
            <p className="mt-1 leading-6 text-dusk-text-soft">
              El stand cerró y ya no se reciben registros nuevos. Si se registró antes, su código sigue abajo. Puede jugar
              en línea o ver las ofertas vigentes.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a href="/juegos" className={clasesBoton({ variante: "firma", tamano: "md" })}>
                Ir a los juegos
              </a>
              <Boton href="/catalogo/hot-sales" variante="sobre-foto" tamano="md">
                Ver Hot Sales
              </Boton>
            </div>
          </div>
        ) : (
          <p className="mt-3 leading-6 text-dusk-text-soft">
            Regístrese, reciba su código y muéstrelo en el stand para jugar por hospedajes,
            Margarita todo incluido y descuentos.
          </p>
        )}
        <div className="mt-5">
          <RegistroEvento evento={EVENTO} />
        </div>
      </section>
    </main>
  );
}
