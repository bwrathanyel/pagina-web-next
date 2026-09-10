"use client";

import { useEffect, useRef, useState } from "react";

// Primer consumidor de Turnstile en el sitio. Carga el script de Cloudflare
// una sola vez (renderizado explícito) y entrega el token al padre. El CSP
// del sitio ya permite challenges.cloudflare.com en script-src / frame-src /
// connect-src (ver next.config.ts).

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
    s.onerror = () => { scriptPromesa = null; reject(new Error("no se pudo cargar Turnstile")); };
    document.head.appendChild(s);
  });
  return scriptPromesa;
}

export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const contenedor = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState(false);

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

      widgetId = window.turnstile.render(contenedor.current, {
        sitekey: siteKey,
        callback: (t: string) => onToken(t),
        "expired-callback": () => onToken(null),
        "error-callback": () => { onToken(null); setError(true); },
      });
    })();

    return () => {
      cancelado = true;
      if (widgetId && window.turnstile) {
        try { window.turnstile.remove(widgetId); } catch { /* ya removido */ }
      }
    };
    // onToken se pasa estable desde el padre (useCallback); no re-montar el widget.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) {
    return (
      <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert">
        No se pudo cargar la verificación de seguridad. Recarga la página e inténtalo de nuevo.
      </p>
    );
  }
  return <div ref={contenedor} className="min-h-[65px]" />;
}
