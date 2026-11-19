"use client";

import { useState, ViewTransition } from "react";
import { FotoRotativa } from "@/components/cotizador/OfertasHospedaje";
import { Icono } from "@/components/ui/Icono";
import { nombreFoto } from "@/components/ui/movimiento";
import { VisorFotos } from "./Opciones";

const PASO_CABECERA_MS = 4000;

/** Fotos del hotel en la cabecera de /reservar (pedido del dueño, 2026-11-17): rotan solas y tocarlas
 * abre el visor con todas. En el teléfono llenan la franja detrás del nombre; desde lg son la miniatura.
 * La primera llega volando desde /cotizar o la ficha (mismo `nombreFoto`, grupo `.morph`). */
export function FotosCabecera({ hotelId, nombre, fotos }: { hotelId: number; nombre: string; fotos: string[] }) {
  const [visor, setVisor] = useState(false);
  const n = fotos.length;
  return (
    // lg+: a sangre del borde izquierdo y todo el alto de la cabecera (los -my/-ml anulan su p-2;
    // el overflow-hidden + rounded-card de la cabecera redondea las esquinas). Más foto sin subir el alto.
    <span className="absolute inset-0 lg:relative lg:inset-auto lg:-my-2 lg:-ml-2 lg:block lg:w-44 lg:shrink-0 lg:self-stretch lg:overflow-hidden lg:bg-sand-2 xl:w-52">
      {n ? (
        <>
          <ViewTransition name={nombreFoto(hotelId)} share="morph" default="none">
            <FotoRotativa fotos={fotos} sizes="(min-width: 1280px) 13rem, (min-width: 1024px) 11rem, 100vw" apagada={false} encima={!visor} prioridad pasoMs={PASO_CABECERA_MS} />
          </ViewTransition>
          <button
            type="button"
            onClick={() => setVisor(true)}
            aria-label={n > 1 ? `Ver las ${n} fotos de ${nombre}` : `Ver la foto de ${nombre}`}
            className="group/fotos absolute inset-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-acento/40"
          >
            {n > 1 ? (
              <span className="absolute right-2 top-2 inline-flex items-center gap-0.5 rounded-control bg-dusk/80 px-1.5 py-0.5 font-mono text-xs font-bold text-dusk-text transition-colors group-hover/fotos:bg-dusk lg:bottom-1 lg:right-1 lg:top-auto">
                <Icono nombre="suma" tamano={12} />
                {n}
              </span>
            ) : null}
          </button>
          <VisorFotos fotos={fotos} alt={nombre} abierta={visor} onCerrar={() => setVisor(false)} />
        </>
      ) : null}
    </span>
  );
}
