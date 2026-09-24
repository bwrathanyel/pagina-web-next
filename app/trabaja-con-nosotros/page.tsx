import { PostulacionForm } from "@/components/empleo/PostulacionForm";
import { EntrevistaIA } from "@/components/empleo/EntrevistaIA";
import { Icono } from "@/components/ui/Icono";

export const metadata = {
  title: "Trabaje con nosotros",
  description: "Estamos contratando: vacantes presenciales en Naguanagua (Valencia) y posiciones freelance por turnos.",
};

const ROLES_PRESENCIAL = [
  "Asesores y Ejecutivos de Ventas",
  "Asistente Administrativo",
  "Agente de Boletería Aérea (con experiencia comprobable en ventas de boletería nacional e internacional)",
];

const REQUISITOS_FREELANCE = [
  "Internet de fibra óptica",
  "UPS para cuando se va la electricidad",
  "Laptop con SSD y mínimo 8GB de RAM",
  "Plan de datos móvil de respaldo",
  "Espacio tranquilo para llamadas, con audio claro",
];

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill bg-gold text-btn-ink" aria-hidden="true">
        <Icono nombre="check" tamano={14} />
      </span>
      <span className="leading-6 text-dusk-text-soft">{children}</span>
    </li>
  );
}

export default function TrabajaConNosotrosPage() {
  return (
    <main>
      <section className="bg-dusk">
        <div className="mx-auto max-w-6xl px-5 py-9 md:py-20">
          <h1 className="max-w-2xl text-balance font-display text-5xl font-bold leading-[0.95] tracking-[-0.02em] text-dusk-text md:text-7xl">
            Forme parte de <span className="text-gold">nuestro equipo</span>
          </h1>
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-dusk-text-soft">Vacantes abiertas · Naguanagua y remoto</p>
          <p className="mt-5 max-w-xl leading-7 text-dusk-text-soft">
            Buscamos personal que resida en Valencia, preferiblemente en Naguanagua. Tenemos vacantes
            presenciales en oficina y también posiciones freelance por turnos, para quienes prefieren
            trabajar de forma remota.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="rounded-card border border-dusk-text/12 bg-dusk-2 p-6 md:p-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-dusk-text">Oficina en Naguanagua</h2>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">Modalidad presencial</p>
              <p className="mt-2 text-sm leading-6 text-dusk-text-soft">Solicitamos profesionales en el área de:</p>
              <ul className="mt-4 flex flex-col gap-3">
                {ROLES_PRESENCIAL.map((rol) => <Check key={rol}>{rol}</Check>)}
              </ul>
            </div>

            <div className="rounded-card border border-dusk-text/12 bg-dusk-2 p-6 md:p-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-dusk-text">Asesor de Ventas Freelance</h2>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">Modalidad freelance</p>
              <p className="mt-2 text-sm leading-6 text-dusk-text-soft">
                Trabajo remoto por turnos: diurno (9:00am a 5:00pm) o nocturno (6:00pm a 12:00am). Sueldo
                base más comisión por venta; los detalles de compensación se los compartimos apenas
                recibamos su postulación.
              </p>
              <p className="mt-4 text-sm font-bold text-dusk-text">Requisitos para trabajar desde casa:</p>
              <ul className="mt-3 flex flex-col gap-3">
                {REQUISITOS_FREELANCE.map((req) => <Check key={req}>{req}</Check>)}
              </ul>
            </div>
          </div>

          <p className="mt-10 text-sm leading-6 text-dusk-text-soft">
            Experiencia comprobable. También puede enviar su CV directo a{" "}
            <a href="mailto:corporativo.lotus360@gmail.com" className="font-bold text-gold underline underline-offset-2">
              corporativo.lotus360@gmail.com
            </a>.
          </p>
        </div>
      </section>

      {/* Dos caminos para postularse, a propósito: charlar con la IA (rápido,
          con opción de adjuntar el CV en el chat -- botón de clip) o el
          formulario de siempre. Ambos terminan en la misma tabla
          postulaciones_empleo del CRM. */}
      <section className="bg-dusk">
        <div className="mx-auto max-w-2xl px-5 pb-9 md:pb-16">
          <h2 className="font-display text-3xl font-bold leading-tight text-dusk-text md:text-4xl">Postúlese conversando</h2>
          <p className="mb-4 mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">La opción rápida</p>
          <p className="mb-6 text-sm leading-6 text-dusk-text-soft">
            Cuéntele a nuestra asistente qué busca y cuál es su experiencia. Le hace unas preguntas,
            le pide su CV (puede adjuntarlo con el botón de clip) y deja su postulación registrada al
            instante, sin llenar formularios.
          </p>
          <EntrevistaIA />
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-2xl px-5 py-9 md:py-16">
          <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">O envíe sus datos y su CV</h2>
          <p className="mb-6 mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Por formulario</p>
          <PostulacionForm modalidadInicial="presencial" />
        </div>
      </section>
    </main>
  );
}
