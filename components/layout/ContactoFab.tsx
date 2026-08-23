"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AsistenteVirtualPanel } from "@/components/layout/AsistenteVirtualPanel";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { useNotificacionesChat } from "@/lib/notificaciones/useNotificacionesChat";
import { tieneFooterStickyPropio } from "@/lib/layout/rutasConFooterSticky";

const TOOLTIP_VISTO_KEY = "lotus360_chat_tooltip_visto";

function ChatIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12z" fill="currentColor" />
      <path d="M17.5 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6z" fill="currentColor" />
    </svg>
  );
}

/** Botón flotante único que reemplaza a los dos FABs previos (WhatsApp y
 * Lotus IA, ver AsistenteVirtualButton/WhatsAppFloatButton -- ya borrados).
 * Tener dos botones apilados más un globo de 3 líneas tapaba los avatares de
 * categoría en móvil (hallazgo real, rediseño 2026-08-14). Acá hay uno solo
 * que expande sus dos acciones hacia arriba. */
export function ContactoFab() {
  const [abierto, setAbierto] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mostrarTip, setMostrarTip] = useState(false);
  const pathname = usePathname();
  const conFooterSticky = tieneFooterStickyPropio(pathname);
  const fabRef = useRef<HTMLDivElement>(null);
  const { noLeidas, marcarTodoLeido } = useNotificacionesChat();

  // En "Trabaja con nosotros" ya vive la entrevista de RRHH (EntrevistaIA):
  // dos chats de "Lotus" en la misma pantalla confunden a quien entra
  // buscando trabajo -- se oculta solo la acción de Lotus IA, WhatsApp sigue
  // disponible ahí.
  const ocultarLotusIA = pathname?.startsWith("/trabaja-con-nosotros") ?? false;

  useEffect(() => {
    let yaVisto = false;
    try {
      yaVisto = sessionStorage.getItem(TOOLTIP_VISTO_KEY) === "1";
    } catch {
      // sessionStorage bloqueado -- se muestra igual, no es crítico
    }
    if (yaVisto) return;
    const aparece = setTimeout(() => setMostrarTip(true), 2200);
    const desaparece = setTimeout(() => setMostrarTip(false), 9000);
    return () => {
      clearTimeout(aparece);
      clearTimeout(desaparece);
    };
  }, []);

  useEffect(() => {
    if (!abierto) return;
    function onClickFuera(e: MouseEvent) {
      const target = e.target as Element;
      if (target.closest('[role="dialog"]')) return;
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) setAbierto(false);
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("mousedown", onClickFuera);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onClickFuera);
      document.removeEventListener("keydown", onEscape);
    };
  }, [abierto]);

  function ocultarTip() {
    setMostrarTip(false);
    try {
      sessionStorage.setItem(TOOLTIP_VISTO_KEY, "1");
    } catch {
      // sessionStorage bloqueado -- no pasa nada, solo puede reaparecer
    }
  }

  return (
    <>
      <nav aria-label="Contacto rápido" ref={fabRef} className={chatAbierto ? "hidden" : undefined}>
        <div
          className={
            "fixed right-4 z-40 flex flex-col items-end gap-3 sm:right-5 lg:bottom-6 " +
            (conFooterSticky ? "bottom-44" : "bottom-24")
          }
          style={{
            marginBottom: "env(safe-area-inset-bottom)",
            marginRight: "env(safe-area-inset-right)",
          }}
        >
          {mostrarTip && !abierto ? (
            <div
              role="status"
              className="relative flex max-w-[200px] animate-bounce-in items-center gap-1.5 truncate rounded-full bg-card px-3.5 py-2 text-[11px] font-medium leading-none text-ink shadow-xl ring-1 ring-black/5"
            >
              <span className="truncate">¡Hola! Soy Lotus 🌸 Cotiza tu viaje al instante.</span>
              <button
                type="button"
                onClick={ocultarTip}
                aria-label="Cerrar aviso"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink/10 text-[9px] text-ink"
              >
                ✕
              </button>
            </div>
          ) : null}

          {abierto ? (
            <div className="flex flex-col items-end gap-2.5">
              {!ocultarLotusIA ? (
                <button
                  type="button"
                  style={{ "--retraso": "60ms" } as React.CSSProperties}
                  onClick={() => {
                    marcarTodoLeido();
                    setChatAbierto(true);
                    setAbierto(false);
                  }}
                  className="animate-fab-item relative flex h-12 items-center gap-2.5 rounded-full bg-coral pl-4 pr-5 text-sm font-semibold text-white shadow-[0_10px_28px_-8px_rgba(168,62,0,0.55)]"
                >
                  <ChatIcon />
                  Cotiza con Lotus IA
                  {noLeidas > 0 ? (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[0.6rem] font-bold text-white">
                      {noLeidas}
                    </span>
                  ) : null}
                </button>
              ) : null}
              <WhatsAppLeadButton
                mensajeBase="Hola! Vengo de su página web."
                triggerAriaLabel="Escríbenos por WhatsApp"
                triggerClassName="animate-fab-item relative flex h-12 items-center gap-2.5 overflow-hidden rounded-full bg-whatsapp pl-4 pr-5 text-sm font-semibold text-white shadow-[0_12px_32px_-8px_rgba(15,122,64,0.65)]"
              >
                {/* Mismo lenguaje visual que el halo/destello del botón coral
                    principal (`:166-176` más abajo) pero en verde -- antes
                    era el único pill del grupo sin ningún acento propio,
                    apagado al lado del que sí brillaba. */}
                <span
                  className="animate-fab-halo absolute inset-0 -z-10 rounded-full ring-2 ring-whatsapp"
                  aria-hidden="true"
                />
                <span
                  className="animate-fab-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                  aria-hidden="true"
                />
                <WhatsAppIcon size={20} />
                Escríbenos por WhatsApp
              </WhatsAppLeadButton>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              ocultarTip();
              setAbierto((v) => !v);
            }}
            aria-label={abierto ? "Cerrar opciones de contacto" : "Contactar a Lotus 360"}
            aria-expanded={abierto}
            className="group relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral text-white shadow-[0_10px_28px_-8px_rgba(168,62,0,0.55)]"
          >
            {!abierto ? (
              <span
                className="animate-fab-halo absolute inset-0 -z-10 rounded-full ring-2 ring-gold"
                aria-hidden="true"
              />
            ) : null}
            {!abierto ? (
              <span
                className="animate-fab-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                aria-hidden="true"
              />
            ) : null}
            {noLeidas > 0 && !abierto ? (
              <span className="absolute right-0.5 top-0.5 h-2.5 w-2.5 rounded-full bg-gold ring-2 ring-coral" aria-hidden="true" />
            ) : null}
            <span className={"relative transition-transform duration-200 " + (abierto ? "rotate-45" : "")}>
              {abierto ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M6 18 18 6" />
                </svg>
              ) : (
                <ChatIcon />
              )}
            </span>
          </button>
        </div>
      </nav>
      {chatAbierto ? <AsistenteVirtualPanel onClose={() => setChatAbierto(false)} /> : null}
    </>
  );
}
