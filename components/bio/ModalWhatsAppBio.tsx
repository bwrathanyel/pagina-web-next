"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { whatsappHref } from "@/lib/whatsapp";
import { DESTINOS_VENEZUELA } from "@/components/cotizador/wizardConfig";

type Red = "instagram" | "facebook" | "tiktok";

const RUTAS_WHATSAPP: Record<Red, string> = {
  instagram: "/ig/whatsapp",
  facebook: "/fb/whatsapp",
  tiktok: "/tiktok/whatsapp",
};

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-card py-3 pl-11 pr-4 text-base text-ink placeholder:text-ink-soft/60 transition-colors focus:border-whatsapp focus:outline-none focus:ring-2 focus:ring-whatsapp/25";

const EXTRANJERO = "Extranjero";

/** Botón de WhatsApp de la página puente (/tiktok, /ig, /fb). A diferencia
 * del link directo de antes, pide nombre+destino en un modal ANTES de
 * abrir WhatsApp -- mismo patrón que WhatsAppLeadButton.tsx (truco de
 * window.open síncrono, fallback al WhatsApp corporativo si el CRM falla),
 * pero el mensaje prellenado lo arma el servidor (prefillContactoDirecto),
 * no el cliente: ya sabe el canal real y el asesor asignado. */
export function ModalWhatsAppBio({ canal, className }: { canal: Red; className?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [destinoOtro, setDestinoOtro] = useState("");
  // Sin JS este componente queda tal cual salió del server: el botón
  // arranca oculto y el <noscript> de PaginaEnlaces es el que se ve. Con JS,
  // el efecto corre apenas hidrata y lo muestra -- así nunca hay dos botones
  // de WhatsApp pisados (uno inerte, uno funcional) en la misma pantalla.
  const [listo, setListo] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setListo(true);
  }, []);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const destinoFinal = destino === EXTRANJERO ? destinoOtro.trim() : destino;
    if (!nombre.trim() || !destino || (destino === EXTRANJERO && !destinoFinal)) {
      setError("Completa tu nombre y destino para continuar.");
      return;
    }
    setEnviando(true);
    setError(null);
    // Sincrónico, dentro del gesto del click: Safari/iOS bloquea un
    // window.open que llegue después de un await.
    const ventana = window.open("about:blank", "_blank");
    const mensajeFallback = `Hola, soy ${nombre.trim()}, me interesa ${destinoFinal}.`;
    try {
      const resp = await fetch(RUTAS_WHATSAPP[canal], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim(), destino: destinoFinal }),
      });
      const data = await resp.json().catch(() => null);
      const href = typeof data?.whatsapp_url === "string" ? data.whatsapp_url : whatsappHref(mensajeFallback);
      if (ventana) ventana.location.href = href;
      else window.open(href, "_blank", "noopener");
      setAbierto(false);
      setNombre("");
      setDestino("");
      setDestinoOtro("");
    } catch {
      // Nunca dejar al visitante sin salida: si el CRM falla, igual lo
      // mandamos al WhatsApp corporativo fijo en vez de trabarlo acá.
      const href = whatsappHref(mensajeFallback);
      if (ventana) ventana.location.href = href;
      else window.open(href, "_blank", "noopener");
      setAbierto(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className={className + (listo ? "" : " hidden")}
      >
        <WhatsAppIcon size={20} />
        Escríbenos por WhatsApp
      </button>
      {abierto ? (
        <Modal
          titulo="Escríbenos por WhatsApp"
          onClose={() => setAbierto(false)}
          icono={<WhatsAppIcon size={22} />}
          acentoClassName="from-whatsapp to-[#0a5c30]"
        >
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <div>
              <label htmlFor="bio-wa-nombre" className="mb-1.5 block text-sm font-semibold text-ink">
                Nombre<span className="ml-1 text-coral">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70">
                  <PersonaIcon />
                </span>
                <input
                  id="bio-wa-nombre"
                  type="text"
                  className={inputClass}
                  placeholder="¿Cómo te llamas?"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="bio-wa-destino" className="mb-1.5 block text-sm font-semibold text-ink">
                Destino que te interesa<span className="ml-1 text-coral">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70">
                  <PinIcon />
                </span>
                <select
                  id="bio-wa-destino"
                  className={inputClass + " appearance-none"}
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  required
                >
                  <option value="">Selecciona un destino</option>
                  {DESTINOS_VENEZUELA.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.emoji ? `${o.emoji} ` : ""}
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {destino === EXTRANJERO ? (
              <div>
                <label htmlFor="bio-wa-destino-otro" className="mb-1.5 block text-sm font-semibold text-ink">
                  ¿A qué país?<span className="ml-1 text-coral">*</span>
                </label>
                <input
                  id="bio-wa-destino-otro"
                  type="text"
                  className={inputClass.replace("pl-11", "pl-4")}
                  placeholder="Ej. Cancún, Miami, España..."
                  value={destinoOtro}
                  onChange={(e) => setDestinoOtro(e.target.value)}
                  required
                />
              </div>
            ) : null}
            {error ? (
              <p className="rounded-lg border border-coral/25 bg-coral/10 px-3 py-2 text-sm text-coral">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-whatsapp px-6 font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
            >
              {enviando ? (
                "Conectando..."
              ) : (
                <>
                  <WhatsAppIcon size={18} />
                  Continuar a WhatsApp
                </>
              )}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function PersonaIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}
