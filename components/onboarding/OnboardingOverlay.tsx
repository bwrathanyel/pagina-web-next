"use client";

import { useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { Boton } from "@/components/ui/Boton";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { useOnboarding } from "@/lib/onboarding/useOnboarding";

interface Slide {
  icono?: NombreIcono;
  titulo: string;
  texto: string;
}

const SLIDES: Slide[] = [
  { titulo: "Destino y Eventos Lotus 360", texto: "Su agencia de viajes en Venezuela: hospedaje, vuelos, tours y paquetes con asesoría real." },
  { icono: "usuario", titulo: "Un asesor real lo acompaña", texto: "Cada solicitud la atiende una persona de verdad, no solo un bot." },
  { icono: "corazon", titulo: "Guarde sus favoritos", texto: "Marque los hoteles y planes que le gusten y encuéntrelos después en un solo lugar." },
  { icono: "cotizar", titulo: "Cotice en pocos pasos", texto: "Cuéntenos qué busca y reciba una propuesta real por WhatsApp." },
];

export function OnboardingOverlay() {
  const { mostrar, cerrar } = useOnboarding();
  const [paso, setPaso] = useState(0);

  if (!mostrar) return null;

  const esUltimo = paso === SLIDES.length - 1;
  const slide = SLIDES[paso];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-sand">
      <div className="flex justify-end px-5 pt-5">
        <button type="button" onClick={cerrar} className="min-h-11 px-3 text-sm font-semibold text-ink-soft">
          Saltar
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
        {slide.icono ? (
          <span
            className="mb-6 flex h-20 w-20 items-center justify-center rounded-card bg-acento-suave text-acento"
            aria-hidden="true"
          >
            <Icono nombre={slide.icono} tamano={36} />
          </span>
        ) : (
          <div className="mb-6 scale-150">
            <BrandMark size="md" priority />
          </div>
        )}
        <h1 className="max-w-xs text-balance font-display text-2xl font-bold text-ink">{slide.titulo}</h1>
        <p className="mt-3 max-w-xs text-balance leading-6 text-ink-soft">{slide.texto}</p>
      </div>

      <div className="flex flex-col items-center gap-6 px-8 pb-10">
        <div className="flex items-center gap-2" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <span key={i} className={"h-2 rounded-pill transition-all " + (i === paso ? "w-6 bg-acento" : "w-2 bg-ink/15")} />
          ))}
        </div>
        <Boton ancho className="max-w-xs" onClick={() => (esUltimo ? cerrar() : setPaso((p) => p + 1))}>
          {esUltimo ? "Comenzar" : "Siguiente"}
        </Boton>
      </div>
    </div>
  );
}
