/** Analítica propia y liviana del embudo. Cero proveedor externo, cero
 * cookies: los eventos van a `web_eventos` en Supabase vía /api/evento.
 * Fire-and-forget con sendBeacon (sobrevive al unload de la página) y
 * fetch keepalive de respaldo. Nunca tira ni bloquea nada. */

export type TipoEvento =
  | "pageview"
  | "ver_producto"
  | "abrir_cotizador"
  | "cotizacion_generada"
  | "click_whatsapp"
  | "abrir_pago"
  | "pago_declarado";

export interface DatosEvento {
  ruta?: string;
  producto_slug?: string;
  destino?: string;
  meta?: Record<string, unknown>;
}

const SESSION_KEY = "lotus_sid";

function sessionId(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 64);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return undefined;
  }
}

export function registrarEvento(tipo: TipoEvento, datos: DatosEvento = {}): void {
  if (typeof window === "undefined") return;
  try {
    const cuerpo = JSON.stringify({
      tipo,
      ruta: datos.ruta ?? window.location.pathname,
      producto_slug: datos.producto_slug,
      destino: datos.destino,
      session_id: sessionId(),
      meta: datos.meta,
    });
    const blob = new Blob([cuerpo], { type: "application/json" });
    if (navigator.sendBeacon?.("/api/evento", blob)) return;
    void fetch("/api/evento", { method: "POST", body: cuerpo, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  } catch {
    // la analítica nunca rompe la página
  }
}
