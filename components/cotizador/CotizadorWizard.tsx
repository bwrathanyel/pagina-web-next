"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { m } from "motion/react";
import { TITULOS_COTIZADOR as TITULOS, WIZARD_CONFIG } from "@/components/cotizador/wizardConfig";
import { CampoRenderer } from "@/components/cotizador/fields/CampoRenderer";
import type { Respuestas, TipoCotizacion } from "@/components/cotizador/types";
import { SolicitudLista } from "@/components/leads/SolicitudLista";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { ASESOR_BOLETERIA, asesorPorNombre, elegirAsesor } from "@/lib/asesores";
import {
  armarBoleteria,
  armarFullday,
  armarHospedaje,
  armarPaquete,
  armarPersonalizado,
} from "@/lib/leads/buildCotizacion";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";

const CURVA = [0.22, 1, 0.36, 1] as const;

function defaultsDe(tipo: TipoCotizacion): Respuestas {
  const respuestas: Respuestas = {};
  for (const paso of WIZARD_CONFIG[tipo]) {
    for (const campo of paso.campos) {
      if (campo.default !== undefined) respuestas[campo.key] = campo.default;
    }
  }
  return respuestas;
}

// Primer paso con un requerido sin responder: quien llega desde el cotizador
// rápido del hero no vuelve a elegir lo que ya eligió.
function primerPasoIncompleto(tipo: TipoCotizacion, r: Respuestas): number {
  const idx = WIZARD_CONFIG[tipo].findIndex((paso) =>
    paso.campos.some((c) => (!c.condicion || c.condicion(r)) && c.required && !r[c.key] && r[c.key] !== 0),
  );
  return idx < 0 ? 0 : idx;
}

export function CotizadorWizard({
  tipo,
  productoNombre,
  inicial,
}: {
  tipo: TipoCotizacion;
  productoNombre?: string;
  /** Respuestas que ya trae la URL (cotizador rápido del hero). */
  inicial?: Respuestas;
}) {
  const router = useRouter();
  const pasos = WIZARD_CONFIG[tipo];
  const [respuestas, setRespuestas] = useState<Respuestas>(() => {
    const base = { ...defaultsDe(tipo), ...inicial };
    if (productoNombre && tipo === "fullday") base.destino = productoNombre;
    if (productoNombre && tipo === "paquete") base.destino = productoNombre;
    return base;
  });
  const [pasoActual, setPasoActual] = useState(() => (inicial ? primerPasoIncompleto(tipo, respuestas) : 0));
  const [enviando, setEnviando] = useState(false);
  const [waHref, setWaHref] = useState<string | null>(null);
  // Ref, no state: un doble-click antes del próximo render vería el mismo
  // `enviando` (closure viejo) y mandaría el lead dos veces — el ref se lee
  // sincrónico, sin esperar a que React re-renderice.
  const enviandoRef = useRef(false);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const primerPaso = useRef(true);

  const paso = pasos[pasoActual];
  const esUltimo = pasoActual === pasos.length - 1;

  const camposVisibles = useMemo(
    () => paso.campos.filter((c) => !c.condicion || c.condicion(respuestas)),
    [paso, respuestas],
  );

  const faltanRequeridos = camposVisibles.some(
    (c) => c.required && !respuestas[c.key] && respuestas[c.key] !== 0,
  );

  // Al cambiar de paso, el foco va al título nuevo: con teclado o lector de
  // pantalla no se queda en un botón de la barra de abajo sin contexto.
  useEffect(() => {
    if (primerPaso.current) {
      primerPaso.current = false;
      return;
    }
    tituloRef.current?.focus({ preventScroll: true });
    const reducir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    tituloRef.current?.scrollIntoView({ block: "start", behavior: reducir ? "auto" : "smooth" });
  }, [pasoActual]);

  function actualizar(key: string, valor: Respuestas[string]) {
    setRespuestas((r) => ({ ...r, [key]: valor }));
  }

  async function enviar() {
    if (enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
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

      const asesorLocal = tipo === "boleteria" ? ASESOR_BOLETERIA : elegirAsesor();
      const telefono = (respuestas.telefono as string) || "";
      const nombre = (respuestas.nombre as string) || "";

      enviarASheetMonkey({
        destino: resultado.destino,
        servicio: resultado.servicio,
        pagina: TITULOS[tipo],
        nombre,
        procedencia: detectarProcedencia(),
        telefono: telefono || "No especificado",
        asesor: asesorLocal.telefono,
      });
      const leadCRM = await crearLeadCRM({
        nombre,
        telefono,
        destino: resultado.destino,
        personas: resultado.personas,
        consulta: resultado.consulta,
      }).catch(() => null);
      // Boletería siempre va al asesor fijo de esa rama; el resto prefiere el
      // asesor que el CRM realmente asignó sobre el elegido localmente.
      const asesor = tipo === "boleteria"
        ? asesorLocal
        : (asesorPorNombre(leadCRM?.asesor) ?? asesorLocal);

      const mensaje = esInstagramInApp() ? resultado.mensajeTexto : resultado.mensajeEmoji;
      setWaHref(`https://wa.me/${asesor.telefono}?text=${encodeURIComponent(mensaje)}`);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  if (waHref) {
    return <SolicitudLista waHref={waHref} detalle={TITULOS[tipo]} />;
  }

  const atras = () => (pasoActual > 0 ? setPasoActual((p) => p - 1) : router.back());
  const siguiente = () => (esUltimo ? enviar() : setPasoActual((p) => p + 1));

  return (
    <div className="rounded-card border border-linea bg-card p-6">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={atras}
          aria-label={pasoActual > 0 ? "Paso anterior" : "Volver"}
          className="-ml-3 flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-ink lg:hidden"
        >
          <Icono nombre="flecha-izq" />
        </button>
        <p className="font-mono text-xs font-bold uppercase tabular-nums tracking-[0.14em] text-ink-soft">
          Paso {pasoActual + 1} de {pasos.length}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label="Avance del cotizador"
        aria-valuemin={1}
        aria-valuemax={pasos.length}
        aria-valuenow={pasoActual + 1}
        aria-valuetext={`Paso ${pasoActual + 1} de ${pasos.length}`}
        className="mb-6 mt-3 flex items-center gap-1.5"
      >
        {pasos.map((_, i) => (
          <span key={i} className="h-1.5 flex-1 overflow-hidden rounded-pill bg-sand-2">
            <span
              className={
                "franja-marca block h-full origin-left transition-transform duration-[var(--dur-media)] ease-salida motion-reduce:transition-none " +
                (i <= pasoActual ? "scale-x-100" : "scale-x-0")
              }
              style={{ transitionDelay: i === pasoActual ? "80ms" : undefined }}
            />
          </span>
        ))}
      </div>

      <m.div
        key={pasoActual}
        initial={pasoActual === 0 ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: CURVA }}
      >
        <h2
          ref={tituloRef}
          tabIndex={-1}
          className="mb-5 scroll-mt-24 font-display text-2xl font-bold leading-tight text-ink md:text-3xl"
        >
          {paso.titulo}
        </h2>

        <div className="flex flex-col gap-6">
          {camposVisibles.map((campo) => (
            <CampoRenderer key={campo.key} campo={campo} valor={respuestas[campo.key]} onChange={actualizar} />
          ))}
        </div>
      </m.div>

      {faltanRequeridos ? (
        <p className="mt-5 text-sm text-ink-soft" role="status">
          Complete los campos marcados con * para continuar.
        </p>
      ) : null}

      {/* Escritorio: botones al pie de la tarjeta. Móvil: los mismos en una
          barra fija sobre la barra inferior, así en pasos largos (hospedaje
          con amenidades) no hay que bajar para avanzar. */}
      <div className="mt-8 hidden gap-3 lg:flex">
        <BotonesWizard
          pasoActual={pasoActual}
          esUltimo={esUltimo}
          faltanRequeridos={faltanRequeridos}
          enviando={enviando}
          onAtras={atras}
          onSiguiente={siguiente}
        />
      </div>
      <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 flex gap-3 border-t border-linea bg-card px-5 py-3 lg:hidden">
        <BotonesWizard
          pasoActual={pasoActual}
          esUltimo={esUltimo}
          faltanRequeridos={faltanRequeridos}
          enviando={enviando}
          onAtras={atras}
          onSiguiente={siguiente}
        />
      </div>
    </div>
  );
}

function BotonesWizard({
  pasoActual,
  esUltimo,
  faltanRequeridos,
  enviando,
  onAtras,
  onSiguiente,
}: {
  pasoActual: number;
  esUltimo: boolean;
  faltanRequeridos: boolean;
  enviando: boolean;
  onAtras: () => void;
  onSiguiente: () => void;
}) {
  return (
    <>
      {pasoActual > 0 ? (
        <Boton variante="secundario" tamano="lg" onClick={onAtras} className="flex-1" disabled={enviando}>
          Atrás
        </Boton>
      ) : null}
      <Boton
        tamano="lg"
        onClick={onSiguiente}
        disabled={faltanRequeridos}
        cargando={enviando}
        className="flex-[2]"
        iconoFin={esUltimo ? undefined : <Icono nombre="flecha-der" tamano={18} />}
      >
        {esUltimo ? "Enviar solicitud" : "Siguiente"}
      </Boton>
    </>
  );
}
