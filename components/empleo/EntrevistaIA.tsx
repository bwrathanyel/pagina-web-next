"use client";

import { useEffect, useRef, useState } from "react";
import { archivoABase64, validarArchivoCV } from "@/lib/empleo/postularEmpleo";

const SESSION_KEY = "lotus360_entrevista_session_id";

interface Mensaje {
  // 'sistema' es un aviso propio (ej. "CV recibido"), no una respuesta real de
  // la IA -- se renderiza distinto para no confundirlo con lo que Lotus dijo.
  rol: "candidato" | "ia" | "sistema";
  texto: string;
}

const BIENVENIDA: Mensaje = {
  rol: "ia",
  texto:
    "¡Hola! Soy Lotus, del equipo de Destino y Eventos Lotus 360. Cuéntame un poco de ti y vemos juntos si encajas con alguna de las vacantes abiertas. ¿Te interesa la modalidad presencial en nuestra oficina de Naguanagua, o freelance desde casa?",
};

const CV_ERROR_TEXTO: Record<string, string> = {
  cv_formato_invalido: "El CV debe ser PDF, JPG o PNG.",
  cv_invalido: "No pudimos leer ese archivo -- prueba con otro.",
  cv_muy_grande: "El archivo no puede pesar más de 5MB.",
  cv_error_subida: "No pudimos subir el CV justo ahora. Prueba de nuevo en un momento.",
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
  // El CV se junta con el próximo mensaje que se envíe (no dispara su propio
  // turno solo) -- cvConfirmado marca que el backend ya lo subió, así no se
  // reenvía el mismo archivo en cada mensaje siguiente.
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvConfirmado, setCvConfirmado] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>("");
  const listaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    sessionIdRef.current = obtenerSessionId();
  }, []);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }, [mensajes]);

  function elegirCV(file: File | null) {
    setCvError(null);
    if (!file) { setCvFile(null); return; }
    const problema = validarArchivoCV(file);
    if (problema === "formato") { setCvError("El CV debe ser PDF, JPG o PNG."); return; }
    if (problema === "tamano") { setCvError("El archivo no puede pesar más de 5MB."); return; }
    setCvFile(file);
    setCvConfirmado(false);
  }

  function quitarCV() {
    setCvFile(null);
    setCvError(null);
    setCvConfirmado(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function enviar() {
    const mensajeEscrito = texto.trim();
    const hayCvPendiente = cvFile && !cvConfirmado;
    // Se puede mandar solo el CV, sin texto -- pero el chat necesita algo
    // legible en la burbuja del candidato, así que se pone un texto por
    // defecto en vez de dejarla vacía.
    const mensaje = mensajeEscrito || (hayCvPendiente ? "He adjuntado mi CV." : "");
    if (!mensaje || enviando) return;

    setTexto("");
    setError(null);
    setMensajes((m) => [...m, { rol: "candidato", texto: mensaje }]);
    setEnviando(true);
    try {
      const body: Record<string, unknown> = { session_id: sessionIdRef.current, mensaje };
      if (hayCvPendiente && cvFile) {
        body.cv_base64 = await archivoABase64(cvFile);
        body.cv_mime = cvFile.type;
      }
      const res = await fetch("/api/entrevista-empleo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError("No pudimos conectar. Intenta de nuevo en un momento.");
        return;
      }
      setMensajes((m) => [...m, { rol: "ia", texto: data.respuesta }]);
      if (data.entrevista_completa) setRegistrada(true);
      if (data.cv_recibido) {
        setCvConfirmado(true);
        setMensajes((m) => [...m, { rol: "sistema", texto: "📎 Recibimos tu CV, gracias." }]);
      } else if (data.cv_error) {
        // El archivo no se pudo procesar del lado del servidor (poco común,
        // ya se validó en el navegador) -- se deja el mismo adjunto puesto
        // para que la persona pueda intentar de nuevo con el próximo mensaje.
        setCvError(CV_ERROR_TEXTO[data.cv_error as string] ?? "No pudimos procesar el CV. Probá con otro archivo.");
      }
    } catch {
      setError("No pudimos conectar. Intenta de nuevo en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  const hayCvPendiente = !!cvFile && !cvConfirmado;

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
        {mensajes.map((m, i) =>
          m.rol === "sistema" ? (
            <p key={i} className="text-center text-xs leading-5 text-dusk-text-soft">
              {m.texto}
            </p>
          ) : (
            <div key={i} className={`flex ${m.rol === "candidato" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                  m.rol === "candidato" ? "bg-gold text-dusk" : "bg-dusk text-dusk-text"
                }`}
              >
                {m.texto}
              </div>
            </div>
          ),
        )}
        {enviando && <p className="text-xs text-dusk-text-soft">Lotus está escribiendo…</p>}
        {error && <p className="text-xs text-gold">{error}</p>}
        {registrada && (
          <p className="rounded-2xl bg-dusk px-4 py-3 text-xs leading-5 text-dusk-text-soft">
            ✓ Tu postulación quedó registrada. El equipo la revisa y te contacta si tu perfil encaja.
          </p>
        )}
      </div>

      {hayCvPendiente && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-xl bg-dusk px-3 py-2 text-xs text-dusk-text-soft">
          <span aria-hidden="true">📎</span>
          <span className="flex-1 truncate">{cvFile!.name} -- se envía con tu próximo mensaje</span>
          <button type="button" onClick={quitarCV} aria-label="Quitar CV adjunto" className="shrink-0 font-bold text-gold">
            ✕
          </button>
        </div>
      )}
      {cvError && <p className="mx-5 mb-2 text-xs text-gold">{cvError}</p>}

      <div className="flex items-center gap-2 border-t border-dusk-text/12 p-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => elegirCV(e.target.files?.[0] ?? null)}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={enviando}
          aria-label="Adjuntar CV"
          title="Adjuntar CV (PDF, JPG o PNG, máx. 5MB)"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-dusk-text/15 text-dusk-text-soft transition hover:border-gold hover:text-gold disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21.44 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a1.5 1.5 0 01-2.12-2.12l8.49-8.48" />
          </svg>
        </button>
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
          disabled={enviando || (!texto.trim() && !hayCvPendiente)}
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
