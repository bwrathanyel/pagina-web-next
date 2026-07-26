"use client";

import { useEffect, useRef, useState } from "react";

const SESSION_KEY = "lotus360_entrevista_session_id";

interface Mensaje {
  rol: "candidato" | "ia";
  texto: string;
}

const BIENVENIDA: Mensaje = {
  rol: "ia",
  texto:
    "¡Hola! Soy Lotus, del equipo de Destino y Eventos Lotus 360. Cuéntame un poco de ti y vemos juntos si encajas con alguna de las vacantes abiertas. ¿Te interesa la modalidad presencial en nuestra oficina de Naguanagua, o freelance desde casa?",
};

// Mismo blindaje que AsistenteVirtualPanel: el in-app browser de Instagram
// puede no traer crypto.randomUUID o bloquear localStorage, y una excepción
// suelta dentro de un efecto de React escala al error boundary (pantalla de
// "recargar página"). Ver el fix del 2026-07-26 en ese archivo.
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
    return idAleatorio();
  }
}

export function EntrevistaIA() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([BIENVENIDA]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrada, setRegistrada] = useState(false);
  const sessionIdRef = useRef<string>("");
  const listaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionIdRef.current = obtenerSessionId();
  }, []);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

  async function enviar() {
    const mensaje = texto.trim();
    if (!mensaje || enviando) return;
    setTexto("");
    setError(null);
    setMensajes((m) => [...m, { rol: "candidato", texto: mensaje }]);
    setEnviando(true);
    try {
      const res = await fetch("/api/entrevista-empleo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionIdRef.current, mensaje }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("No pudimos conectar. Intenta de nuevo en un momento.");
        return;
      }
      setMensajes((m) => [...m, { rol: "ia", texto: data.respuesta }]);
      if (data.entrevista_completa) setRegistrada(true);
    } catch {
      setError("No pudimos conectar. Intenta de nuevo en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-dusk-text/12 bg-dusk-2">
      <div className="flex items-center gap-3 border-b border-dusk-text/12 px-5 py-4">
        <span
          aria-hidden="true"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold font-display text-lg font-bold text-dusk"
        >
          L
        </span>
        <div>
          <p className="font-display text-base font-semibold text-dusk-text">Habla con Lotus</p>
          <p className="text-xs text-dusk-text-soft">Te hace unas preguntas y registra tu postulación</p>
        </div>
      </div>

      <div ref={listaRef} className="flex h-[380px] flex-col gap-3 overflow-y-auto px-5 py-5">
        {mensajes.map((m, i) => (
          <div key={i} className={`flex ${m.rol === "candidato" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                m.rol === "candidato" ? "bg-gold text-dusk" : "bg-dusk text-dusk-text"
              }`}
            >
              {m.texto}
            </div>
          </div>
        ))}
        {enviando && <p className="text-xs text-dusk-text-soft">Lotus está escribiendo…</p>}
        {error && <p className="text-xs text-gold">{error}</p>}
        {registrada && (
          <p className="rounded-2xl bg-dusk px-4 py-3 text-xs leading-5 text-dusk-text-soft">
            ✓ Tu postulación quedó registrada. El equipo la revisa y te contacta si tu perfil encaja.
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-dusk-text/12 p-4">
        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), enviar())}
          disabled={enviando}
          placeholder="Escribe tu respuesta…"
          aria-label="Tu respuesta para la entrevista"
          className="flex-1 rounded-full border border-dusk-text/15 bg-dusk px-4 py-2.5 text-sm text-dusk-text outline-none placeholder:text-dusk-text-soft/60 focus:border-gold disabled:opacity-60"
        />
        <button
          type="button"
          onClick={enviar}
          disabled={enviando || !texto.trim()}
          aria-label="Enviar respuesta"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold text-dusk disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
