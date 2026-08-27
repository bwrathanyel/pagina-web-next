"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { whatsappHref } from "@/lib/whatsapp";

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-card py-3 pl-11 pr-4 text-base text-ink placeholder:text-ink-soft/60 transition-colors focus:border-whatsapp focus:outline-none focus:ring-2 focus:ring-whatsapp/25";

/** Reemplaza los enlaces directos de WhatsApp del sitio (que mandaban
 * siempre al mismo número fijo, sin pasar por el CRM ni por el sistema de
 * ponderación de asesores). Pide nombre+teléfono+destino, crea el lead real
 * (mismo camino que ya usa el cotizador) y recién ahí abre WhatsApp -- pero
 * del asesor que el sistema realmente asignó, no de un número fijo.
 *
 * Si la creación del lead falla o el asesor asignado no tiene WhatsApp
 * cargado, cae al número corporativo fijo (whatsappHref) para no dejar al
 * visitante sin ninguna salida -- mismo criterio de "nunca bloquear el
 * handoff" que ya usa enviarACRM() en el cotizador. */
export function WhatsAppLeadButton({
  mensajeBase,
  triggerClassName,
  triggerAriaLabel,
  triggerTitle,
  children,
}: {
  mensajeBase: string;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  triggerTitle?: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState("");
  const [adultos, setAdultos] = useState("");
  const [ninos, setNinos] = useState("");
  const [infantes, setInfantes] = useState("");

  function textoPersonas() {
    const partes = [
      adultos ? `${adultos} adulto${adultos === "1" ? "" : "s"}` : "",
      ninos ? `${ninos} niño${ninos === "1" ? "" : "s"}` : "",
      infantes ? `${infantes} infante${infantes === "1" ? "" : "s"}` : "",
    ].filter(Boolean);
    return partes.join(", ");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !destino.trim()) {
      setError("Completa nombre y destino para continuar.");
      return;
    }
    setEnviando(true);
    setError(null);
    const mensajeWhatsapp = `${mensajeBase} Me interesa ${destino}.`;
    // Sincrónico, dentro del gesto del click: Safari/iOS bloquea un
    // window.open que llegue después de un await.
    const ventana = window.open("", "_blank", "noopener,noreferrer");
    try {
      const resultado = await crearLeadCRM({
        nombre: nombre.trim(),
        destino: destino.trim(),
        personas: textoPersonas(),
        consulta: mensajeWhatsapp,
      });
      const numero = resultado.asesor_whatsapp?.replace(/[^\d+]/g, "");
      const href = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(mensajeWhatsapp)}`
        : whatsappHref(mensajeWhatsapp);
      if (ventana) ventana.location.href = href;
      else window.open(href, "_blank", "noopener,noreferrer");
      setAbierto(false);
      setNombre("");
      setDestino("");
      setAdultos("");
      setNinos("");
      setInfantes("");
    } catch {
      // Nunca dejar al visitante sin salida: si el CRM falla, igual lo
      // mandamos al WhatsApp corporativo fijo en vez de trabarlo acá.
      const href = whatsappHref(mensajeWhatsapp);
      if (ventana) ventana.location.href = href;
      else window.open(href, "_blank", "noopener,noreferrer");
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
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        className={triggerClassName}
      >
        {children}
      </button>
      {abierto ? (
        <Modal
          titulo="Escríbenos por WhatsApp"
          onClose={() => setAbierto(false)}
          icono={<WhatsAppIcon size={22} />}
          acentoClassName="from-whatsapp to-[#0a5c30]"
        >
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <p className="flex items-start gap-2 text-sm text-ink-soft">
              <ClockIcon />
              <span>
                Cuéntanos un poco y te conectamos directo con tu asesor —
                respuesta en minutos en horario de atención.
              </span>
            </p>
            <div>
              <label htmlFor="wa-lead-nombre" className="mb-1.5 block text-sm font-semibold text-ink">
                Nombre<span className="ml-1 text-coral">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70">
                  <PersonaIcon />
                </span>
                <input
                  id="wa-lead-nombre"
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
              <label htmlFor="wa-lead-destino" className="mb-1.5 block text-sm font-semibold text-ink">
                Destino que te interesa<span className="ml-1 text-coral">*</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft/70">
                  <PinIcon />
                </span>
                <input
                  id="wa-lead-destino"
                  type="text"
                  className={inputClass}
                  placeholder="Ej. Los Roques, Mérida, Margarita..."
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="wa-lead-adultos" className="mb-1.5 block text-sm font-semibold text-ink">
                  Adultos
                </label>
                <input
                  id="wa-lead-adultos"
                  type="number"
                  min={0}
                  className={inputClass.replace("pl-11", "pl-4")}
                  placeholder="0"
                  value={adultos}
                  onChange={(e) => setAdultos(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="wa-lead-ninos" className="mb-1.5 block text-sm font-semibold text-ink">
                  Niños
                </label>
                <input
                  id="wa-lead-ninos"
                  type="number"
                  min={0}
                  className={inputClass.replace("pl-11", "pl-4")}
                  placeholder="0"
                  value={ninos}
                  onChange={(e) => setNinos(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="wa-lead-infantes" className="mb-1.5 block text-sm font-semibold text-ink">
                  Infantes
                </label>
                <input
                  id="wa-lead-infantes"
                  type="number"
                  min={0}
                  className={inputClass.replace("pl-11", "pl-4")}
                  placeholder="0"
                  value={infantes}
                  onChange={(e) => setInfantes(e.target.value)}
                />
              </div>
            </div>
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

function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
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
