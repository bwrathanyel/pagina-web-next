"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Icono, type NombreIcono } from "@/components/ui/Icono";

// Único control de tema del sitio (antes había dos: ThemeSwitch en el header
// de escritorio y ThemeToggle cíclico en el móvil, que mostraba el icono del
// PRÓXIMO estado y confundía). Tres opciones a la vista, la elegida marcada.
// Lee `theme` (la elección) y no `resolvedTheme`: "Automático" resuelto a
// claro tiene que seguir viéndose como "Automático".

const OPCIONES: { valor: "light" | "dark" | "system"; texto: string; icono: NombreIcono }[] = [
  { valor: "light", texto: "Claro", icono: "sol" },
  { valor: "dark", texto: "Oscuro", icono: "luna" },
  { valor: "system", texto: "Automático", icono: "pantalla" },
];

const sinSuscripcion = () => () => {};

export function SelectorTema({ compacto = false, className = "" }: { compacto?: boolean; className?: string }) {
  const { theme, setTheme } = useTheme();
  // next-themes fija data-theme antes de hidratar (no hay parpadeo de la
  // página); solo la marca de la opción elegida espera al montaje.
  const montado = useSyncExternalStore(sinSuscripcion, () => true, () => false);
  const elegido = montado ? theme : undefined;

  return (
    <div
      role="group"
      aria-label="Tema de colores"
      className={"inline-flex rounded-pill bg-sand-2 p-1 " + (compacto ? "" : "w-full ") + className}
    >
      {OPCIONES.map(({ valor, texto, icono }) => {
        const activo = elegido === valor;
        return (
          <button
            key={valor}
            type="button"
            onClick={() => setTheme(valor)}
            aria-pressed={activo}
            aria-label={compacto ? texto : undefined}
            title={compacto ? texto : undefined}
            className={
              "flex items-center justify-center gap-2 rounded-pill text-sm font-semibold transition-colors duration-150 " +
              (compacto ? "h-8 w-8 " : "min-h-11 flex-1 px-3 ") +
              (activo ? "bg-card text-ink shadow-chrome" : "text-ink-soft hover:text-ink")
            }
          >
            <Icono nombre={icono} tamano={compacto ? 16 : 18} />
            {compacto ? null : texto}
          </button>
        );
      })}
    </div>
  );
}
