"use client";

import { useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { useOnboarding } from "@/lib/onboarding/useOnboarding";

interface Slide {
  emoji?: string;
  titulo: string;
  texto: string;
}

const SLIDES: Slide[] = [
  { titulo: "Destino y Eventos Lotus 360", texto: "Tu agencia de viajes en Venezuela — hospedaje, vuelos, tours y paquetes con asesoría real." },
  { emoji: "🧑‍💼", titulo: "Un asesor real te acompaña", texto: "Cada solicitud la atiende una persona de verdad, no solo un bot." },
  { emoji: "❤️", titulo: "Guarda tus favoritos", texto: "Marca los hoteles y planes que te gusten y encuéntralos después en un solo lugar." },
  { emoji: "🧭", titulo: "Cotiza en 3 pasos", texto: "Cuéntanos qué buscas y recibe una propuesta real por WhatsApp." },
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
        {paso === 0 ? (
          <div className="mb-6 scale-150">
            <BrandMark size="md" priority />
          </div>
        ) : (
          <span className="mb-6 text-6xl" aria-hidden="true">{slide.emoji}</span>
        )}
        <h1 className="max-w-xs text-balance font-display text-2xl font-semibold text-ink">{slide.titulo}</h1>
        <p className="mt-3 max-w-xs text-balance leading-6 text-ink-soft">{slide.texto}</p>
      </div>

      <div className="flex flex-col items-center gap-6 px-8 pb-10">
        <div className="flex items-center gap-2" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <span key={i} className={"h-2 rounded-full transition-all " + (i === paso ? "w-6 bg-coral" : "w-2 bg-ink/15")} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => (esUltimo ? cerrar() : setPaso((p) => p + 1))}
          className="flex min-h-12 w-full max-w-xs items-center justify-center rounded-full bg-gradient-to-br from-coral to-gold px-6 font-semibold text-btn-ink"
        >
          {esUltimo ? "Comenzar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
