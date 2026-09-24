"use client";

import { SelectorTema } from "@/components/ui/SelectorTema";
import { CurrencySwitch } from "@/components/ui/CurrencySwitch";
import { useCurrency } from "@/components/providers/CurrencyProvider";

/** Moneda y tema: lo que antes ocupaba lugar en la barra. Lo comparten la hoja
 * "Más" del móvil y el popover de preferencias del escritorio. */
export function PreferenciasControles() {
  const { moneda } = useCurrency();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-12 items-center justify-between gap-3">
        <span className="font-semibold text-ink">
          Precios en {moneda === "VES" ? "bolívares (Bs)" : "dólares (US$)"}
        </span>
        <CurrencySwitch />
      </div>
      <SelectorTema />
    </div>
  );
}
