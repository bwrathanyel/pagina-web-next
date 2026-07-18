"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { whatsappHref } from "@/lib/whatsapp";

const inputClass =
  "w-full rounded-xl border border-ink/15 bg-card px-4 py-3 text-base text-ink placeholder:text-ink-soft/60";

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
  const [telefono, setTelefono] = useState("");
  const [destino, setDestino] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim() || !telefono.trim() || !destino.trim()) {
      setError("Completa los 3 campos para continuar.");
      return;
    }
    setEnviando(true);
    setError(null);
    const mensajeWhatsapp = `${mensajeBase} Me interesa ${destino}.`;
    try {
      const resultado = await crearLeadCRM({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        destino: destino.trim(),
        personas: "",
        consulta: mensajeWhatsapp,
      });
      const numero = resultado.asesor_whatsapp?.replace(/[^\d+]/g, "");
      const href = numero
        ? `https://wa.me/${numero}?text=${encodeURIComponent(mensajeWhatsapp)}`
        : whatsappHref(mensajeWhatsapp);
      window.open(href, "_blank", "noopener,noreferrer");
      setAbierto(false);
      setNombre("");
      setTelefono("");
      setDestino("");
    } catch {
      // Nunca dejar al visitante sin salida: si el CRM falla, igual lo
      // mandamos al WhatsApp corporativo fijo en vez de trabarlo acá.
      window.open(whatsappHref(mensajeWhatsapp), "_blank", "noopener,noreferrer");
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
        <Modal titulo="Escríbenos por WhatsApp" onClose={() => setAbierto(false)}>
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <p className="text-sm text-ink-soft">
              Cuéntanos un poco y te conectamos directo con tu asesor.
            </p>
            <div>
              <label htmlFor="wa-lead-nombre" className="mb-1.5 block text-sm font-semibold text-ink">
                Nombre<span className="ml-1 text-coral">*</span>
              </label>
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
            <div>
              <label htmlFor="wa-lead-telefono" className="mb-1.5 block text-sm font-semibold text-ink">
                Teléfono<span className="ml-1 text-coral">*</span>
              </label>
              <input
                id="wa-lead-telefono"
                type="tel"
                className={inputClass}
                placeholder="Ej. 0412-1234567"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="wa-lead-destino" className="mb-1.5 block text-sm font-semibold text-ink">
                Destino que te interesa<span className="ml-1 text-coral">*</span>
              </label>
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
            {error ? <p className="text-sm text-coral">{error}</p> : null}
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-whatsapp px-6 font-semibold text-white disabled:opacity-60"
            >
              {enviando ? "Conectando..." : "Continuar a WhatsApp"}
            </button>
          </form>
        </Modal>
      ) : null}
    </>
  );
}
