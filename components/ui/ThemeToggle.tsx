"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const suscribirHidratacion = () => () => {};

function SunIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="4" width="19" height="13" rx="1.8" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

const SIGUIENTE = { light: "dark", dark: "system", system: "light" } as const;
const NOMBRE = { light: "claro", dark: "oscuro", system: "automático" } as const;

/** Ciclo de 3 estados: claro -> oscuro -> automático -> claro. Muestra el
 * ícono de a dónde va el PRÓXIMO click (mismo lenguaje que el toggle de 2
 * estados que tenía antes), leyendo `theme` (la elección) y no
 * `resolvedTheme` -- si leyera resolvedTheme, "automático" resuelto a claro
 * sería indistinguible de haber elegido "claro" a mano.
 *
 * Espera al montaje antes de pintar el ícono real: next-themes fija
 * data-theme con un script bloqueante antes de hidratar (no hay FOUC de la
 * página), pero este componente sí necesita esperar para no generar un
 * mismatch de servidor/cliente en su propio ícono. */
export function ThemeToggle({ className = "", compacto = false }: { className?: string; compacto?: boolean }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(suscribirHidratacion, () => true, () => false);

  const actual = (mounted ? theme : "system") as keyof typeof SIGUIENTE;
  const proximo = SIGUIENTE[actual] ?? "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(proximo)}
      aria-label={`Cambiar a modo ${NOMBRE[proximo]} (modo actual: ${NOMBRE[actual]})`}
      className={
        (compacto ? "flex h-9 w-9 " : "flex h-11 w-11 ") +
        "flex-shrink-0 items-center justify-center rounded-full border border-ink/15 bg-card text-ink transition-colors " +
        className
      }
    >
      {mounted ? (
        proximo === "dark" ? <MoonIcon /> : proximo === "system" ? <MonitorIcon /> : <SunIcon />
      ) : (
        <span className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
