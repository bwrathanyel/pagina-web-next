"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";

// Primer consumidor de Turnstile en el sitio. Carga el script de Cloudflare
// una sola vez (renderizado explícito) y entrega el token al padre. El CSP
// del sitio ya permite challenges.cloudflare.com en script-src / frame-src /
// connect-src (ver next.config.ts).
//
// `interaction-only`: el widget no ocupa lugar salvo que Cloudflare pida que la
// persona toque la casilla. Si algo falla, «Reintentar» lo vuelve a montar sin
// recargar la página (recargar borraría el formulario).

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
}
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let scriptPromesa: Promise<void> | null = null;
function cargarScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("sin window"));
  if (window.turnstile) return Promise.resolve();
  if (scriptPromesa) return scriptPromesa;
  scriptPromesa = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { scriptPromesa = null; s.remove(); reject(new Error("no se pudo cargar Turnstile")); };
    document.head.appendChild(s);
  });
  return scriptPromesa;
}

export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState(false);
  // Cada «Reintentar» suma uno: el efecto se vuelve a correr y monta un widget nuevo.
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let widgetId: string | null = null;
    let cancelado = false;

    (async () => {
      let siteKey: string | undefined;
      try {
        const res = await fetch("/api/turnstile-config", { cache: "force-cache" });
        const data = (await res.json().catch(() => null)) as { ok?: boolean; site_key?: string } | null;
        siteKey = data?.ok ? data.site_key : undefined;
      } catch { /* cae al manejo de error de abajo */ }
      if (!siteKey) { if (!cancelado) setError(true); return; }

      try {
        await cargarScript();
      } catch {
        if (!cancelado) setError(true);
        return;
      }
      if (cancelado || !contenedor.current || !window.turnstile) return;

      // next-themes deja el tema en <html data-theme> antes de hidratar; el widget lo sigue.
      const tema = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      widgetId = window.turnstile.render(contenedor.current, {
        sitekey: siteKey,
        language: "es",
        theme: tema,
        appearance: "interaction-only",
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(null),
        "timeout-callback": () => { onToken(null); setError(true); },
        "error-callback": () => { onToken(null); setError(true); },
      });
    })();

    return () => {
      cancelado = true;
      if (widgetId && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch { /* ya removido */ }
      }
    };
    // onToken se pasa estable desde el padre (useCallback); no re-montar el widget por eso.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intento]);

  function reintentar() {
    setError(false);
    onToken(null);
    setIntento((n) => n + 1);
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col gap-3 rounded-control bg-peligro-suave px-4 py-3 sm:flex-row sm:items-center">
        <p className="flex flex-1 items-start gap-3 text-sm font-semibold text-peligro">
          <Icono nombre="alerta" tamano={18} className="mt-0.5 shrink-0" />
          <span>No se pudo completar la verificación de seguridad. Revise su conexión y toque Reintentar.</span>
        </p>
        <Boton type="button" variante="secundario" tamano="sm" onClick={reintentar}>
          Reintentar
        </Boton>
      </div>
    );
  }
  return <div ref={contenedor} />;
}
