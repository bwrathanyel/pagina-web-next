"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AsistenteVirtualPanel } from "@/components/layout/AsistenteVirtualPanel";
import { tieneFooterStickyPropio } from "@/lib/layout/rutasConFooterSticky";

const TOOLTIP_VISTO_KEY = "lotus360_chat_tooltip_visto";

export function AsistenteVirtualButton() {
  const [abierto, setAbierto] = useState(false);
  const [mostrarTip, setMostrarTip] = useState(false);
  const pathname = usePathname();
  const conFooterSticky = tieneFooterStickyPropio(pathname);
  // En "Trabaja con nosotros" ya vive la entrevista de RRHH (EntrevistaIA):
  // dos chats de "Lotus" en la misma pantalla, uno de viajes y otro de
  // empleo, confunden a quien entra buscando trabajo.
  const ocultarEnEstaRuta = pathname?.startsWith("/trabaja-con-nosotros") ?? false;

  // La mayoría no entendía que el botón abre una IA con la que se puede
  // cotizar el viaje entero charlando -- pedido del dueño (2026-07-26): globo
  // que se muestra una sola vez por navegador para explicarlo, sin ser
  // invasivo en visitas siguientes. sessionStorage envuelto en try/catch por
  // el mismo motivo que AsistenteVirtualPanel (in-app browser puede bloquearlo).
  useEffect(() => {
    let yaVisto = false;
    try {
      yaVisto = sessionStorage.getItem(TOOLTIP_VISTO_KEY) === "1";
    } catch {
      // sessionStorage bloqueado -- se muestra igual, no es crítico
    }
    if (yaVisto || ocultarEnEstaRuta) return;
    const aparece = setTimeout(() => setMostrarTip(true), 2200);
    const desaparece = setTimeout(() => setMostrarTip(false), 9000);
    return () => {
      clearTimeout(aparece);
      clearTimeout(desaparece);
    };
  }, [ocultarEnEstaRuta]);

  function ocultarTip() {
    setMostrarTip(false);
    try {
      sessionStorage.setItem(TOOLTIP_VISTO_KEY, "1");
    } catch {
      // sessionStorage bloqueado -- no pasa nada, solo puede reaparecer
    }
  }

  if (ocultarEnEstaRuta) return null;

  return (
    <>
      <nav aria-label="Asistente virtual">
        <div
          className={
            "fixed right-4 z-40 flex flex-col items-end gap-2 sm:right-5 lg:bottom-24 " +
            (conFooterSticky ? "bottom-60" : "bottom-40")
          }
          style={{
            marginBottom: "env(safe-area-inset-bottom)",
            marginRight: "env(safe-area-inset-right)",
          }}
        >
          {mostrarTip && (
            <div
              role="status"
              className="relative max-w-[220px] animate-bounce-in rounded-2xl rounded-br-sm bg-card px-3.5 py-2.5 text-xs leading-snug text-ink shadow-xl ring-1 ring-black/5"
            >
              <button
                type="button"
                onClick={ocultarTip}
                aria-label="Cerrar aviso"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-[10px] text-white"
              >
                ✕
              </button>
              ¡Hola! Soy Lotus 🌸 Charlá conmigo y te armo la cotización completa de tu viaje al instante.
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              ocultarTip();
              setAbierto(true);
            }}
            aria-label="Hablar con Lotus, el asistente virtual que arma tu cotización"
            title="Hablar con Lotus, el asistente virtual"
            className="group relative flex h-14 items-center gap-2.5 rounded-full bg-seafoam pl-4 pr-5 text-white shadow-[0_10px_28px_-8px_rgba(62,130,125,0.55)] sm:w-14 sm:justify-center sm:px-0"
          >
            <span className="absolute inset-0 -z-10 rounded-full bg-seafoam/60 animate-ping [animation-duration:2.4s]" aria-hidden="true" />
            <span className="relative flex h-6 w-6 shrink-0 items-center justify-center">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="absolute">
                <path
                  d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12z"
                  fill="currentColor"
                />
                <path
                  d="M17.5 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6z"
                  fill="currentColor"
                />
              </svg>
            </span>
            <span className="font-display whitespace-nowrap text-sm font-semibold sm:hidden">
              Cotiza con Lotus IA
            </span>
          </button>
        </div>
      </nav>
      {abierto && <AsistenteVirtualPanel onClose={() => setAbierto(false)} />}
    </>
  );
}
