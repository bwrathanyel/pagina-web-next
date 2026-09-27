"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AsistenteVirtualPanel } from "@/components/layout/AsistenteVirtualPanel";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import Solcito, { type SolcitoMood } from "@/components/mascota/Solcito";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { useNotificacionesChat } from "@/lib/notificaciones/useNotificacionesChat";
import { tieneFooterStickyPropio } from "@/lib/layout/rutasConFooterSticky";

const SALUDO_VISTO_KEY = "lotus360_solcito_saludo";

/** Solcito flotante: la mascota de los juegos del stand hace de botón del
 * asistente. Un toque abre el chat con la IA directo (el acceso a WhatsApp
 * vive dentro del panel). En /cotizar no aparece: ahí Solcito va embebido en
 * la página (ver AyudanteCotizar). */
export function ContactoFab() {
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mood, setMood] = useState<SolcitoMood>("idle");
  const [globo, setGlobo] = useState("");
  const pathname = usePathname();
  const conFooterSticky = tieneFooterStickyPropio(pathname);
  const { noLeidas, marcarTodoLeido } = useNotificacionesChat();
  const moodTimer = useRef(0);

  const enCotizar = pathname?.startsWith("/cotizar") ?? false;
  // En "Trabaja con nosotros" ya vive la entrevista de RRHH (EntrevistaIA):
  // dos chats de "Lotus" en la misma pantalla confunden -- ahí queda solo WhatsApp.
  const soloWhatsApp = pathname?.startsWith("/trabaja-con-nosotros") ?? false;

  function reaccionar(m: SolcitoMood, ms = 1800, texto = "") {
    window.clearTimeout(moodTimer.current);
    setMood(m);
    if (texto) setGlobo(texto);
    moodTimer.current = window.setTimeout(() => {
      setMood("idle");
      setGlobo("");
    }, ms);
  }

  // Saluda una vez por sesión tras unos segundos, y vuelve a saludar si la
  // persona regresa a la pestaña después de un rato.
  useEffect(() => {
    if (enCotizar || soloWhatsApp) return;
    let visto = false;
    try {
      visto = sessionStorage.getItem(SALUDO_VISTO_KEY) === "1";
    } catch {
      // sessionStorage bloqueado: saluda igual
    }
    const t = visto
      ? 0
      : window.setTimeout(() => {
          reaccionar("wave", 2600, "¿Le ayudo a cotizar?");
          try {
            sessionStorage.setItem(SALUDO_VISTO_KEY, "1");
          } catch {}
        }, 6000);
    let oculto = 0;
    const onVis = () => {
      if (document.hidden) oculto = Date.now();
      else if (oculto && Date.now() - oculto > 30_000) reaccionar("wave", 1800, "¡Volvió!");
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enCotizar, soloWhatsApp]);

  // Mira hacia donde la persona hace scroll; si llega al final de la página, se asoma.
  useEffect(() => {
    if (enCotizar || soloWhatsApp) return;
    let ultimo = 0;
    const onScroll = () => {
      const ahora = Date.now();
      if (ahora - ultimo < 2500) return;
      const alFinal = window.innerHeight + window.scrollY >= document.body.scrollHeight - 200;
      ultimo = ahora;
      reaccionar(alFinal ? "peek" : "look", alFinal ? 1600 : 1400, alFinal ? "¿No encontró lo que buscaba?" : "");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [enCotizar, soloWhatsApp]);

  useEffect(() => () => window.clearTimeout(moodTimer.current), []);

  if (enCotizar) return null;

  const posicion =
    "fixed right-3 z-40 sm:right-5 lg:bottom-6 " + (conFooterSticky ? "bottom-44" : "bottom-24");
  const margenes = {
    marginBottom: "env(safe-area-inset-bottom)",
    marginRight: "env(safe-area-inset-right)",
  };

  if (soloWhatsApp) {
    return (
      <div className={posicion} style={margenes}>
        <WhatsAppLeadButton
          mensajeBase="Hola! Vengo de su página web."
          triggerAriaLabel="Escríbanos por WhatsApp"
          triggerClassName="flex h-14 w-14 items-center justify-center rounded-pill bg-whatsapp text-white shadow-chrome"
        >
          <WhatsAppIcon size={26} />
        </WhatsAppLeadButton>
      </div>
    );
  }

  return (
    <>
      <div className={(chatAbierto ? "hidden " : "") + posicion + " flex items-end gap-2"} style={margenes}>
        {globo ? (
          <p
            role="status"
            className="pointer-events-none mb-9 max-w-48 animate-globo-entrar rounded-card bg-card px-3 py-1.5 text-xs font-semibold text-ink shadow-chrome"
          >
            {globo}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            marcarTodoLeido();
            setGlobo("");
            setChatAbierto(true);
          }}
          onPointerEnter={() => reaccionar("eager", 1400)}
          aria-label="Abrir el asistente Lotus IA"
          className="relative flex h-[72px] w-[72px] items-center justify-center rounded-pill transition-transform duration-200 hover:scale-105 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        >
          <Solcito mood={noLeidas > 0 && mood === "idle" ? "wave" : mood} size={72} />
          {noLeidas > 0 ? (
            <span
              className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-pill bg-acento px-1 text-[11px] font-bold text-sobre-acento ring-2 ring-sand"
              aria-label={`${noLeidas} mensajes sin leer`}
            >
              {noLeidas}
            </span>
          ) : null}
        </button>
      </div>
      {chatAbierto ? <AsistenteVirtualPanel onClose={() => setChatAbierto(false)} /> : null}
    </>
  );
}
