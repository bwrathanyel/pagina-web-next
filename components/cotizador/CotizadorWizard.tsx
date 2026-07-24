"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { WIZARD_CONFIG } from "@/components/cotizador/wizardConfig";
import { CampoRenderer } from "@/components/cotizador/fields/CampoRenderer";
import type { Respuestas, TipoCotizacion } from "@/components/cotizador/types";
import { ASESOR_BOLETERIA, elegirAsesor } from "@/lib/asesores";
import {
  armarBoleteria,
  armarFullday,
  armarHospedaje,
  armarPaquete,
  armarPersonalizado,
} from "@/lib/leads/buildCotizacion";
import { enviarACRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";

const TITULOS: Record<TipoCotizacion, string> = {
  hospedaje: "Cotiza tu hospedaje",
  boleteria: "Cotiza tu vuelo",
  fullday: "Reserva tu grupo",
  paquete: "Consulta tu paquete",
  personalizado: "Cotizador Personalizado",
};

function defaultsDe(tipo: TipoCotizacion): Respuestas {
  const respuestas: Respuestas = {};
  for (const paso of WIZARD_CONFIG[tipo]) {
    for (const campo of paso.campos) {
      if (campo.default !== undefined) respuestas[campo.key] = campo.default;
    }
  }
  return respuestas;
}

export function CotizadorWizard({
  tipo,
  productoNombre,
}: {
  tipo: TipoCotizacion;
  productoNombre?: string;
}) {
  const router = useRouter();
  const pasos = WIZARD_CONFIG[tipo];
  const [pasoActual, setPasoActual] = useState(0);
  const [respuestas, setRespuestas] = useState<Respuestas>(() => {
    const base = defaultsDe(tipo);
    if (productoNombre && tipo === "fullday") base.destino = productoNombre;
    if (productoNombre && tipo === "paquete") base.destino = productoNombre;
    return base;
  });
  const [enviado, setEnviado] = useState(false);
  const [waHref, setWaHref] = useState<string | null>(null);
  // Ref, no state: un doble-click antes del próximo render vería el mismo
  // `enviado` (closure viejo) y mandaría el lead dos veces — el ref se lee
  // sincrónico, sin esperar a que React re-renderice.
  const enviandoRef = useRef(false);

  const paso = pasos[pasoActual];
  const esUltimo = pasoActual === pasos.length - 1;

  const camposVisibles = useMemo(
    () => paso.campos.filter((c) => !c.condicion || c.condicion(respuestas)),
    [paso, respuestas],
  );

  const faltanRequeridos = camposVisibles.some(
    (c) => c.required && !respuestas[c.key] && respuestas[c.key] !== 0,
  );

  function actualizar(key: string, valor: Respuestas[string]) {
    setRespuestas((r) => ({ ...r, [key]: valor }));
  }

  function enviar() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    const nombreFullday = productoNombre ?? (respuestas.destino as string) ?? "Full Day";
    const resultado =
      tipo === "hospedaje"
        ? armarHospedaje(respuestas)
        : tipo === "boleteria"
          ? armarBoleteria(respuestas)
          : tipo === "fullday"
            ? armarFullday(respuestas, nombreFullday)
            : tipo === "personalizado"
              ? armarPersonalizado(respuestas)
              : armarPaquete(respuestas);

    const asesor = tipo === "boleteria" ? ASESOR_BOLETERIA : elegirAsesor();
    const telefono = (respuestas.telefono as string) || "No especificado";
    const nombre = (respuestas.nombre as string) || "";

    enviarASheetMonkey({
      destino: resultado.destino,
      servicio: resultado.servicio,
      pagina: TITULOS[tipo],
      nombre,
      procedencia: detectarProcedencia(),
      telefono,
      asesor: asesor.telefono,
    });
    enviarACRM({
      nombre,
      telefono,
      destino: resultado.destino,
      personas: resultado.personas,
      consulta: resultado.consulta,
    });

    const mensaje = esInstagramInApp() ? resultado.mensajeTexto : resultado.mensajeEmoji;
    setWaHref(`https://wa.me/${asesor.telefono}?text=${encodeURIComponent(mensaje)}`);
    setEnviado(true);
  }

  if (enviado && waHref) {
    return (
      <div className="rounded-2xl border border-ink/10 bg-card p-6 text-center">
        <p className="mb-2 font-display text-2xl font-semibold text-ink">¡Listo!</p>
        <p className="mb-5 text-ink-soft">
          Ya armamos tu solicitud. Envíala por WhatsApp y un asesor te responde.
        </p>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-whatsapp px-6 font-semibold text-white"
        >
          Enviar a un asesor
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-6">
      <div className="mb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={() => (pasoActual > 0 ? setPasoActual((p) => p - 1) : router.back())}
          aria-label="Volver"
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-ink-soft lg:hidden"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="font-mono text-xs uppercase tracking-wide text-ink-soft">
          {TITULOS[tipo]} · Paso {pasoActual + 1} de {pasos.length}
        </p>
      </div>

      <div className="mb-5 flex items-center gap-1.5" aria-hidden="true">
        {pasos.map((_, i) => (
          <span
            key={i}
            className={
              "h-2 flex-1 rounded-full " +
              (i <= pasoActual ? "bg-gradient-to-r from-coral to-gold" : "bg-sand-2")
            }
          />
        ))}
      </div>

      <h2 className="mb-4 font-display text-xl font-semibold text-ink">{paso.titulo}</h2>

      <div className="flex flex-col gap-5">
        {camposVisibles.map((campo) => (
          <CampoRenderer key={campo.key} campo={campo} valor={respuestas[campo.key]} onChange={actualizar} />
        ))}
      </div>

      {faltanRequeridos ? (
        <p className="mt-4 text-sm text-ink-soft" role="status">
          Completa los campos obligatorios (*) para continuar.
        </p>
      ) : null}

      {/* Desktop: botones inline, igual que siempre. Mobile: mismos botones
          pero en barra sticky arriba del bottom tab bar, así en pasos largos
          (ej. hospedaje con amenidades) no hay que scrollear para avanzar. */}
      <div className="mt-6 hidden gap-3 lg:flex">
        <BotonesWizard
          pasoActual={pasoActual}
          esUltimo={esUltimo}
          faltanRequeridos={faltanRequeridos}
          onAtras={() => setPasoActual((p) => p - 1)}
          onSiguiente={() => (esUltimo ? enviar() : setPasoActual((p) => p + 1))}
        />
      </div>
      <div
        className="fixed inset-x-0 z-30 flex gap-3 border-t border-ink/10 bg-card/95 px-5 py-3 backdrop-blur-lg lg:hidden"
        style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
      >
        <BotonesWizard
          pasoActual={pasoActual}
          esUltimo={esUltimo}
          faltanRequeridos={faltanRequeridos}
          onAtras={() => setPasoActual((p) => p - 1)}
          onSiguiente={() => (esUltimo ? enviar() : setPasoActual((p) => p + 1))}
        />
      </div>
    </div>
  );
}

function BotonesWizard({
  pasoActual,
  esUltimo,
  faltanRequeridos,
  onAtras,
  onSiguiente,
}: {
  pasoActual: number;
  esUltimo: boolean;
  faltanRequeridos: boolean;
  onAtras: () => void;
  onSiguiente: () => void;
}) {
  return (
    <>
      {pasoActual > 0 ? (
        <button
          type="button"
          onClick={onAtras}
          className="min-h-11 flex-1 rounded-full border border-ink/20 px-4 font-semibold text-ink"
        >
          Atrás
        </button>
      ) : null}
      <button
        type="button"
        disabled={faltanRequeridos}
        onClick={onSiguiente}
        className="min-h-11 flex-1 rounded-full bg-gradient-to-br from-coral to-gold px-4 font-semibold text-btn-ink disabled:opacity-40"
      >
        {esUltimo ? "Enviar" : "Siguiente"}
      </button>
    </>
  );
}
