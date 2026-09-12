"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";

/** El navegador in-app de TikTok bloquea toda navegación dura de documento:
 * carga el link de la bio y se niega a pedir cualquier otro documento. Da
 * igual si es <a href>, un 302, una página puente o el esquema whatsapp://
 * (los cuatro medidos el 12-sep con una escalera de enlaces). Lo único que
 * pasa es fetch y la navegación de cliente de Next.
 *
 * Por eso el botón deja de ser un <a>: pide la URL de WhatsApp por fetch (eso
 * ya rota asesor y crea el lead, aunque la persona nunca llegue a escribir) y
 * después intenta abrirla. Si el intento no despega -- que es lo que pasa
 * dentro de TikTok -- muestra el número en pantalla para copiar, sin
 * navegar a ningún lado.
 */

const UA_WEBVIEW_TIKTOK = /BytedanceWebview|musical_ly|Trill|TikTok/i;

type Respaldo = { telefono: string; texto: string; url: string; enTikTok: boolean };

function partirWhatsapp(url: string): Respaldo | null {
  try {
    const u = new URL(url);
    const telefono = u.pathname.replace(/\D/g, "");
    if (!telefono) return null;
    return { telefono, texto: u.searchParams.get("text") ?? "", url, enTikTok: false };
  } catch {
    return null;
  }
}

export function BotonWhatsAppBio({ ruta, className }: { ruta: string; className: string }) {
  const [cargando, setCargando] = useState(false);
  const [respaldo, setRespaldo] = useState<Respaldo | null>(null);
  const [copiado, setCopiado] = useState<"tel" | "texto" | null>(null);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // El panel va por portal a <body>: vive dentro de <Revelar>, que anima con
  // transform, y un ancestro transformado rompe position:fixed -- el overlay
  // se posicionaba dentro de la tarjeta y quedaba encimado con los enlaces.
  const [montado, setMontado] = useState(false);

  useEffect(() => setMontado(true), []);

  useEffect(() => () => {
    if (temporizador.current) clearTimeout(temporizador.current);
  }, []);

  const copiar = useCallback(async (valor: string, cual: "tel" | "texto") => {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(cual);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      // Portapapeles bloqueado (pasa en varios webviews): el valor igual está
      // en un input de solo lectura, se puede seleccionar a mano.
    }
  }, []);

  const abrir = useCallback(async () => {
    if (cargando) return;
    setCargando(true);
    let datos: Respaldo | null = null;
    try {
      const r = await fetch(`${ruta}?json=1`, { cache: "no-store" });
      const j = (await r.json()) as { ok?: boolean; whatsapp_url?: string };
      if (j?.ok && typeof j.whatsapp_url === "string") datos = partirWhatsapp(j.whatsapp_url);
    } catch {
      datos = null;
    }
    setCargando(false);

    // Sin respuesta utilizable no hay número que mostrar: se cae a la ruta de
    // servidor, que responde su propia página con el WhatsApp corporativo.
    if (!datos) {
      window.location.href = ruta;
      return;
    }

    // window.open con _blank es un camino distinto de location.href y de un
    // <a href>: muchos webviews no lo resuelven adentro, se lo entregan al
    // sistema (navegador externo o directamente la app). La escalera del
    // 12-sep midió link, 302, página puente y whatsapp://, pero nunca esto.
    // Si el webview lo ignora o lo bloquea, cae al panel del número.
    const enTikTok = UA_WEBVIEW_TIKTOK.test(navigator.userAgent);
    if (enTikTok) {
      let abierta: Window | null = null;
      try {
        abierta = window.open(datos.url, "_blank", "noopener");
      } catch {
        abierta = null;
      }
      if (!abierta) {
        setRespaldo({ ...datos, enTikTok: true });
        return;
      }
      temporizador.current = setTimeout(() => {
        if (document.visibilityState === "visible") setRespaldo({ ...datos, enTikTok: true });
      }, 2000);
      return;
    }

    window.location.href = datos.url;
    // Respaldo universal: si a los 1,5 s seguimos acá y la pestaña está
    // visible, el salto lo comió el navegador in-app de turno (TikTok no es
    // el único que lo hace). Se muestra el número igual.
    temporizador.current = setTimeout(() => {
      if (document.visibilityState === "visible") setRespaldo(datos);
    }, 1500);
  }, [cargando, ruta]);

  return (
    <>
      <button type="button" onClick={abrir} disabled={cargando} className={className}>
        <WhatsAppIcon size={20} />
        {cargando ? "Conectando…" : "Escríbenos por WhatsApp"}
      </button>

      {respaldo && montado
        ? createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Datos de tu asesor"
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
          onClick={() => setRespaldo(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-dusk p-6 text-dusk-text shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-gold">Tu asesor te espera</h2>
            <p className="mt-2 text-sm leading-relaxed text-dusk-text/80">
              TikTok no permite abrir WhatsApp desde aquí. Copia el número y escríbenos, o abre
              esta página en tu navegador desde el menú <strong>⋯</strong> de arriba.
            </p>

            <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-dusk-text/60">
              Número de tu asesor
            </label>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                value={`+${respaldo.telefono}`}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-base font-semibold"
              />
              <button
                type="button"
                onClick={() => copiar(`+${respaldo.telefono}`, "tel")}
                className="shrink-0 rounded-xl bg-whatsapp px-4 py-2 text-sm font-bold text-white"
              >
                {copiado === "tel" ? "¡Listo!" : "Copiar"}
              </button>
            </div>

            {respaldo.texto ? (
              <button
                type="button"
                onClick={() => copiar(respaldo.texto, "texto")}
                className="mt-3 w-full rounded-xl border border-white/10 px-3 py-2 text-sm text-dusk-text/80"
              >
                {copiado === "texto" ? "Mensaje copiado" : "Copiar el mensaje sugerido"}
              </button>
            ) : null}

            {/* Adentro de TikTok este link no puede funcionar: es navegación
                dura, que es exactamente lo que el webview bloquea. Mostrarlo
                ahí solo invita a un clic que devuelve el "abre este enlace en
                el navegador". Fuera de TikTok sí sirve como reintento. */}
            {respaldo.enTikTok ? null : (
              <a
                href={respaldo.url}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-whatsapp font-semibold text-white"
              >
                <WhatsAppIcon size={18} />
                Intentar abrir WhatsApp
              </a>
            )}

            <button
              type="button"
              onClick={() => setRespaldo(null)}
              className="mt-3 w-full py-2 text-sm text-dusk-text/60"
            >
              Cerrar
            </button>
          </div>
        </div>
            ,
            document.body,
          )
        : null}
    </>
  );
}
