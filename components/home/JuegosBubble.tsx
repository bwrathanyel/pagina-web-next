"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CERRADO_KEY = "lotus360_juegos_bubble_cerrado";

function JuegosIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="4" />
      <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
    </svg>
  );
}

/** Globo flotante de la home para el stand de Lotus 360 en el evento: lleva a
 * /juega (registro + código para jugar). Va a la izquierda porque ContactoFab
 * ocupa la derecha; se apila sobre el toggle de edición del admin
 * (AdminEditToggle, bottom-24 / lg:bottom-5) sin taparlo. */
export function JuegosBubble() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(CERRADO_KEY) === "1") return;
    } catch {
      // sessionStorage bloqueado -- se muestra igual, no es crítico
    }
    const aparece = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(aparece);
  }, []);

  function cerrar() {
    setVisible(false);
    try {
      sessionStorage.setItem(CERRADO_KEY, "1");
    } catch {
      // sessionStorage bloqueado -- solo puede reaparecer al recargar
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-40 left-4 z-40 animate-bounce-in motion-reduce:animate-none sm:left-5 lg:bottom-20"
      style={{
        marginBottom: "env(safe-area-inset-bottom)",
        marginLeft: "env(safe-area-inset-left)",
      }}
    >
      <span
        className="animate-fab-halo pointer-events-none absolute inset-0 rounded-full ring-2 ring-gold motion-reduce:animate-none"
        aria-hidden="true"
      />
      <Link
        href="/juega"
        className="relative flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-gold pl-2 pr-12 text-sm font-semibold text-dusk shadow-lift"
      >
        <span
          className="animate-fab-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-reduce:animate-none"
          aria-hidden="true"
        />
        <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-dusk text-gold">
          <JuegosIcon />
        </span>
        <span className="relative flex flex-col leading-tight">
          <span>Juegos en el stand</span>
          <span className="font-mono text-[0.65rem] font-bold uppercase tracking-[0.14em] opacity-70">
            Toca y juega
          </span>
        </span>
      </Link>
      <button
        type="button"
        onClick={cerrar}
        aria-label="Cerrar aviso de juegos"
        className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-dusk"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-dusk/15 text-[0.6rem]" aria-hidden="true">
          ✕
        </span>
      </button>
    </div>
  );
}
