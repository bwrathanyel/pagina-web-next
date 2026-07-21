"use client";

import { DESTINOS_VENEZUELA } from "@/components/cotizador/wizardConfig";

const EMOJI_POR_DESTINO: Record<string, string> = Object.fromEntries(
  DESTINOS_VENEZUELA.filter((d) => d.value !== "Extranjero").map((d) => [d.value, d.emoji ?? "📍"]),
);

export function DestinoChips({
  destinos,
  activo,
  onChange,
}: {
  destinos: string[];
  activo: string | null;
  onChange: (destino: string | null) => void;
}) {
  if (destinos.length === 0) return null;

  return (
    <div className="-mx-5 mb-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
          activo === null ? "border-coral bg-coral text-white" : "border-ink/15 text-ink-soft hover:border-ink/30"
        }`}
      >
        Todos
      </button>
      {destinos.map((destino) => (
        <button
          key={destino}
          type="button"
          onClick={() => onChange(destino)}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
            activo === destino ? "border-coral bg-coral text-white" : "border-ink/15 text-ink-soft hover:border-ink/30"
          }`}
        >
          {EMOJI_POR_DESTINO[destino] ?? "📍"} {destino}
        </button>
      ))}
    </div>
  );
}
