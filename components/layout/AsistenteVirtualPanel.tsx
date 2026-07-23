"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_ACTUALIZADO_EVENTO } from "@/lib/notificaciones/useNotificacionesChat";

const SESSION_KEY = "lotus360_chat_session_id";
const HISTORIAL_KEY = "lotus360_chat_historial";

interface Mensaje {
  rol: "lead" | "ia";
  texto: string;
  foto_1?: string | null;
  foto_2?: string | null;
  opcion_titulo?: string | null;
  opcion_precio?: string | null;
}

function obtenerSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function distancia(a: Touch, b: Touch): number {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

// Visor de foto a pantalla completa: pellizcar para zoom en mobile, rueda del
// mouse o doble click en desktop, arrastrar para desplazar cuando hay zoom.
// Los listeners de touch/wheel se agregan nativos con passive:false -- React
// vuelve pasivos los onTouchMove/onWheel de JSX, así que ahí preventDefault
// no evita el scroll/gesto del navegador (solo funciona vía addEventListener).
function LightboxFoto({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  const [escala, setEscala] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const arrastre = useRef<{ x: number; y: number } | null>(null);
  const pellizco = useRef<number | null>(null);
  const escalaRef = useRef(1);
  const posRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    escalaRef.current = escala;
  }, [escala]);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      setEscala((s) => Math.min(4, Math.max(1, s - e.deltaY * 0.0025)));
    };
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        pellizco.current = distancia(e.touches[0], e.touches[1]);
      } else if (e.touches.length === 1 && escalaRef.current > 1) {
        arrastre.current = { x: e.touches[0].clientX - posRef.current.x, y: e.touches[0].clientY - posRef.current.y };
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && pellizco.current != null) {
        const actual = distancia(e.touches[0], e.touches[1]);
        setEscala((s) => Math.min(4, Math.max(1, s * (actual / pellizco.current!))));
        pellizco.current = actual;
      } else if (e.touches.length === 1 && arrastre.current) {
        setPos({ x: e.touches[0].clientX - arrastre.current.x, y: e.touches[0].clientY - arrastre.current.y });
      }
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pellizco.current = null;
      if (e.touches.length === 0) arrastre.current = null;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  function alternarZoom(clientX: number, clientY: number, rect: DOMRect) {
    if (escala > 1) {
      setEscala(1);
      setPos({ x: 0, y: 0 });
      return;
    }
    const origenX = ((clientX - rect.left) / rect.width - 0.5) * -2;
    const origenY = ((clientY - rect.top) / rect.height - 0.5) * -2;
    setEscala(2.5);
    setPos({ x: origenX * 80, y: origenY * 80 });
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 select-none" onClick={onClose}>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar imagen"
        className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xl text-white hover:bg-white/20"
      >
        ✕
      </button>
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        onClick={(e) => {
          e.stopPropagation();
          alternarZoom(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect());
        }}
        onMouseDown={(e) => {
          if (escala <= 1) return;
          arrastre.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        }}
        onMouseMove={(e) => {
          if (!arrastre.current) return;
          setPos({ x: e.clientX - arrastre.current.x, y: e.clientY - arrastre.current.y });
        }}
        onMouseUp={() => (arrastre.current = null)}
        onMouseLeave={() => (arrastre.current = null)}
        className="max-h-[90vh] max-w-[92vw] rounded-lg object-contain transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${escala})`,
          cursor: escala > 1 ? "grab" : "zoom-in",
          touchAction: "none",
        }}
      />
    </div>
  );
}

const MENSAJE_BIENVENIDA: Mensaje = {
  rol: "ia",
  texto: "¡Hola! 😊 Soy Lotus, tu asistente virtual. Contame qué viaje tenés en mente y te ayudo a armarlo.",
};

// Este panel nunca se renderiza en el server -- AsistenteVirtualButton solo
// lo monta client-side tras un click (ver `{abierto && <AsistenteVirtualPanel .../>}`),
// nunca durante hidratación -- así que leer localStorage en el init de
// useState es seguro acá y evita el setState síncrono dentro de un efecto.
function historialInicial(): Mensaje[] {
  const guardado = localStorage.getItem(HISTORIAL_KEY);
  if (guardado) {
    try {
      return JSON.parse(guardado);
    } catch {
      // historial corrupto -- arranca de cero, no rompe el chat
    }
  }
  return [MENSAJE_BIENVENIDA];
}

export function AsistenteVirtualPanel({ onClose }: { onClose: () => void }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(historialInicial);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoZoom, setFotoZoom] = useState<{ src: string; alt: string } | null>(null);
  const sessionIdRef = useRef<string>("");
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = obtenerSessionId();
  }, []);

  useEffect(() => {
    if (mensajes.length) {
      localStorage.setItem(HISTORIAL_KEY, JSON.stringify(mensajes));
      window.dispatchEvent(new Event(CHAT_ACTUALIZADO_EVENTO));
    }
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function enviar() {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    setTexto("");
    setError(null);
    setMensajes((m) => [...m, { rol: "lead", texto: mensaje }]);
    setEnviando(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current, mensaje }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("No pudimos conectar, probá de nuevo 🙈");
        return;
      }
      setMensajes((m) => [
        ...m,
        {
          rol: "ia",
          texto: data.respuesta,
          foto_1: data.foto_1,
          foto_2: data.foto_2,
          opcion_titulo: data.opcion_titulo,
          opcion_precio: data.opcion_precio,
        },
      ]);
    } catch {
      setError("No pudimos conectar, probá de nuevo 🙈");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Lotus, tu asistente virtual para tus viajes"
        onClick={(e) => e.stopPropagation()}
        className="flex h-[92vh] w-full flex-col rounded-t-2xl bg-card shadow-2xl sm:h-[640px] sm:max-w-sm sm:rounded-2xl"
      >
        <div className="flex items-center justify-between rounded-t-2xl bg-seafoam px-4 py-3 text-white">
          <div>
            <p className="font-display text-base font-semibold">Lotus, tu asistente virtual</p>
            <p className="text-xs text-white/80">Te ayuda a armar tu viaje al instante</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar chat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
          >
            ✕
          </button>
        </div>

        <div ref={listaRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {mensajes.map((m, i) => (
            <div key={i} className={`flex ${m.rol === "lead" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-line ${
                  m.rol === "lead" ? "bg-seafoam text-white" : "bg-sand-2 text-ink"
                }`}
              >
                {m.texto}
                {(m.foto_1 || m.opcion_titulo) && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-black/5">
                    {m.foto_1 && (
                      <button
                        type="button"
                        onClick={() => setFotoZoom({ src: m.foto_1!, alt: m.opcion_titulo ?? "" })}
                        aria-label="Ver foto en grande"
                        className="block w-full cursor-zoom-in"
                      >
                        <img src={m.foto_1} alt={m.opcion_titulo ?? ""} className="h-32 w-full object-cover" />
                      </button>
                    )}
                    {(m.opcion_titulo || m.opcion_precio) && (
                      <div className="bg-card px-2 py-1.5 text-xs text-ink">
                        {m.opcion_titulo && <p className="font-semibold">{m.opcion_titulo}</p>}
                        {m.opcion_precio && <p className="text-ink-soft">{m.opcion_precio}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {enviando && <div className="text-xs text-ink-soft">Lotus está escribiendo…</div>}
          {error && <div className="text-xs text-coral">{error}</div>}
        </div>

        <div className="flex items-center gap-2 border-t border-black/5 p-3">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), enviar())}
            disabled={enviando}
            placeholder="Escribí tu mensaje…"
            className="flex-1 rounded-full border border-black/10 bg-sand px-4 py-2 text-sm text-ink outline-none focus:border-seafoam disabled:opacity-60"
          />
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || !texto.trim()}
            aria-label="Enviar mensaje"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-seafoam text-white disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </button>
        </div>
      </div>
      {fotoZoom && <LightboxFoto src={fotoZoom.src} alt={fotoZoom.alt} onClose={() => setFotoZoom(null)} />}
    </div>
  );
}
