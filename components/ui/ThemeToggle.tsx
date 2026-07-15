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

/** Light/dark toggle. Reads resolvedTheme (post-hydration) so it never
 * shows the wrong icon on first paint — next-themes injects a blocking
 * script that sets data-theme before React hydrates, so there's no FOUC,
 * but *this component's own* icon still needs to wait for mount to avoid
 * a client/server text mismatch. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(suscribirHidratacion, () => true, () => false);

  const esOscuro = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(esOscuro ? "light" : "dark")}
      aria-label={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className={
        "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-ink/15 bg-card text-ink transition-colors " +
        className
      }
    >
      {mounted ? esOscuro ? <SunIcon /> : <MoonIcon /> : <span className="h-[18px] w-[18px]" />}
    </button>
  );
}
