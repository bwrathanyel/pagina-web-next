"use client";

import { useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import type { ModalidadEmpleo } from "@/lib/empleo/postularEmpleo";
import { EntrevistaIA } from "./EntrevistaIA";
import { PostulacionForm } from "./PostulacionForm";

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

type Camino = "formulario" | "chat";

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

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">{etiqueta}</dt>
      <dd className="mt-1 text-sm leading-6 text-dusk-text">{valor}</dd>
    </div>
  );
}

export function VacantesYPostulacion() {
  const [modalidad, setModalidad] = useState<ModalidadEmpleo>("presencial");
  const [camino, setCamino] = useState<Camino>("formulario");

  function postularme(nueva: ModalidadEmpleo) {
    setModalidad(nueva);
    setCamino("formulario");
  }

  return (
    <>
      <section className="bg-dusk">
        <div className="mx-auto max-w-6xl px-5 pb-12 md:pb-20">
          <div className="grid gap-6 md:grid-cols-2 md:gap-8">
            <div className="flex flex-col rounded-card border border-dusk-text/12 bg-dusk-2 p-6 md:p-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-dusk-text">Oficina en Naguanagua</h2>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">Modalidad presencial</p>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                <Dato etiqueta="Dónde" valor="Naguanagua, Valencia" />
                <Dato etiqueta="Quién" valor="Personal que resida en Valencia" />
              </dl>
              <p className="mt-5 text-sm leading-6 text-dusk-text-soft">Solicitamos profesionales en el área de:</p>
              <ul className="mt-3 flex flex-col gap-3">
                {ROLES_PRESENCIAL.map((rol) => <Check key={rol}>{rol}</Check>)}
              </ul>
              <Boton href="#postular" ancho className="mt-8 md:mt-auto" onClick={() => postularme("presencial")}>
                Postularme a la oficina
              </Boton>
            </div>

            <div className="flex flex-col rounded-card border border-dusk-text/12 bg-dusk-2 p-6 md:p-8">
              <h2 className="font-display text-3xl font-bold leading-tight text-dusk-text">Asesor de Ventas Freelance</h2>
              <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-gold">Modalidad freelance</p>
              <dl className="mt-5 grid grid-cols-2 gap-4">
                <Dato etiqueta="Dónde" valor="Remoto, desde casa" />
                <Dato etiqueta="Turnos" valor="Diurno 9:00am–5:00pm o nocturno 6:00pm–12:00am" />
                <Dato etiqueta="Pago" valor="Sueldo base más comisión por venta" />
              </dl>
              <p className="mt-5 text-sm font-bold text-dusk-text">Necesita tener en casa:</p>
              <ul className="mt-3 flex flex-col gap-3">
                {REQUISITOS_FREELANCE.map((req) => <Check key={req}>{req}</Check>)}
              </ul>
              <Boton href="#postular" ancho className="mt-8 md:mt-auto" onClick={() => postularme("freelance")}>
                Postularme como freelance
              </Boton>
            </div>
          </div>
        </div>
      </section>

      <section id="postular" className="scroll-mt-20 bg-sand">
        <div className="mx-auto max-w-2xl px-5 pb-28 pt-9 md:py-16">
          <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">Postúlese en 1 minuto</h2>
          <p className="mb-6 mt-2 text-sm leading-6 text-ink-soft">
            Solo necesitamos su nombre y teléfono. El CV es opcional.
          </p>

          <div role="tablist" aria-label="Cómo postularse" className="mb-6 grid grid-cols-2 gap-1 rounded-control bg-sand-2 p-1">
            {([["formulario", "Formulario"], ["chat", "Conversar con Lotus"]] as const).map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                role="tab"
                aria-selected={camino === valor}
                onClick={() => setCamino(valor)}
                className={
                  "min-h-11 rounded-control text-sm font-semibold transition-colors duration-150 " +
                  (camino === valor ? "bg-acento text-sobre-acento" : "text-ink-soft hover:text-ink")
                }
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {camino === "formulario" ? (
            <PostulacionForm modalidad={modalidad} onModalidad={setModalidad} />
          ) : (
            <EntrevistaIA />
          )}

          <p className="mt-6 text-sm leading-6 text-ink-soft">
            ¿Prefiere enviar su CV por correo? Escriba a{" "}
            <a href="mailto:corporativo.lotus360@gmail.com" className="font-bold text-ink underline underline-offset-2">
              corporativo.lotus360@gmail.com
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
