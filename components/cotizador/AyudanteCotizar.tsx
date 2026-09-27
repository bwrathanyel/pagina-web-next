"use client";

import { useState } from "react";
import { AsistenteVirtualPanel } from "@/components/layout/AsistenteVirtualPanel";
import Solcito, { type SolcitoMood } from "@/components/mascota/Solcito";
import { textoFechas } from "@/components/cotizador/ResumenViaje";
import { textoViajeros, type EstadoViaje } from "@/lib/cotizador/estado";

/** Solcito dentro de /cotizar: en vez de flotar, acompaña la cotización con
 * una pista según lo que falta y abre el chat con la IA sabiendo qué se está
 * armando. En escritorio el chat se abre dentro de la columna; en móvil, en
 * una hoja desde abajo. */
export function AyudanteCotizar({
  estado,
  hotel,
  estimado,
  hayRegalo,
  variante,
}: {
  estado: EstadoViaje;
  hotel: string | null;
  estimado: string | null;
  /** Hay hoteles con niño gratis en el destino. */
  hayRegalo: boolean;
  variante: "movil" | "escritorio";
}) {
  const [abierto, setAbierto] = useState(false);

  const [mood, pista]: [SolcitoMood, string] =
    estado.ninos > 0 && hayRegalo && !hotel
      ? ["love", "¡Viaja con niños! Le marqué los hoteles donde el primer niño va gratis."]
      : !estado.desde || !estado.hasta
        ? ["look", "Elija sus fechas y le calculo el precio al momento."]
        : hotel && estimado
          ? ["happy", `¡Buena elección! Ya casi: deje su nombre y WhatsApp para enviarla.`]
          : hotel
            ? ["wink", `¿Quiere saber qué incluye ${hotel}? Pregúnteme.`]
            : ["idle", "¿Dudas con algún hotel? Pregúnteme por texto, foto o audio."];

  const contexto = [
    `destino: ${estado.destino}`,
    `fechas: ${textoFechas(estado)}`,
    `viajeros: ${textoViajeros(estado)}${estado.ninos ? ` (edades niños: ${estado.edades.slice(0, estado.ninos).join(", ")})` : ""}`,
    `servicios: ${estado.servicios.join(", ")}`,
    hotel ? `hotel elegido: ${hotel}` : "sin hotel elegido",
    estimado ? `estimado en pantalla: ${estimado}` : "",
  ]
    .filter(Boolean)
    .join("; ");

  const sugerencias = [
    hotel ? `¿Qué incluye ${hotel}?` : `¿Qué hotel me recomienda en ${estado.destino}?`,
    estado.ninos > 0 ? "¿Cuánto pagan los niños?" : "¿Cuál es la opción más económica?",
    "¿Cómo se paga?",
  ];

  const tarjeta = (
    <div className="flex items-center gap-3 rounded-card border border-linea bg-card p-3">
      <Solcito mood={abierto ? "happy" : mood} size={variante === "movil" ? 48 : 56} gestos={!abierto} />
      <p className="min-w-0 flex-1 text-sm leading-snug text-ink" aria-live="polite">
        {pista}
      </p>
      <button
          type="button"
          aria-expanded={abierto}
          onClick={() => setAbierto((v) => variante === "movil" || !v)}
          className="min-h-11 shrink-0 rounded-pill bg-dusk px-4 text-sm font-semibold text-dusk-text transition-[filter] duration-150 hover:brightness-125"
        >
          {abierto && variante === "escritorio" ? "Ocultar" : "Preguntar"}
        </button>
    </div>
  );

  if (variante === "movil") {
    return (
      <>
        {tarjeta}
        {abierto ? (
          <AsistenteVirtualPanel onClose={() => setAbierto(false)} contexto={contexto} sugerencias={sugerencias} />
        ) : null}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {tarjeta}
      {abierto ? (
        <div className="h-[460px]">
          <AsistenteVirtualPanel
            modo="embebido"
            onClose={() => setAbierto(false)}
            contexto={contexto}
            sugerencias={sugerencias}
          />
        </div>
      ) : null}
    </div>
  );
}
