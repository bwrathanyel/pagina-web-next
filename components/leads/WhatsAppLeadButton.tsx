"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Campo, Entrada } from "@/components/ui/Campo";
import { Modal } from "@/components/ui/Modal";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { whatsappHref } from "@/lib/whatsapp";

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
  destinoInicial = "",
  triggerClassName,
  triggerAriaLabel,
  triggerTitle,
  children,
}: {
  mensajeBase: string;
  /** Destino ya conocido (ficha de un hotel): llega escrito al formulario. */
  destinoInicial?: string;
  triggerClassName?: string;
  triggerAriaLabel?: string;
  triggerTitle?: string;
  children: React.ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [destino, setDestino] = useState(destinoInicial);
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
      setError("Complete su nombre y el destino para continuar.");
      return;
    }
    setEnviando(true);
    setError(null);
    const mensajeWhatsapp = `${mensajeBase} Me interesa ${destino}.`;
    // Sincrónico, dentro del gesto del click: Safari/iOS bloquea un
    // window.open que llegue después de un await. Sin "noopener" acá: con
    // esa flag window.open devuelve null y perdemos el handle de la pestaña
    // (era la causa del about:blank colgado).
    const ventana = window.open("about:blank", "_blank");
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
      else window.open(href, "_blank", "noopener");
      setAbierto(false);
      setNombre("");
      setDestino(destinoInicial);
      setAdultos("");
      setNinos("");
      setInfantes("");
    } catch {
      // Nunca dejar al visitante sin salida: si el CRM falla, igual lo
      // mandamos al WhatsApp corporativo fijo en vez de trabarlo acá.
      const href = whatsappHref(mensajeWhatsapp);
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
        aria-label={triggerAriaLabel}
        title={triggerTitle}
        className={triggerClassName}
      >
        {children}
      </button>
      {abierto ? (
        <Modal
          titulo="Escríbanos por WhatsApp"
          onClose={() => setAbierto(false)}
          icono={<WhatsAppIcon size={22} />}
          acentoClassName="from-whatsapp to-whatsapp"
        >
          <form onSubmit={enviar} className="flex flex-col gap-5">
            <p className="text-ink-soft">
              Cuéntenos un poco y lo conectamos directo con su asesor. Respuesta en minutos en horario de atención.
            </p>
            <Campo etiqueta="Su nombre" requerido>
              {(a11y) => (
                <Entrada {...a11y} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
              )}
            </Campo>
            <Campo etiqueta="Destino que le interesa" requerido>
              {(a11y) => (
                <Entrada
                  {...a11y}
                  placeholder="Los Roques, Mérida, Margarita…"
                  value={destino}
                  onChange={(e) => setDestino(e.target.value)}
                />
              )}
            </Campo>
            <fieldset>
              <legend className="mb-1.5 text-sm font-semibold text-ink">¿Cuántos viajan?</legend>
              <div className="grid grid-cols-3 gap-3">
                <Cantidad etiqueta="Adultos" valor={adultos} onChange={setAdultos} />
                <Cantidad etiqueta="Niños" valor={ninos} onChange={setNinos} />
                <Cantidad etiqueta="Infantes" valor={infantes} onChange={setInfantes} />
              </div>
            </fieldset>
            {error ? (
              <Aviso>{error}</Aviso>
            ) : null}
            <Boton type="submit" variante="whatsapp" tamano="lg" ancho cargando={enviando} iconoInicio={<WhatsAppIcon size={20} />}>
              Continuar a WhatsApp
            </Boton>
          </form>
        </Modal>
      ) : null}
    </>
  );
}

function Cantidad({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <Campo etiqueta={<span className="font-normal text-ink-soft">{etiqueta}</span>}>
      {(a11y) => (
        <Entrada
          {...a11y}
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="0"
          className="text-center font-mono tabular-nums"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Campo>
  );
}
