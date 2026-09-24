"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";

/** Slider USD/Bs (role="switch") para el header de escritorio y la hoja "Más"
 * del móvil -- nunca se muestran las dos monedas a la vez, es una u otra, para
 * no saturar al cliente (pedido explícito del dueño). */
export function CurrencySwitch({ className = "" }: { className?: string }) {
  const { moneda, alternarMoneda } = useCurrency();
  const esBs = moneda === "VES";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={esBs}
      aria-label={esBs ? "Cambiar a precios en dólares" : "Cambiar a precios en bolívares"}
      title={esBs ? "Cambiar a precios en dólares" : "Cambiar a precios en bolívares"}
      onClick={alternarMoneda}
      className={
        "relative inline-flex h-7 w-[3.25rem] flex-shrink-0 items-center rounded-full border border-ink/15 transition-colors duration-300 " +
        (esBs ? "bg-seafoam-bg" : "bg-sand-2") +
        " " +
        className
      }
    >
      <span
        aria-hidden="true"
        className={"pointer-events-none absolute left-[0.4rem] text-xs font-bold transition-opacity duration-300 " + (esBs ? "opacity-40" : "opacity-0")}
      >
        $
      </span>
      <span
        aria-hidden="true"
        className={"pointer-events-none absolute right-[0.3rem] text-xs font-bold transition-opacity duration-300 " + (esBs ? "opacity-0" : "opacity-45")}
      >
        Bs
      </span>

      <span
        aria-hidden="true"
        className={
          "pointer-events-none flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full text-xs font-bold shadow-sm transition-transform duration-300 ease-out " +
          (esBs ? "translate-x-[1.75rem] bg-seafoam text-white" : "translate-x-[0.19rem] bg-card text-coral")
        }
      >
        {esBs ? "Bs" : "$"}
      </span>
    </button>
  );
}
