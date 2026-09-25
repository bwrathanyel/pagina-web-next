import type { Metadata } from "next";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";

export const metadata: Metadata = {
  title: "Página no encontrada",
  robots: { index: false },
};

// Casi siempre llega acá alguien con un enlace viejo de una promo que ya
// venció (se comparten por redes y quedan vivos meses): la salida útil es lo
// que se vende hoy, no la home.
export default function NotFound() {
  return (
    <section className="sobre-dusk bg-dusk px-5 py-16 text-dusk-text md:py-28">
      <div className="mx-auto max-w-[var(--ancho-medio)]">
        <h1 className="max-w-[16ch] font-display text-4xl font-extrabold leading-[1.02] tracking-tight text-balance md:text-6xl">
          No encontramos esta página
        </h1>
        <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-dusk-text-soft">
          Puede que la oferta ya haya vencido o que el enlace esté incompleto. Lo que se vende hoy
          está en el catálogo, y si busca algo puntual, se lo cotizamos.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Boton href="/catalogo" variante="firma" tamano="lg" iconoFin={<Icono nombre="flecha-der" />}>
            Ver ofertas vigentes
          </Boton>
          <Boton href="/cotizar" variante="sobre-foto" tamano="lg">
            Cotizar mi viaje
          </Boton>
        </div>
        <p className="mt-12 font-mono text-sm uppercase tracking-widest text-dusk-text-soft">Error 404</p>
      </div>
    </section>
  );
}
