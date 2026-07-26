"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const suscribirHidratacion = () => () => {};

/** Slider claro/oscuro para el header (pedido del dueño, 2026-07-26).
 * Distinto de ThemeToggle (botón redondo de un solo icono, usado en
 * /cuenta/configuracion): acá el estado se lee de un vistazo por la posición
 * de la perilla, sin tener que interpretar qué significa el icono.
 *
 * Igual que ThemeToggle, espera al montaje antes de pintar el estado real:
 * next-themes fija data-theme con un script bloqueante antes de hidratar (no
 * hay FOUC de la página), pero este componente sí necesita esperar para no
 * generar un mismatch de servidor/cliente en su propia perilla. */
export function ThemeSwitch({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(suscribirHidratacion, () => true, () => false);

  const esOscuro = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={esOscuro}
      aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      onClick={() => setTheme(esOscuro ? "light" : "dark")}
      className={
        "relative inline-flex h-7 w-[3.25rem] flex-shrink-0 items-center rounded-full border border-ink/15 transition-colors duration-300 " +
        (esOscuro ? "bg-dusk-2" : "bg-sand-2") +
        " " +
        className
      }
    >
      {/* Iconos de fondo: marcan a dónde va la perilla, se atenúa el lado activo
          para que el contraste lo gane siempre la perilla. */}
      <span
        aria-hidden="true"
        className={"pointer-events-none absolute left-[0.4rem] transition-opacity duration-300 " + (esOscuro ? "opacity-40" : "opacity-0")}
      >
        <SunIcon />
      </span>
      <span
        aria-hidden="true"
        className={"pointer-events-none absolute right-[0.4rem] transition-opacity duration-300 " + (esOscuro ? "opacity-0" : "opacity-45")}
      >
        <MoonIcon />
      </span>

      <span
        aria-hidden="true"
        className={
          "pointer-events-none flex h-[1.375rem] w-[1.375rem] items-center justify-center rounded-full shadow-sm transition-transform duration-300 ease-out motion-reduce:transition-none " +
          (esOscuro ? "translate-x-[1.75rem] bg-gold text-dusk" : "translate-x-[0.19rem] bg-card text-coral")
        }
      >
        {mounted ? (esOscuro ? <MoonIcon /> : <SunIcon />) : null}
      </span>
    </button>
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
