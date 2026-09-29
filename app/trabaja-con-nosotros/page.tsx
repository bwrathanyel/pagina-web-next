import { VacantesYPostulacion } from "@/components/empleo/VacantesYPostulacion";

export const metadata = {
  title: "Trabaje con nosotros",
  description: "Estamos contratando: vacantes presenciales en Naguanagua (Valencia) y posiciones freelance por turnos.",
};

export default function TrabajaConNosotrosPage() {
  return (
    <main>
      <section className="bg-dusk">
        <div className="mx-auto max-w-6xl px-5 py-9 md:py-16">
          <h1 className="max-w-2xl text-balance font-display text-5xl font-bold leading-[0.95] tracking-[-0.02em] text-dusk-text md:text-7xl">
            Forme parte de <span className="text-gold">nuestro equipo</span>
          </h1>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-dusk-text-soft">Vacantes abiertas · Naguanagua y remoto</p>
          <p className="mt-5 max-w-xl leading-7 text-dusk-text-soft">
            Elija la vacante que le interesa y postúlese en un minuto.
          </p>
        </div>
      </section>

      <VacantesYPostulacion />
    </main>
  );
}
