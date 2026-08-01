"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CIFRAS, HACE, HORA_ABRE, HORA_CIERRA, MENSAJES_POR_HORA, NO_HACE, OFRECE,
  PLAN_BASICO, PLAN_FULL, SUGERENCIAS, type Opcion,
} from "./datos";

/* Recorrido de cinco actos, uno por pantalla. Se avanza por decisión y no por
   scroll: el pedido explícito fue que no se sintiera una página infinita hacia
   abajo. Cada acto monta su propia animación al entrar. */

const ACTOS = ["El problema", "La noche", "Pruébala", "Ármala", "Tu perfil"] as const;

export function PropuestaPosadas() {
  const [acto, setActo] = useState(0);
  const tope = useRef<HTMLDivElement>(null);

  const ir = useCallback((n: number) => {
    setActo(Math.max(0, Math.min(ACTOS.length - 1, n)));
    tope.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div ref={tope} className="min-h-screen bg-sand text-ink">
      <Progreso acto={acto} ir={ir} />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-6 sm:px-8">
        {acto === 0 && <ActoReloj />}
        {acto === 1 && <ActoNoche />}
        {acto === 2 && <ActoPrueba />}
        {acto === 3 && <ActoConfigurar />}
        {acto === 4 && <ActoPerfil />}
        <Navegacion acto={acto} ir={ir} />
      </main>
    </div>
  );
}

function Progreso({ acto, ir }: { acto: number; ir: (n: number) => void }) {
  return (
    <div className="sticky top-0 z-30 border-b border-ink/10 bg-sand/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3 sm:px-8">
        <span className="hidden text-xs font-bold uppercase tracking-[0.14em] text-ink-soft sm:inline">
          Lotus&nbsp;360
        </span>
        <div className="flex flex-1 gap-1.5">
          {ACTOS.map((nombre, i) => (
            <button
              key={nombre}
              onClick={() => ir(i)}
              aria-current={i === acto ? "step" : undefined}
              aria-label={`Paso ${i + 1}: ${nombre}`}
              className="group flex-1 py-2"
            >
              <span
                className={`block h-1 rounded-full transition-all duration-500 ${
                  i <= acto ? "bg-coral" : "bg-ink/15 group-hover:bg-ink/30"
                }`}
              />
              <span
                className={`mt-1.5 hidden text-[11px] font-semibold transition-colors sm:block ${
                  i === acto ? "text-coral" : "text-ink-soft"
                }`}
              >
                {nombre}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Navegacion({ acto, ir }: { acto: number; ir: (n: number) => void }) {
  const ultimo = acto === ACTOS.length - 1;
  return (
    <div className="mt-12 flex items-center justify-between gap-4 border-t border-ink/10 pt-6">
      <button
        onClick={() => ir(acto - 1)}
        disabled={acto === 0}
        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-ink/5 disabled:invisible"
      >
        ← Atrás
      </button>
      {!ultimo && (
        <button
          onClick={() => ir(acto + 1)}
          className="rounded-xl bg-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-coral/20 transition hover:bg-coral-bright hover:shadow-xl"
        >
          {["Ver qué pasa esa noche", "Probarla ahora", "Armarla a mi gusto", "Casi listo"][acto]} →
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Acto 1 */

function ActoReloj() {
  const [animar, setAnimar] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setAnimar(true), 120);
    return () => clearTimeout(t);
  }, []);

  const maximo = Math.max(...MENSAJES_POR_HORA);

  return (
    <section className="animate-[surge_.5s_ease-out]">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">
        Anoche, en el Instagram de tu posada
      </p>
      <p className="mt-4 font-serif text-6xl leading-none tracking-tight text-coral sm:text-8xl">
        9:47<span className="ml-1 align-super text-2xl text-ink sm:text-3xl">p.m.</span>
      </p>
      <h1 className="mt-4 max-w-xl text-balance font-serif text-3xl leading-tight sm:text-5xl">
        Alguien preguntó el precio y nadie le contestó.
      </h1>
      <p className="mt-5 max-w-lg text-ink-soft">
        No es una suposición. Es la hora en que más gente escribe: lo medimos
        durante veinte días sobre {CIFRAS.conversaciones.toLocaleString("es-VE")} conversaciones reales.
      </p>

      <div className="mt-10 rounded-2xl border border-ink/10 bg-card p-5 sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
          Mensajes por hora · 12 al 31 de julio de 2026
        </p>
        <div
          className="mt-6 flex h-44 items-end gap-[3px] sm:h-56"
          role="img"
          aria-label={`Gráfico de mensajes por hora. El pico es a las ${CIFRAS.horaPico} horas con ${CIFRAS.mensajesHoraPico} mensajes. El ${CIFRAS.porcentajeFuera} por ciento llega fuera del horario de oficina.`}
        >
          {MENSAJES_POR_HORA.map((n, hora) => {
            const dentro = hora >= HORA_ABRE && hora <= HORA_CIERRA;
            const pico = n === maximo;
            return (
              <div
                key={hora}
                className={`flex-1 rounded-t transition-[height] duration-700 ease-out ${
                  pico ? "bg-coral ring-2 ring-coral/40" : dentro ? "bg-sand-2" : "bg-coral/75"
                }`}
                style={{
                  height: animar ? `${(n / maximo) * 100}%` : "2%",
                  transitionDelay: `${hora * 28}ms`,
                }}
                title={`${hora}:00 — ${n} mensajes`}
              />
            );
          })}
        </div>
        <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-[11px] tabular-nums text-ink-soft">
          <span>12 a.m.</span><span>6 a.m.</span><span>12 p.m.</span><span>6 p.m.</span><span>11 p.m.</span>
        </div>
        <p className="mt-5 border-t border-ink/10 pt-4 text-sm leading-relaxed">
          <strong>La hora pico son las nueve de la noche.</strong> Más mensajes que a
          las diez de la mañana y más que a las tres de la tarde.{" "}
          {CIFRAS.fueraDeHorario.toLocaleString("es-VE")} de las{" "}
          {CIFRAS.conversaciones.toLocaleString("es-VE")} conversaciones —el{" "}
          {CIFRAS.porcentajeFuera}%— llegaron fuera del horario de oficina, y otras{" "}
          {CIFRAS.finDeSemana} cayeron en sábado o domingo.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Acto 2 */

interface Burbuja {
  de: "cliente" | "posada" | "silencio";
  texto: string;
  hora?: string;
}

const CONVERSACION_PERDIDA: Burbuja[] = [
  { de: "cliente", texto: "Hola buenas noches, ¿tienen disponible para el fin de semana? ¿Y cuánto sale?", hora: "Domingo, 9:47 p.m." },
  { de: "silencio", texto: "visto a las 8:10 a.m. — diez horas después" },
  { de: "cliente", texto: "Ya no, gracias 🙏", hora: "Lunes, 8:32 a.m." },
];

function ActoNoche() {
  const [visibles, setVisibles] = useState(0);

  useEffect(() => {
    if (visibles >= CONVERSACION_PERDIDA.length) return;
    // El silencio tarda más a propósito: es lo que se está contando.
    const espera = CONVERSACION_PERDIDA[visibles].de === "silencio" ? 1500 : 800;
    const t = setTimeout(() => setVisibles((v) => v + 1), espera);
    return () => clearTimeout(t);
  }, [visibles]);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Lo que pasa hoy</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        El mensaje llega cuando la posada ya cerró.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        El cliente no escribe en horario de oficina. Escribe cuando se sienta a
        planear el viaje. Para cuando alguien abre el Instagram a la mañana
        siguiente, ya preguntó en otras tres posadas y alguna le respondió primero.
      </p>

      <div className="mt-9 max-w-md rounded-2xl border border-ink/10 bg-card p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2.5 border-b border-ink/10 pb-3">
          <span className="h-8 w-8 rounded-full bg-gradient-to-br from-seafoam to-coral" />
          <span className="text-sm font-bold leading-tight">
            Tu posada
            <small className="block font-normal text-ink-soft">Instagram · mensaje directo</small>
          </span>
        </div>
        <div className="flex flex-col gap-2.5">
          {CONVERSACION_PERDIDA.slice(0, visibles).map((b, i) =>
            b.de === "silencio" ? (
              <p
                key={i}
                className="animate-[surge_.4s_ease-out] rounded-xl bg-[repeating-linear-gradient(-45deg,transparent,transparent_7px,rgba(0,0,0,.06)_7px,rgba(0,0,0,.06)_8px)] py-4 text-center text-xs font-semibold text-ink-soft"
              >
                {b.texto}
              </p>
            ) : (
              <div key={i} className="animate-[surge_.4s_ease-out]">
                <p className="max-w-[85%] rounded-2xl rounded-bl-sm bg-sand-2 px-3.5 py-2.5 text-sm">
                  {b.texto}
                </p>
                {b.hora && <span className="mt-1 block text-[11px] tabular-nums text-ink-soft">{b.hora}</span>}
              </div>
            ),
          )}
          {visibles < CONVERSACION_PERDIDA.length && (
            <span className="text-xs text-ink-soft" aria-hidden>…</span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Acto 3 */

interface MensajeChat {
  rol: "visitante" | "ia";
  texto: string;
  foto?: string | null;
  titulo?: string | null;
  precio?: string | null;
}

function idSesion(): string {
  try {
    return crypto.randomUUID();
  } catch {
    // El navegador embebido de Instagram puede no traer randomUUID.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
}

function ActoPrueba() {
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const sesion = useRef<string>("");
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => { sesion.current = idSesion(); }, []);
  useEffect(() => { fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [mensajes, cargando]);

  const enviar = useCallback(async (mensaje: string) => {
    const limpio = mensaje.trim();
    if (!limpio || cargando) return;
    setMensajes((m) => [...m, { rol: "visitante", texto: limpio }]);
    setTexto("");
    setCargando(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sesion.current, mensaje: limpio }),
      });
      const data = await res.json().catch(() => null);
      setMensajes((m) => [...m, {
        rol: "ia",
        texto: data?.respuesta || "No pude responder ahora mismo. Intenta de nuevo en un momento.",
        foto: data?.foto_1 ?? null,
        titulo: data?.opcion_titulo ?? null,
        precio: data?.opcion_precio ?? null,
      }]);
    } catch {
      setMensajes((m) => [...m, { rol: "ia", texto: "Se cortó la conexión. Intenta de nuevo." }]);
    } finally {
      setCargando(false);
    }
  }, [cargando]);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Pruébala ahora</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        Escríbele como si fueras un cliente.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        Esta es la asistente de verdad, respondiendo con nuestro catálogo real.
        Si tu posada ya trabaja con nosotros,{" "}
        <strong className="text-ink">pregúntale por tu propio alojamiento</strong> y
        te va a responder con tus fotos y tus precios.
      </p>

      <div className="mt-8 rounded-2xl border border-ink/10 bg-card p-4 sm:p-5">
        <div className="max-h-[26rem] min-h-[10rem] overflow-y-auto pr-1">
          {mensajes.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-soft">
              Toca una pregunta de abajo o escribe la tuya.
            </p>
          )}
          <div className="flex flex-col gap-3">
            {mensajes.map((m, i) => (
              <div key={i} className={`animate-[surge_.35s_ease-out] ${m.rol === "visitante" ? "self-end" : "self-start"} max-w-[88%]`}>
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.rol === "visitante"
                      ? "rounded-br-sm bg-seafoam text-white"
                      : "rounded-bl-sm bg-sand-2"
                  }`}
                >
                  {m.texto}
                </div>
                {(m.foto || m.titulo) && (
                  <div className="mt-2 overflow-hidden rounded-xl border border-ink/10 bg-sand">
                    {m.foto && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.foto} alt={m.titulo ?? "Foto del alojamiento"} className="h-36 w-full object-cover" loading="lazy" />
                    )}
                    {(m.titulo || m.precio) && (
                      <div className="px-3 py-2">
                        {m.titulo && <p className="text-sm font-semibold">{m.titulo}</p>}
                        {m.precio && <p className="text-sm font-bold text-seafoam-text">{m.precio}</p>}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {cargando && (
              <p className="self-start rounded-2xl rounded-bl-sm bg-sand-2 px-3.5 py-2.5 text-sm text-ink-soft">
                Escribiendo…
              </p>
            )}
          </div>
          <div ref={fin} />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {SUGERENCIAS.map((s) => (
            <button
              key={s}
              onClick={() => enviar(s)}
              disabled={cargando}
              className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-coral hover:text-coral disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); enviar(texto); }}
          className="mt-3 flex gap-2"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe tu pregunta…"
            aria-label="Tu mensaje para la asistente"
            className="flex-1 rounded-xl border border-ink/15 bg-sand px-3.5 py-2.5 text-sm outline-none transition focus:border-coral"
          />
          <button
            type="submit"
            disabled={cargando || !texto.trim()}
            className="rounded-xl bg-coral px-5 py-2.5 text-sm font-bold text-white transition hover:bg-coral-bright disabled:opacity-40"
          >
            Enviar
          </button>
        </form>
        <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
          Responde con el catálogo de Lotus 360, que es el que tenemos cargado hoy.
          Con tu posada conectada, respondería igual pero con lo tuyo.
        </p>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Acto 4 */

function ActoConfigurar() {
  const [hace, setHace] = useState<string[]>(["responde", "cotiza", "datos"]);
  const [noHace, setNoHace] = useState<string[]>(["descuentos", "disponibilidad"]);
  const [ofrece, setOfrece] = useState<string[]>(["hospedaje"]);

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) =>
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

  const esFull = useMemo(
    () => HACE.some((o) => o.full && hace.includes(o.id)),
    [hace],
  );
  const precio = esFull ? PLAN_FULL : PLAN_BASICO;

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Ármala a tu gusto</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        Tú decides qué hace y qué no.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        No es un robot con respuestas fijas. Las reglas se escriben en palabras y
        se cambian cuando quieras — así funciona el sistema por dentro.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-5">
          <Grupo titulo="Quiero que…" opciones={HACE} elegidas={hace}
            alternar={(id) => alternar(hace, setHace, id)} color="seafoam" />
          <Grupo titulo="No quiero que…" opciones={NO_HACE} elegidas={noHace}
            alternar={(id) => alternar(noHace, setNoHace, id)} color="coral" />
          <Grupo titulo="Ofrece…" opciones={OFRECE} elegidas={ofrece}
            alternar={(id) => alternar(ofrece, setOfrece, id)} color="seafoam" />
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-ink/10 bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
              Tu plan
            </p>
            <p className="mt-3 flex items-baseline gap-1.5">
              <span
                key={precio}
                className="animate-[surge_.35s_ease-out] font-serif text-5xl tabular-nums text-coral"
              >
                ${precio}
              </span>
              <span className="text-sm font-semibold text-ink-soft">/ mes</span>
            </p>
            <p className="mt-1 text-sm font-semibold">{esFull ? "Plan completo" : "Plan básico"}</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Incluye hasta {esFull ? "2.000" : "500"} conversaciones al mes, la conexión
              con tu Instagram y el soporte de nuestro equipo.
            </p>
            <p className="mt-4 rounded-xl bg-seafoam-bg px-3.5 py-3 text-sm leading-relaxed text-seafoam-text">
              Una noche en tu posada cuesta más o menos lo mismo.{" "}
              <strong>Con una sola reserva que recuperes al mes, el plan ya se pagó.</strong>
            </p>
            <details className="mt-4 text-sm">
              <summary className="cursor-pointer font-semibold text-ink-soft">
                Así queda tu asistente
              </summary>
              <div className="mt-3 flex flex-col gap-2 text-[13px] leading-relaxed text-ink-soft">
                <p>
                  <strong className="text-ink">Hace:</strong>{" "}
                  {HACE.filter((o) => hace.includes(o.id)).map((o) => o.texto.toLowerCase()).join("; ") || "—"}
                </p>
                <p>
                  <strong className="text-ink">Nunca:</strong>{" "}
                  {NO_HACE.filter((o) => noHace.includes(o.id)).map((o) => o.texto.toLowerCase()).join("; ") || "—"}
                </p>
                <p>
                  <strong className="text-ink">Ofrece:</strong>{" "}
                  {OFRECE.filter((o) => ofrece.includes(o.id)).map((o) => o.texto.toLowerCase()).join("; ") || "—"}
                </p>
              </div>
            </details>
          </div>
        </aside>
      </div>
    </section>
  );
}

function Grupo({ titulo, opciones, elegidas, alternar, color }: {
  titulo: string; opciones: Opcion[]; elegidas: string[];
  alternar: (id: string) => void; color: "seafoam" | "coral";
}) {
  const activo = color === "coral"
    ? "border-coral bg-coral/10 text-ink"
    : "border-seafoam bg-seafoam-bg text-seafoam-text";
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{titulo}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {opciones.map((o) => {
          const on = elegidas.includes(o.id);
          return (
            <button
              key={o.id}
              onClick={() => alternar(o.id)}
              aria-pressed={on}
              className={`rounded-xl border px-3.5 py-2 text-left text-sm transition ${
                on ? activo : "border-ink/15 text-ink-soft hover:border-ink/30"
              }`}
            >
              {o.texto}
              {o.full && (
                <span className="ml-2 rounded-full bg-gold/25 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink">
                  Full
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Acto 5 */

interface Perfil {
  es_perfil: boolean;
  tipo: string | null;
  destino: string | null;
  tono: string | null;
  destaca: string[];
  resumen: string | null;
}

function ActoPerfil() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [leyendo, setLeyendo] = useState(false);
  const [errorFoto, setErrorFoto] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  const subir = useCallback(async (file: File) => {
    setErrorFoto("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setErrorFoto("Tiene que ser una imagen JPG, PNG o WEBP.");
      return;
    }
    setLeyendo(true);
    setPerfil(null);
    try {
      const base64 = await achicar(file);
      const res = await fetch("/api/perfil-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen_base64: base64, mime_type: "image/jpeg" }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) {
        setErrorFoto(
          data?.error === "demasiados_intentos"
            ? "Ya subiste varias imágenes. Espera un rato e intenta de nuevo."
            : "No pudimos leer esa imagen. Prueba con otra captura.",
        );
        return;
      }
      setPerfil(data as Perfil);
    } catch {
      setErrorFoto("Se cortó la conexión mientras subíamos la imagen.");
    } finally {
      setLeyendo(false);
    }
  }, []);

  const enviar = useCallback(async () => {
    if (!nombre.trim() || !telefono.trim() || enviando) return;
    setEnviando(true);
    setErrorEnvio("");
    try {
      const res = await fetch("/api/posada", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: nombre.trim(),
          telefono: telefono.trim(),
          destino: perfil?.destino || "Posada interesada",
          consulta: [
            "Interesado en el asistente de atención al cliente.",
            perfil?.resumen ? `Perfil leído por la IA: ${perfil.resumen}` : null,
            perfil?.tipo ? `Tipo: ${perfil.tipo}` : null,
            perfil?.tono ? `Tono: ${perfil.tono}` : null,
            perfil?.destaca?.length ? `Destaca: ${perfil.destaca.join(", ")}` : null,
          ].filter(Boolean).join("\n"),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) { setErrorEnvio("No pudimos registrar tus datos. Intenta de nuevo."); return; }
      setListo(true);
    } catch {
      setErrorEnvio("Se cortó la conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }, [nombre, telefono, perfil, enviando]);

  if (listo) {
    return (
      <section className="py-10 text-center">
        <p className="font-serif text-4xl text-coral">¡Listo!</p>
        <h2 className="mt-4 text-balance font-serif text-3xl leading-tight">
          Te escribimos por WhatsApp.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-ink-soft">
          Ya tenemos lo que armaste. Te vamos a contactar para conectar la
          asistente a tu Instagram y dejarla respondiendo.
        </p>
      </section>
    );
  }

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">Tu negocio</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        Muéstrale tu Instagram y mira qué entiende.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        Sube una captura de tu perfil. En segundos te decimos qué entendió la IA
        de tu negocio: eso mismo es lo que usaría para atender a tus clientes.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div>
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 bg-card p-8 text-center transition hover:border-coral hover:bg-coral/5">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }}
            />
            <span className="text-2xl" aria-hidden>📸</span>
            <span className="font-bold">Sube la captura de tu perfil</span>
            <span className="text-xs text-ink-soft">JPG, PNG o WEBP · se achica sola</span>
          </label>
          {errorFoto && <p className="mt-3 text-sm font-medium text-coral">{errorFoto}</p>}
          {leyendo && <p className="mt-3 text-sm text-ink-soft">Leyendo tu perfil…</p>}

          {perfil && (
            <div className="mt-4 animate-[surge_.4s_ease-out] rounded-2xl border border-ink/10 bg-card p-5">
              {perfil.es_perfil ? (
                <>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-seafoam-text">
                    Esto entendió
                  </p>
                  <p className="mt-3 text-[15px] leading-relaxed">{perfil.resumen}</p>
                  {perfil.destaca.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {perfil.destaca.map((d) => (
                        <span key={d} className="rounded-full bg-seafoam-bg px-2.5 py-1 text-xs font-medium text-seafoam-text">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm leading-relaxed text-ink-soft">
                  Eso no parece un perfil de Instagram. {perfil.resumen}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-ink/10 bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
            ¿Dónde te escribimos?
          </p>
          <div className="mt-4 flex flex-col gap-3">
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre y el de la posada"
              aria-label="Tu nombre y el de la posada"
              className="rounded-xl border border-ink/15 bg-sand px-3.5 py-2.5 text-sm outline-none transition focus:border-coral"
            />
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="WhatsApp"
              inputMode="tel"
              aria-label="Tu número de WhatsApp"
              className="rounded-xl border border-ink/15 bg-sand px-3.5 py-2.5 text-sm outline-none transition focus:border-coral"
            />
            <button
              onClick={enviar}
              disabled={enviando || !nombre.trim() || !telefono.trim()}
              className="rounded-xl bg-coral px-5 py-3 text-sm font-bold text-white transition hover:bg-coral-bright disabled:opacity-40"
            >
              {enviando ? "Enviando…" : "Quiero que me contacten"}
            </button>
            {errorEnvio && <p className="text-sm font-medium text-coral">{errorEnvio}</p>}
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-ink-soft">
            Te contactamos solo por esto. Nada de lo que subas se publica ni se
            comparte con nadie.
          </p>
        </div>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Limites titulo="Sí hace" color="seafoam" items={[
          "Responde a cualquier hora, todos los días",
          "Cotiza con tus precios exactos",
          "Manda la foto que el cliente pide",
          "Te pasa el contacto por WhatsApp",
        ]} />
        <Limites titulo="No hace" color="coral" items={[
          "No cobra ni pide datos de pago",
          "No confirma reservas: eso lo haces tú",
          "No inventa precios ni disponibilidad",
          "No reemplaza a tu gente",
        ]} />
      </div>
    </section>
  );
}

function Limites({ titulo, items, color }: { titulo: string; items: string[]; color: "seafoam" | "coral" }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-card p-5">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{titulo}</p>
      <ul className="mt-3 flex flex-col gap-2">
        {items.map((t) => (
          <li key={t} className="flex gap-2 text-sm leading-relaxed text-ink-soft">
            <span className={color === "coral" ? "text-coral" : "text-seafoam-text"} aria-hidden>
              {color === "coral" ? "✕" : "✓"}
            </span>
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* La captura se achica en el navegador: subir 4 MB para que el modelo mire
   1024px es pagar transferencia y espera para nada. */
async function achicar(file: File, maxLado = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", 0.82).split(",")[1]);
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("imagen ilegible")); };
    img.src = URL.createObjectURL(file);
  });
}
