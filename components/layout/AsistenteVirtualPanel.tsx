"use client";

import { useEffect, useRef, useState } from "react";
import { CHAT_ACTUALIZADO_EVENTO } from "@/lib/notificaciones/useNotificacionesChat";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import Solcito, { type SolcitoMood } from "@/components/mascota/Solcito";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { AUDIO_MAX_S, aWav16k, comprimirImagen, puedeGrabar } from "@/lib/chat/media";
import { Icono } from "@/components/ui/Icono";

const SESSION_KEY = "lotus360_chat_session_id";
const HISTORIAL_KEY = "lotus360_chat_historial";

interface Mensaje {
  rol: "lead" | "ia";
  texto: string;
  foto_1?: string | null;
  foto_2?: string | null;
  opcion_titulo?: string | null;
  opcion_precio?: string | null;
  audio_url?: string | null;
  // Opcional: hay historiales viejos en el localStorage de la gente sin este
  // campo. Sin hora cuando falta -- nunca new Date(undefined), que renderiza
  // "Invalid Date".
  ts?: number;
  // Lo que mandó el visitante: miniatura de su foto, duración de su nota de
  // voz y lo que la IA entendió de ella.
  foto_lead?: string;
  audio_seg?: number;
  transcripcion?: string;
}

function HoraMensaje({ ts }: { ts?: number }) {
  if (!ts) return null;
  const hora = new Date(ts).toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" });
  return <span className="mt-1 block text-right font-mono text-xs opacity-75">{hora}</span>;
}

// URL pública, no un secreto -- mismo criterio que AUDIO_BASE/CDN_FOTOS en el
// backend (_shared/voz.ts): hardcodeada porque no hace falta protegerla, la
// función solo sintetiza hashes que el bot ya registró (ver audio-web-dinamico).
const AUDIO_SINTESIS_URL = "https://begbjhrdbsqftbbleecb.functions.supabase.co/audio-web-dinamico";

// El bot manda el WhatsApp del asesor como URL dentro del texto; sin esto
// React la escapa y el visitante ve un string muerto que tendría que copiar.
// Sin flag `g` en el test: RegExp.test con `g` mantiene lastIndex entre
// llamadas y devolvería false una vez sí y una vez no sobre la misma parte.
const URL_SPLIT_RE = /(https?:\/\/[^\s]+)/g;
const ES_URL_RE = /^https?:\/\//;

function tieneLink(texto: string): boolean {
  return ES_URL_RE.test(texto) || texto.includes("http://") || texto.includes("https://");
}

function conLinks(texto: string) {
  return texto.split(URL_SPLIT_RE).map((parte, i) =>
    ES_URL_RE.test(parte) ? (
      <a
        key={i}
        href={parte}
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-2 break-all"
      >
        {parte}
      </a>
    ) : (
      <span key={i}>{parte}</span>
    )
  );
}

// El backend manda 'texto' completo SIEMPRE, aunque haya audio -- así que si
// la síntesis tarda, falla, o Fish Audio (tier free, sin SLA) no responde, el
// cliente ve el texto en vez de quedarse sin nada. Solo cuando el audio queda
// listo de verdad se oculta el texto y se muestra el reproductor.
function ContenidoMensaje({ mensaje }: { mensaje: Mensaje }) {
  const [audioListo, setAudioListo] = useState<string | null>(null);

  useEffect(() => {
    if (!mensaje.audio_url) return;
    let cancelado = false;
    fetch(AUDIO_SINTESIS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ audio_url: mensaje.audio_url }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelado && data?.ok && typeof data.audio_url === "string") {
          setAudioListo(data.audio_url);
        }
      })
      .catch(() => {
        // Sin conexión o Fish Audio caído -- el texto ya está visible, no hace falta nada más.
      });
    return () => {
      cancelado = true;
    };
  }, [mensaje.audio_url]);

  // Con audio listo se oculta el texto... salvo que el texto traiga un link
  // (el WhatsApp directo del asesor): ahí se muestran los dos, porque si no
  // un turno con precio citado + contacto directo deja al cliente sin ver
  // nunca la URL.
  if (audioListo) {
    const conLink = tieneLink(mensaje.texto);
    return (
      <>
        <audio controls src={audioListo} className="w-full" style={{ height: 32 }} />
        {conLink ? <span className="mt-2 block">{conLinks(mensaje.texto)}</span> : null}
      </>
    );
  }
  return <>{conLinks(mensaje.texto)}</>;
}

// crypto.randomUUID() no existe en algunos navegadores embebidos (in-app
// browser de Instagram/Facebook con motor viejo) -- ahí tiraba un TypeError
// sin capturar dentro de un useEffect, que React escala directo al error
// boundary y muestra "Something went wrong" / recargar página apenas alguien
// tocaba el botón de la IA (hallazgo real, 2026-07-26). Mismo in-app browser
// a veces bloquea localStorage.setItem -- todo el bloque va con try/catch.
function idAleatorio(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  } catch {
    // sigue abajo con el fallback
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function obtenerSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = idAleatorio();
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // localStorage bloqueado -- el chat funciona igual, solo no persiste la sesión entre recargas
    return idAleatorio();
  }
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
        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-pill bg-white/10 text-white transition-colors duration-150 hover:bg-white/20"
      >
        <Icono nombre="cerrar" />
      </button>
      {/* El zoom/pan calcula la geometría del nodo de imagen; next/image agrega un wrapper. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
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
        className="max-h-[90vh] max-w-[92vw] rounded-media object-contain transition-transform duration-150 ease-salida"
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
  texto:
    "¡Hola! Soy Lotus 🌞 Cuénteme qué viaje tiene en mente y se lo armo. También puede mandarme una foto (por ejemplo, de una oferta que vio) o una nota de voz.",
};

const SUGERENCIAS_BASE = ["Quiero una escapada", "Ver promociones", "Viajar con niños", "Hablar con un asesor"];

// Este panel nunca se renderiza en el server -- se monta client-side tras un
// click, nunca durante hidratación -- así que leer localStorage en el init de
// useState es seguro acá y evita el setState síncrono dentro de un efecto.
function historialInicial(): Mensaje[] {
  try {
    const guardado = localStorage.getItem(HISTORIAL_KEY);
    if (guardado) {
      try {
        return JSON.parse(guardado);
      } catch {
        // historial corrupto -- arranca de cero, no rompe el chat
      }
    }
  } catch {
    // localStorage bloqueado (in-app browser restringido) -- arranca de cero
  }
  return [MENSAJE_BIENVENIDA];
}

// Miniatura chica para el historial: la foto completa no entra en localStorage.
async function miniatura(dataUrl: string): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode().catch(() => undefined);
  const k = Math.min(1, 320 / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(img.naturalWidth * k));
  c.height = Math.max(1, Math.round(img.naturalHeight * k));
  c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.7);
}

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

type Props = {
  onClose: () => void;
  /** "embebido": vive dentro de la página (/cotizar), sin fondo fijo ni tirón para cerrar. */
  modo?: "flotante" | "embebido";
  /** Lo que la persona está armando, para que la IA no pregunte lo que ya se sabe. */
  contexto?: string;
  sugerencias?: string[];
  className?: string;
};

export function AsistenteVirtualPanel({ onClose, modo = "flotante", contexto, sugerencias, className = "" }: Props) {
  const embebido = modo === "embebido";
  const [mensajes, setMensajes] = useState<Mensaje[]>(historialInicial);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fotoZoom, setFotoZoom] = useState<{ src: string; alt: string } | null>(null);
  const [arrastreY, setArrastreY] = useState(0);
  const [cerrando, setCerrando] = useState(false);
  const [foto, setFoto] = useState<string | null>(null);
  const [grabando, setGrabando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const [mood, setMood] = useState<SolcitoMood>("wave");
  const [festejo, setFestejo] = useState(0);
  const sessionIdRef = useRef<string>("");
  const listaRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const archivoRef = useRef<HTMLInputElement>(null);
  const grabadoraRef = useRef<{ rec: MediaRecorder; partes: Blob[]; cancelar: boolean; t0: number } | null>(null);
  const arrastreRef = useRef(0);
  const inicioYRef = useRef<number | null>(null);
  const moodTimer = useRef(0);

  function moodPasajero(m: SolcitoMood, ms = 1600) {
    window.clearTimeout(moodTimer.current);
    setMood(m);
    moodTimer.current = window.setTimeout(() => setMood("idle"), ms);
  }

  useEffect(() => {
    moodTimer.current = window.setTimeout(() => setMood("idle"), 1800);
    return () => window.clearTimeout(moodTimer.current);
  }, []);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 104)}px`;
  }, [texto]);

  useEffect(() => {
    arrastreRef.current = arrastreY;
  }, [arrastreY]);

  function cerrarConAnimacion() {
    setCerrando(true);
    setTimeout(onClose, 200);
  }

  // Tirón hacia abajo en la barra del encabezado para cerrar la hoja en móvil.
  // onTouchMove de JSX es pasivo, así que preventDefault no frena el scroll
  // salvo con addEventListener nativo.
  useEffect(() => {
    const el = handleRef.current;
    if (!el || embebido) return;
    const UMBRAL_CIERRE = 80;

    function onTouchStart(e: TouchEvent) {
      inicioYRef.current = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      if (inicioYRef.current == null) return;
      const delta = e.touches[0].clientY - inicioYRef.current;
      if (delta > 0) {
        e.preventDefault();
        setArrastreY(delta);
      }
    }
    function onTouchEnd() {
      inicioYRef.current = null;
      if (arrastreRef.current > UMBRAL_CIERRE) {
        cerrarConAnimacion();
      } else {
        setArrastreY(0);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embebido]);

  useEffect(() => {
    sessionIdRef.current = obtenerSessionId();
  }, []);

  useEffect(() => {
    if (mensajes.length) {
      try {
        localStorage.setItem(HISTORIAL_KEY, JSON.stringify(mensajes));
      } catch {
        // localStorage lleno o bloqueado -- no persiste el historial pero el chat sigue andando
      }
      window.dispatchEvent(new Event(CHAT_ACTUALIZADO_EVENTO));
    }
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

  useEffect(() => {
    if (embebido) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, embebido]);

  // Cronómetro de la nota de voz; corta sola al llegar al máximo.
  useEffect(() => {
    if (!grabando) return;
    const t = window.setInterval(() => {
      const g = grabadoraRef.current;
      if (!g) return;
      const s = (Date.now() - g.t0) / 1000;
      setSegundos(s);
      if (s >= AUDIO_MAX_S) terminarGrabacion(false);
    }, 250);
    return () => window.clearInterval(t);
  }, [grabando]);

  useEffect(
    () => () => {
      const g = grabadoraRef.current;
      if (g) {
        g.cancelar = true;
        g.rec.stop();
      }
    },
    [],
  );

  async function enviar(opts: { directo?: string; adjunto?: { tipo: "imagen" | "audio"; data: string }; audioSeg?: number } = {}) {
    const mensaje = (opts.directo ?? texto).trim();
    const adjunto = opts.adjunto ?? (foto ? { tipo: "imagen" as const, data: foto } : undefined);
    if ((!mensaje && !adjunto) || enviando) return;
    if (!opts.directo) setTexto("");
    setFoto(null);
    setError(null);
    const burbuja: Mensaje = { rol: "lead", texto: mensaje, ts: Date.now() };
    if (adjunto?.tipo === "imagen") burbuja.foto_lead = await miniatura(adjunto.data).catch(() => undefined);
    if (adjunto?.tipo === "audio") burbuja.audio_seg = Math.round(opts.audioSeg ?? 0);
    setMensajes((m) => [...m, burbuja]);
    setEnviando(true);
    setMood(adjunto?.tipo === "imagen" ? "look" : "think");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current, mensaje, adjunto, contexto }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("No pudimos conectar. Intente de nuevo en un momento.");
        moodPasajero("sad", 2400);
        return;
      }
      setMensajes((m) => {
        const copia = [...m];
        if (data.transcripcion) {
          const i = copia.lastIndexOf(burbuja);
          if (i >= 0) copia[i] = { ...burbuja, transcripcion: data.transcripcion };
        }
        return [
          ...copia,
          {
            rol: "ia",
            texto: data.respuesta,
            foto_1: data.foto_1,
            foto_2: data.foto_2,
            opcion_titulo: data.opcion_titulo,
            opcion_precio: data.opcion_precio,
            audio_url: data.audio_url,
            ts: Date.now(),
          },
        ];
      });
      if (data.lead_creado) {
        moodPasajero("love", 2600);
        setFestejo((n) => n + 1);
      } else {
        moodPasajero(data.foto_1 ? "wink" : "happy", 1500);
      }
    } catch {
      setError("No pudimos conectar. Intente de nuevo en un momento.");
      moodPasajero("sad", 2400);
    } finally {
      setEnviando(false);
    }
  }

  async function elegirFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setError("Solo se pueden enviar fotos.");
      return;
    }
    try {
      setFoto(await comprimirImagen(archivo));
      moodPasajero("eager", 1200);
    } catch {
      setError("No pudimos abrir esa foto. Pruebe con otra.");
    }
  }

  async function empezarGrabacion() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const g = { rec, partes: [] as Blob[], cancelar: false, t0: Date.now() };
      rec.ondataavailable = (ev) => ev.data.size && g.partes.push(ev.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        grabadoraRef.current = null;
        setGrabando(false);
        const seg = (Date.now() - g.t0) / 1000;
        if (g.cancelar) {
          setMood("idle");
          return;
        }
        if (seg < 1) {
          setError("La nota de voz fue muy corta.");
          setMood("idle");
          return;
        }
        try {
          const wav = await aWav16k(new Blob(g.partes, { type: rec.mimeType }));
          await enviar({ directo: "", adjunto: { tipo: "audio", data: wav }, audioSeg: seg });
        } catch {
          setError("No pudimos procesar el audio. Intente de nuevo o escríbanos.");
          moodPasajero("sad", 2000);
        }
      };
      grabadoraRef.current = g;
      rec.start();
      setSegundos(0);
      setGrabando(true);
      setMood("listen");
    } catch {
      setError("Necesitamos permiso para usar el micrófono.");
      moodPasajero("sad", 2000);
    }
  }

  function terminarGrabacion(cancelar: boolean) {
    const g = grabadoraRef.current;
    if (!g) return;
    g.cancelar = cancelar;
    if (g.rec.state !== "inactive") g.rec.stop();
  }

  const listaSugerencias = sugerencias ?? SUGERENCIAS_BASE;
  const hayTexto = !!texto.trim() || !!foto;

  return (
    <>
      <div
        role={embebido ? "region" : "dialog"}
        aria-label="Lotus, su asistente virtual"
        className={
          (embebido
            ? "relative flex h-full min-h-[420px] w-full flex-col overflow-hidden rounded-card border border-linea bg-card "
            : "fixed inset-x-0 bottom-0 z-50 flex h-[80dvh] w-full flex-col overflow-hidden rounded-t-card bg-card shadow-chrome " +
              "sm:inset-x-auto sm:bottom-24 sm:right-4 sm:h-[72vh] sm:max-h-[640px] sm:w-[90vw] sm:max-w-[400px] sm:rounded-card sm:mb-[env(safe-area-inset-bottom)] sm:mr-[env(safe-area-inset-right)] " +
              (cerrando
                ? "transition-[transform,opacity] duration-200 ease-in translate-y-full sm:translate-y-0 sm:opacity-0"
                : "animate-panel-abrir")) +
          " " +
          className
        }
        style={!embebido && !cerrando && arrastreY ? { transform: `translateY(${arrastreY}px)` } : undefined}
      >
        <div ref={handleRef} className="flex flex-col items-center bg-dusk pt-2 text-dusk-text sm:pt-0">
          {!embebido ? <span className="h-1 w-9 rounded-pill bg-dusk-text/30 sm:hidden" aria-hidden="true" /> : null}
          <div className="flex w-full items-center gap-2 py-1.5 pl-2 pr-2 sm:py-2">
            <Solcito mood={mood} size={48} chispas={festejo} />
            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold leading-tight">Lotus</p>
              <p className="truncate text-xs text-dusk-text-soft">
                {grabando ? "Escuchando…" : enviando ? "Pensando su viaje…" : "Su asistente de viajes · en línea"}
              </p>
            </div>
            <WhatsAppLeadButton
              mensajeBase="Hola! Vengo del chat de su página web."
              triggerAriaLabel="Hablar con un asesor por WhatsApp"
              triggerClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-dusk-text transition-colors duration-150 hover:bg-dusk-2"
            >
              <WhatsAppIcon size={20} />
            </WhatsAppLeadButton>
            {!embebido ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar chat"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-dusk-text transition-colors duration-150 hover:bg-dusk-2"
              >
                <Icono nombre="cerrar" />
              </button>
            ) : null}
          </div>
        </div>

        <div
          ref={listaRef}
          role="log"
          aria-live="polite"
          aria-label="Conversación con Lotus"
          className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
        >
          {mensajes.map((m, i) => (
            <div key={i} className={`flex ${m.rol === "lead" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-card px-3.5 py-2.5 text-sm ${
                  m.rol === "lead"
                    ? "animate-msg-in-right rounded-br-md bg-acento text-sobre-acento"
                    : "animate-msg-in-left rounded-bl-md bg-sand-2 text-ink"
                }`}
              >
                {m.foto_lead ? (
                  <button
                    type="button"
                    onClick={() => setFotoZoom({ src: m.foto_lead!, alt: "Foto enviada" })}
                    aria-label="Ver foto enviada"
                    className="mb-1.5 block overflow-hidden rounded-media"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.foto_lead} alt="Foto enviada" className="max-h-44 w-full object-cover" />
                  </button>
                ) : null}
                {m.audio_seg != null ? (
                  <span className="flex items-center gap-2 font-semibold">
                    <Icono nombre="microfono" tamano={16} />
                    Nota de voz · {mmss(m.audio_seg)}
                  </span>
                ) : null}
                {m.transcripcion ? <span className="mt-1 block text-xs italic opacity-90">“{m.transcripcion}”</span> : null}
                {m.rol === "ia" ? <ContenidoMensaje mensaje={m} /> : m.texto}
                {(m.foto_1 || m.opcion_titulo) && (
                  <div className="mt-2 overflow-hidden rounded-media border border-linea">
                    {m.foto_1 && (
                      <button
                        type="button"
                        onClick={() => setFotoZoom({ src: m.foto_1!, alt: m.opcion_titulo ?? "" })}
                        aria-label="Ver foto en grande"
                        className="block w-full cursor-zoom-in"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={m.foto_1} alt={m.opcion_titulo ?? ""} className="h-36 w-full object-cover" />
                      </button>
                    )}
                    {(m.opcion_titulo || m.opcion_precio) && (
                      <div className="bg-card px-3 py-2 text-sm text-ink">
                        {m.opcion_titulo && <p className="font-semibold">{m.opcion_titulo}</p>}
                        {m.opcion_precio && <p className="font-mono font-bold tabular-nums">{m.opcion_precio}</p>}
                      </div>
                    )}
                  </div>
                )}
                <HoraMensaje ts={m.ts} />
              </div>
            </div>
          ))}
          {mensajes.length === 1 && !enviando ? (
            <div className="flex flex-wrap gap-1.5">
              {listaSugerencias.map((sugerencia) => (
                <button
                  key={sugerencia}
                  type="button"
                  onClick={() => enviar({ directo: sugerencia })}
                  className="min-h-11 rounded-pill border border-linea-fuerte bg-card px-4 text-sm font-semibold text-ink transition-colors duration-150 hover:border-acento hover:text-acento"
                >
                  {sugerencia}
                </button>
              ))}
            </div>
          ) : null}
          {enviando ? (
            <div className="flex items-center gap-2" aria-live="polite">
              <span className="sr-only">Lotus está escribiendo…</span>
              <div className="flex items-center gap-1 rounded-card rounded-bl-md bg-sand-2 px-3 py-3" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="animate-typing-dot h-1.5 w-1.5 rounded-pill bg-ink-soft"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          ) : null}
          {error && (
            <p role="alert" className="text-sm font-semibold text-peligro">
              {error}
            </p>
          )}
        </div>

        {foto ? (
          <div className="flex items-center gap-3 border-t border-linea px-3 pt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={foto} alt="Foto por enviar" className="h-14 w-14 rounded-media object-cover" />
            <p className="min-w-0 flex-1 text-xs text-ink-soft">Agregue un comentario si quiere y toque enviar.</p>
            <button
              type="button"
              onClick={() => setFoto(null)}
              aria-label="Quitar foto"
              className="flex h-11 w-11 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-2"
            >
              <Icono nombre="cerrar" tamano={18} />
            </button>
          </div>
        ) : null}

        {grabando ? (
          <div className="flex items-center gap-2 border-t border-linea p-3">
            <button
              type="button"
              onClick={() => terminarGrabacion(true)}
              aria-label="Descartar nota de voz"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-soft hover:bg-sand-2"
            >
              <Icono nombre="papelera" tamano={20} />
            </button>
            <div className="flex min-h-11 flex-1 items-center gap-2 rounded-control bg-sand px-4 text-sm text-ink">
              <span className="h-2.5 w-2.5 animate-pulse rounded-pill bg-peligro" aria-hidden="true" />
              <span className="font-mono tabular-nums">{mmss(segundos)}</span>
              <span className="text-ink-soft">/ {mmss(AUDIO_MAX_S)}</span>
            </div>
            <button
              type="button"
              onClick={() => terminarGrabacion(false)}
              aria-label="Enviar nota de voz"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-acento text-sobre-acento active:scale-95"
            >
              <Icono nombre="enviar" tamano={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-end gap-1.5 border-t border-linea p-3" style={{ paddingBottom: embebido ? undefined : "max(0.75rem, env(safe-area-inset-bottom))" }}>
            <input ref={archivoRef} type="file" accept="image/*" className="hidden" onChange={elegirFoto} />
            <button
              type="button"
              onClick={() => archivoRef.current?.click()}
              disabled={enviando}
              aria-label="Enviar una foto"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-ink disabled:opacity-50"
            >
              <Icono nombre="camara" tamano={21} />
            </button>
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onFocus={() => moodPasajero("eager", 900)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), enviar())}
              disabled={enviando}
              placeholder="Escriba su mensaje…"
              rows={1}
              aria-label="Su mensaje"
              className="max-h-[104px] min-h-11 min-w-0 flex-1 resize-none rounded-control border border-linea-fuerte bg-sand px-4 py-2.5 text-base text-ink placeholder:text-ink-soft transition-[border-color,box-shadow] duration-150 focus:border-acento focus:outline-none focus:ring-4 focus:ring-acento/20 disabled:opacity-60"
            />
            {hayTexto || !puedeGrabar() ? (
              <button
                type="button"
                onClick={() => enviar()}
                disabled={enviando || !hayTexto}
                aria-label="Enviar mensaje"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-acento text-sobre-acento transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <Icono nombre="enviar" tamano={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={empezarGrabacion}
                disabled={enviando}
                aria-label="Grabar una nota de voz"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-acento text-sobre-acento transition-[filter,transform] duration-150 hover:brightness-110 active:scale-95 disabled:opacity-50"
              >
                <Icono nombre="microfono" tamano={20} />
              </button>
            )}
          </div>
        )}
      </div>
      {fotoZoom && <LightboxFoto src={fotoZoom.src} alt={fotoZoom.alt} onClose={() => setFotoZoom(null)} />}
    </>
  );
}
