import { PostulacionForm } from "@/components/empleo/PostulacionForm";
import { EntrevistaIA } from "@/components/empleo/EntrevistaIA";

export const metadata = {
  title: "Trabaja con nosotros | Destino y Eventos Lotus 360",
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
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gold text-sm font-bold text-btn-ink" aria-hidden="true">✓</span>
      <span className="leading-6 text-dusk-text-soft">{children}</span>
    </li>
  );
}

export default function TrabajaConNosotrosPage() {
  return (
    <main>
      <section className="bg-dusk">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral-bright">Estamos contratando</p>
          <h1 className="mt-3 max-w-2xl text-balance font-display text-4xl font-semibold leading-tight text-dusk-text md:text-6xl">
            Forma parte de <span className="text-gold">nuestro equipo</span>.
          </h1>
          <p className="mt-5 max-w-xl leading-7 text-dusk-text-soft">
            Buscamos personal que resida en Valencia, preferiblemente en Naguanagua. Tenemos vacantes
            presenciales en oficina y también posiciones freelance por turnos, para quienes prefieren
            trabajar de forma remota.
          </p>

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            <div className="rounded-[28px] border border-dusk-text/12 bg-dusk-2 p-6 md:p-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">Modalidad presencial</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-dusk-text">Oficina en Naguanagua</h2>
              <p className="mt-2 text-sm leading-6 text-dusk-text-soft">Solicitamos profesionales en el área de:</p>
              <ul className="mt-4 flex flex-col gap-3">
                {ROLES_PRESENCIAL.map((rol) => <Check key={rol}>{rol}</Check>)}
              </ul>
            </div>

            <div className="rounded-[28px] border border-dusk-text/12 bg-dusk-2 p-6 md:p-8">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">Modalidad freelance</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-dusk-text">Asesor de Ventas Freelance</h2>
              <p className="mt-2 text-sm leading-6 text-dusk-text-soft">
                Trabajo remoto por turnos -- diurno (9:00am a 5:00pm) o nocturno (6:00pm a 12:00am). Sueldo
                base más comisión por venta; los detalles de compensación te los compartimos apenas
                recibamos tu postulación.
              </p>
              <p className="mt-4 text-sm font-bold text-dusk-text">Requisitos para trabajar desde casa:</p>
              <ul className="mt-3 flex flex-col gap-3">
                {REQUISITOS_FREELANCE.map((req) => <Check key={req}>{req}</Check>)}
              </ul>
            </div>
          </div>

          <p className="mt-10 text-sm leading-6 text-dusk-text-soft">
            Experiencia comprobable. También puedes enviar tu CV directo a{" "}
            <a href="mailto:corporativo.lotus360@gmail.com" className="font-bold text-gold underline underline-offset-2">
              corporativo.lotus360@gmail.com
            </a>.
          </p>
        </div>
      </section>

      {/* Dos caminos para postularse, a propósito: charlar con la IA (rápido,
          sin CV) o el formulario de siempre (con CV adjunto). Ambos terminan
          en la misma tabla postulaciones_empleo del CRM. */}
      <section className="bg-dusk">
        <div className="mx-auto max-w-2xl px-5 pb-16 md:pb-20">
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">
            Opción rápida
          </p>
          <h2 className="mb-3 font-display text-2xl font-semibold text-dusk-text md:text-3xl">
            Postúlate conversando
          </h2>
          <p className="mb-6 text-sm leading-6 text-dusk-text-soft">
            Cuéntale a nuestra asistente qué buscas y cuál es tu experiencia. Te hace unas preguntas
            y deja tu postulación registrada al instante, sin llenar formularios.
          </p>
          <EntrevistaIA />
        </div>
      </section>

      <section className="bg-sand">
        <div className="mx-auto max-w-2xl px-5 py-16 md:py-20">
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-coral">
            O si prefieres el formulario
          </p>
          <h2 className="mb-6 font-display text-2xl font-semibold text-ink md:text-3xl">
            Envía tus datos y tu CV
          </h2>
          <PostulacionForm modalidadInicial="presencial" />
        </div>
      </section>
    </main>
  );
}
