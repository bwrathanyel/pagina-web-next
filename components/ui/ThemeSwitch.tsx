"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const suscribirHidratacion = () => () => {};

const OPCIONES = [
  { valor: "system", label: "Automático" },
  { valor: "light", label: "Claro" },
  { valor: "dark", label: "Oscuro" },
] as const;

/** Selector claro/oscuro/automático para el header (pedido del dueño,
 * 2026-07-26; pasó a 3 estados 2026-08-23 al habilitar enableSystem).
 * Distinto de ThemeToggle (botón redondo de un solo icono, usado en
 * /cuenta/configuracion): acá el estado se lee de un vistazo por la posición
 * de la perilla, sin tener que interpretar qué significa el icono.
 *
 * `theme` es la ELECCIÓN (puede ser "system"); `resolvedTheme` es el
 * RESULTADO ("light"/"dark" ya resuelto). La perilla se posiciona por
 * `theme` (para poder mostrar "automático" como estado propio) pero se pinta
 * con el icono de `resolvedTheme` (para que en automático muestre qué se está
 * viendo en este momento, no un tercer icono neutro).
 *
 * Espera al montaje antes de pintar el estado real: next-themes fija
 * data-theme con un script bloqueante antes de hidratar (no hay FOUC de la
 * página), pero este componente sí necesita esperar para no generar un
 * mismatch de servidor/cliente en su propia perilla. */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(suscribirHidratacion, () => true, () => false);

  const eleccion = mounted ? theme ?? "system" : "system";
  const esOscuro = mounted && resolvedTheme === "dark";
  const indice = OPCIONES.findIndex((o) => o.valor === eleccion);
  const posicion = indice < 0 ? 0 : indice;

  return (
    <div
      role="radiogroup"
      aria-label="Tema del sitio"
      className={
        "relative inline-flex h-7 w-[4.75rem] flex-shrink-0 items-center rounded-full border border-ink/15 bg-sand-2 " +
        className
      }
    >
      {/* Perilla: 3 posiciones por `theme`, icono por `resolvedTheme`. */}
      <span
        aria-hidden="true"
        className={
          "pointer-events-none absolute left-[0.19rem] flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-out " +
          (esOscuro ? "bg-dusk-2 text-gold" : "bg-card text-coral") +
          " " +
          (posicion === 0 ? "translate-x-0" : posicion === 1 ? "translate-x-[1.5rem]" : "translate-x-[3rem]")
        }
      >
        {mounted ? (posicion === 0 ? <MonitorIcon /> : esOscuro ? <MoonIcon /> : <SunIcon />) : null}
      </span>

      {OPCIONES.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          role="radio"
          aria-checked={eleccion === opcion.valor}
          aria-label={opcion.label}
          title={opcion.label}
          onClick={() => setTheme(opcion.valor)}
          className="relative z-10 flex h-7 w-[1.58rem] items-center justify-center"
        />
      ))}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 1.5v2.2M12 20.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M1.5 12h2.2M20.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="13" rx="1.8" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
