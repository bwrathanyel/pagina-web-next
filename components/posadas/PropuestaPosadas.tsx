"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CIFRAS, HACE, HORA_ABRE, HORA_CIERRA, INSTALACION, MENSAJES_POR_HORA, NO_HACE,
  OFRECE, PLANES, SUGERENCIAS, TIERS, type IdPlan, type Opcion,
} from "./datos";
import { construirPaleta, cssPaleta, extraerColores, type ColoresMarca } from "./paleta";

/* Recorrido de cinco actos, uno por pantalla. Se avanza por decisión y no por
   scroll: el pedido explícito fue que no se sintiera una página infinita hacia
   abajo.

   TODO el estado vive acá arriba y no dentro de cada acto. Los actos se montan
   y desmontan al navegar, así que cualquier cosa guardada adentro se perdía al
   volver atrás: la conversación de prueba, la captura ya leída, lo que habían
   configurado. Quien retrocede un paso espera encontrar lo que dejó. */

/* "Tu perfil" va ANTES de "Ármala" a propósito: cuando la IA ya leyó el perfil
   sabe cómo se llama el negocio, qué tipo es y de qué color es su marca, y el
   paso de armar deja de ser genérico -- habla de su posada por su nombre y la
   página entera se viste con sus colores. El cierre (nombre y WhatsApp) queda
   al final, que es donde corresponde pedirlo. */
const ACTOS = ["Hola", "La noche", "Pruébala", "Tu perfil", "Ármala"] as const;

/** Marca del bloque de estilos que pinta la página con los colores del cliente.
 *  Es un literal fijo, no viene de ningún dato. */
const MARCA_PALETA = "posada";

export interface Config {
  hace: string[];
  noHace: string[];
  ofrece: string[];
}

export interface MensajeChat {
  rol: "visitante" | "ia";
  texto: string;
  foto?: string | null;
  titulo?: string | null;
  precio?: string | null;
}

export interface Perfil {
  es_perfil: boolean;
  nombre: string | null;
  tipo: string | null;
  destino: string | null;
  tono: string | null;
  destaca: string[];
  resumen: string | null;
  colores?: ColoresMarca | null;
}

/** Una sola opción marcada de las que exigen Pro ya lo activa. Lo usan el
 *  selector de plan y el texto que va al CRM, para que no puedan discrepar. */
export const requierePro = (hace: string[]) =>
  HACE.some((o) => o.full && hace.includes(o.id));

const listar = (opciones: Opcion[], elegidas: string[]) =>
  opciones.filter((o) => elegidas.includes(o.id)).map((o) => o.texto.toLowerCase()).join("; ") || "—";

const miles = (n: number) => n.toLocaleString("es-VE");

/** Primer tier con precio para ese plan. Pro no existe por debajo de 5.000. */
const primerTier = (plan: IdPlan) => TIERS.findIndex((t) => t[plan] !== null);

export function PropuestaPosadas() {
  const [acto, setActo] = useState(0);
  const tope = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<Config>({
    hace: ["responde", "cotiza", "datos"],
    noHace: ["descuentos", "disponibilidad"],
    ofrece: ["hospedaje"],
  });
  const [plan, setPlan] = useState<IdPlan>("basico");
  const [tier, setTier] = useState(0);
  const [chat, setChat] = useState<MensajeChat[]>([]);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [enviado, setEnviado] = useState(false);
  // Que el saludo se cuente solo la primera vez: volver al paso 1 y tener que
  // esperar de nuevo la animación completa es molesto, no bonito.
  const [introVista, setIntroVista] = useState(false);

  const ir = useCallback((n: number) => {
    setActo(Math.max(0, Math.min(ACTOS.length - 1, n)));
    tope.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  /** Marcar una opción de Pro sube el plan sola, y bajar a Básico apaga esas
   *  opciones: si no, el resumen prometería algo que el plan elegido no da. */
  const cambiarConfig = useCallback((nueva: Config) => {
    setConfig(nueva);
    if (requierePro(nueva.hace)) {
      setPlan("pro");
      setTier((t) => Math.max(t, primerTier("pro")));
    }
  }, []);

  const cambiarPlan = useCallback((nuevo: IdPlan) => {
    setPlan(nuevo);
    setTier((t) => Math.max(t, primerTier(nuevo)));
    if (nuevo === "basico") {
      setConfig((c) => ({ ...c, hace: c.hace.filter((id) => !HACE.find((o) => o.id === id)?.full) }));
    }
  }, []);

  const precio = TIERS[tier][plan] ?? TIERS[primerTier(plan)][plan] ?? 0;

  // Los colores de la marca del cliente, ya llevados a un rango legible en cada
  // tema. Solo cuando la IA reconoció un perfil de verdad: si no lo reconoció,
  // lo que devuelva de colores no describe ninguna marca.
  const paleta = perfil?.es_perfil ? construirPaleta(perfil.colores) : null;

  return (
    <div
      ref={tope}
      data-paleta={paleta ? MARCA_PALETA : undefined}
      className="min-h-screen bg-sand text-ink transition-colors duration-700"
    >
      {paleta && (
        <style dangerouslySetInnerHTML={{ __html: cssPaleta(paleta, MARCA_PALETA) }} />
      )}
      <Progreso acto={acto} ir={ir} />
      <main className="mx-auto max-w-5xl px-5 pb-24 pt-6 sm:px-8">
        {acto === 0 && <ActoSaludo vista={introVista} marcarVista={() => setIntroVista(true)} />}
        {acto === 1 && <ActoNoche />}
        {acto === 2 && <ActoPrueba mensajes={chat} setMensajes={setChat} />}
        {acto === 3 && <ActoPerfil perfil={perfil} setPerfil={setPerfil} vestida={!!paleta} />}
        {acto === 4 && (
          <ActoArmar
            perfil={perfil}
            config={config} setConfig={cambiarConfig}
            plan={plan} setPlan={cambiarPlan}
            tier={tier} setTier={setTier} precio={precio}
            nombre={nombre} setNombre={setNombre}
            telefono={telefono} setTelefono={setTelefono}
            enviado={enviado} setEnviado={setEnviado}
          />
        )}
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
                  i <= acto
                    ? "bg-gradient-to-r from-acento to-ambar"
                    : "bg-ink/15 group-hover:bg-ink/30"
                }`}
              />
              <span
                className={`mt-1.5 hidden text-[11px] font-semibold transition-colors sm:block ${
                  i === acto ? "text-acento" : "text-ink-soft"
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
          className="rounded-xl bg-acento px-6 py-3 text-sm font-bold text-sobre-acento shadow-lg shadow-acento/25 transition hover:brightness-110 hover:shadow-xl"
        >
          {["Ver qué pasa esa noche", "Probarla ahora", "Mostrarle mi Instagram", "Armarla a mi gusto"][acto]} →
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Acto 1
   Se abre saludando, no con la cifra en la cara. El problema se arma de a
   pedazos: primero quiénes somos, después qué medimos, y solo al final el
   número que duele. Contarlo todo de golpe hace que no se lea nada. */

const REVELACION = [
  { pausa: 400 },
  { pausa: 1400 },
  { pausa: 1600 },
  { pausa: 1800 },
  { pausa: 1500 },
];

function ActoSaludo({ vista, marcarVista }: { vista: boolean; marcarVista: () => void }) {
  // Si ya la vio, aparece entera. Si el sistema pide menos movimiento, también.
  const [paso, setPaso] = useState(vista ? REVELACION.length : 0);

  useEffect(() => {
    if (paso >= REVELACION.length) { marcarVista(); return; }
    // Con reduced-motion se salta entero, pero igual por el temporizador: el
    // estado inicial no puede depender de matchMedia porque el servidor no lo
    // tiene y la hidratación no coincidiría.
    const directo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(
      () => setPaso(directo ? REVELACION.length : paso + 1),
      directo ? 0 : REVELACION[paso].pausa,
    );
    return () => clearTimeout(t);
  }, [paso, marcarVista]);

  const maximo = Math.max(...MENSAJES_POR_HORA);
  const ver = (n: number) => paso >= n;

  return (
    <section>
      {ver(0) && (
        <p className="animate-[surge_.6s_ease-out] text-xs font-bold uppercase tracking-[0.16em] text-acento">
          Hola 👋
        </p>
      )}

      {ver(1) && (
        <h1 className="mt-4 max-w-2xl animate-[surge_.6s_ease-out] text-balance font-serif text-3xl leading-tight sm:text-5xl">
          Somos Lotus 360. Trabajamos con{" "}
          <span className="text-acento">{CIFRAS.alojamientos} alojamientos</span> en Venezuela.
        </h1>
      )}

      {ver(2) && (
        <p className="mt-6 max-w-xl animate-[surge_.6s_ease-out] text-lg leading-relaxed text-ink-soft">
          Durante veinte días medimos cada mensaje que nos llegó por Instagram.
          Queremos contarte lo que encontramos, porque en tu posada está pasando
          exactamente lo mismo.
        </p>
      )}

      {ver(3) && (
        <div className="mt-9 grid animate-[surge_.6s_ease-out] gap-3 sm:grid-cols-2">
          <Dato
            valor={miles(CIFRAS.conversaciones)}
            texto="personas nos escribieron en veinte días"
            tono="ambar"
          />
          <Dato
            valor={`${CIFRAS.porcentajeFuera}%`}
            texto="de ellas, cuando ya nadie estaba para contestar"
            tono="acento"
            destacado
          />
        </div>
      )}

      {ver(4) && (
        <div className="mt-10 animate-[surge_.7s_ease-out] overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm">
          <div className="border-b border-ink/10 bg-gradient-to-r from-acento-suave to-ambar-suave px-5 py-4 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
              Mensajes por hora · 12 al 31 de julio de 2026
            </p>
            <p className="mt-2 font-serif text-2xl leading-tight sm:text-3xl">
              La hora en que más gente escribe son las{" "}
              <span className="text-acento">nueve de la noche</span>.
            </p>
          </div>
          <div className="p-5 sm:p-7">
            <div
              className="flex h-44 items-end gap-[3px] sm:h-56"
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
                      pico
                        ? "bg-gradient-to-t from-acento to-ambar ring-2 ring-acento/40"
                        : dentro
                          ? "bg-sand-2"
                          : "bg-acento/70"
                    }`}
                    style={{ height: `${(n / maximo) * 100}%`, transitionDelay: `${hora * 28}ms` }}
                    title={`${hora}:00 — ${n} mensajes`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-[11px] tabular-nums text-ink-soft">
              <span>12 a.m.</span><span>6 a.m.</span><span>12 p.m.</span><span>6 p.m.</span><span>11 p.m.</span>
            </div>
            <p className="mt-5 border-t border-ink/10 pt-4 text-sm leading-relaxed text-ink-soft">
              <strong className="text-ink">Más que a las diez de la mañana y más que a las tres de la tarde.</strong>{" "}
              {miles(CIFRAS.fueraDeHorario)} de las {miles(CIFRAS.conversaciones)} conversaciones
              llegaron fuera del horario de oficina, y otras {CIFRAS.finDeSemana} cayeron
              en sábado o domingo.
            </p>
          </div>
        </div>
      )}

      {paso < REVELACION.length && (
        <p className="mt-8 animate-[pulso-suave_1.4s_ease-in-out_infinite] text-sm text-ink-soft" aria-hidden>
          ···
        </p>
      )}
    </section>
  );
}

function Dato({ valor, texto, tono, destacado }: {
  valor: string; texto: string; tono: "acento" | "ambar"; destacado?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        destacado
          ? "border-acento/30 bg-acento-suave"
          : "border-ink/10 bg-card"
      }`}
    >
      <p className={`font-serif text-4xl leading-none tabular-nums sm:text-5xl ${
        tono === "acento" ? "text-acento" : "text-ambar"
      }`}>
        {valor}
      </p>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{texto}</p>
    </div>
  );
}

/* ---------------------------------------------------------------- Acto 2 */

interface Burbuja {
  de: "cliente" | "posada" | "silencio" | "dia";
  texto: string;
  hora?: string;
  /** Milisegundos hasta el mensaje siguiente. Es el ritmo lo que hace que se
   *  lea como una conversación: los mensajes sueltos de alguien que está
   *  escribiendo rápido caen casi encima, y el silencio se hace esperar. */
  pausa?: number;
}

/* Escrita como se escribe de verdad por Instagram: mensajes cortos y seguidos,
   sin puntuación perfecta, corrigiéndose a mitad de camino. El golpe no es que
   la posada no conteste nunca -- es que contesta a la mañana siguiente, bien,
   amable y completa, y ya no sirve de nada. */
const CONVERSACION_PERDIDA: Burbuja[] = [
  { de: "dia", texto: "Domingo" },
  { de: "cliente", texto: "Hola buenas noches 🙌", pausa: 700 },
  { de: "cliente", texto: "Disculpe, ¿tienen disponible para este fin de semana?", pausa: 900 },
  { de: "cliente", texto: "Somos 4 adultos y 2 niños", hora: "9:47 p.m.", pausa: 1100 },
  { de: "cliente", texto: "¿Cuánto sale la noche? 😊", hora: "9:52 p.m.", pausa: 1400 },
  { de: "cliente", texto: "¿Hola? 👀", hora: "10:26 p.m.", pausa: 1800 },
  { de: "silencio", texto: "Visto a las 8:10 a.m. — diez horas después", pausa: 1900 },
  { de: "dia", texto: "Lunes", pausa: 600 },
  { de: "posada", texto: "¡Buenos días! 😊 Sí tenemos disponible para el fin de semana. Le paso los precios y las fotos ahorita mismo", hora: "8:31 a.m.", pausa: 1500 },
  { de: "cliente", texto: "Ya no, gracias 🙏", pausa: 800 },
  { de: "cliente", texto: "Anoche reservamos en otra que nos contestó de una vez", hora: "8:32 a.m." },
];

function ActoNoche() {
  const [visibles, setVisibles] = useState(0);

  useEffect(() => {
    if (visibles >= CONVERSACION_PERDIDA.length) return;
    const directo = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const t = setTimeout(
      () => setVisibles(directo ? CONVERSACION_PERDIDA.length : visibles + 1),
      directo ? 0 : CONVERSACION_PERDIDA[visibles].pausa ?? 800,
    );
    return () => clearTimeout(t);
  }, [visibles]);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-acento">Lo que pasa hoy</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        El mensaje llega cuando la posada ya cerró.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        El cliente no escribe en horario de oficina. Escribe cuando se sienta a
        planear el viaje. Para cuando alguien abre el Instagram a la mañana
        siguiente, ya preguntó en otras tres posadas y alguna le respondió primero.
      </p>

      <div className="mt-9 max-w-md overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-ink/10 px-4 py-3">
          <span className="h-9 w-9 rounded-full bg-gradient-to-br from-ambar via-acento to-seafoam" />
          <span className="flex-1 text-sm font-bold leading-tight">
            Tu posada
            <small className="block font-normal text-ink-soft">Instagram · mensaje directo</small>
          </span>
        </div>

        <div className="flex flex-col gap-1.5 p-4">
          {CONVERSACION_PERDIDA.slice(0, visibles).map((b, i) => {
            if (b.de === "dia") {
              return (
                <p key={i} className="animate-[surge_.3s_ease-out] py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-ink-soft">
                  {b.texto}
                </p>
              );
            }
            if (b.de === "silencio") {
              return (
                <p
                  key={i}
                  className="my-1.5 animate-[surge_.4s_ease-out] rounded-xl bg-[repeating-linear-gradient(-45deg,transparent,transparent_7px,rgba(128,128,128,.12)_7px,rgba(128,128,128,.12)_8px)] py-4 text-center text-xs font-semibold text-ink-soft"
                >
                  {b.texto}
                </p>
              );
            }
            const dePosada = b.de === "posada";
            return (
              <div
                key={i}
                className={`flex flex-col ${dePosada ? "items-end animate-[surge_.4s_ease-out]" : "items-start animate-[entrar-izq_.4s_ease-out]"}`}
              >
                <p
                  className={`max-w-[86%] px-3.5 py-2.5 text-sm leading-relaxed ${
                    dePosada
                      ? "rounded-2xl rounded-br-sm bg-seafoam text-white"
                      : "rounded-2xl rounded-bl-sm bg-sand-2"
                  }`}
                >
                  {b.texto}
                </p>
                {b.hora && (
                  <span className="mt-1 px-1 text-[11px] tabular-nums text-ink-soft">{b.hora}</span>
                )}
              </div>
            );
          })}

          {/* Los puntitos van del lado de quien está por escribir, como en
              cualquier chat: si no, parecen un adorno suelto. */}
          {visibles < CONVERSACION_PERDIDA.length && (
            <span
              className={`animate-[pulso-suave_1.1s_ease-in-out_infinite] px-1 text-lg leading-none text-ink-soft ${
                CONVERSACION_PERDIDA[visibles].de === "posada" ? "self-end" : "self-start"
              }`}
              aria-hidden
            >
              ···
            </span>
          )}
        </div>

        {visibles >= CONVERSACION_PERDIDA.length && (
          <p className="animate-[surge_.5s_ease-out] border-t border-ink/10 bg-acento-suave px-4 py-3 text-center text-xs font-semibold text-ink">
            Contestaste bien. Contestaste tarde.
          </p>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Acto 3 */

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

function ActoPrueba({ mensajes, setMensajes }: {
  mensajes: MensajeChat[];
  setMensajes: React.Dispatch<React.SetStateAction<MensajeChat[]>>;
}) {
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
        body: JSON.stringify({ mensaje: limpio, session_id: sesion.current }),
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
  }, [cargando, setMensajes]);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-acento">Pruébala ahora</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        Escríbele como si fueras un cliente.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        Esta es la asistente de verdad, no un video ni una demo grabada.
        Pregúntale lo que te preguntaría alguien a las nueve de la noche.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-ink/10 bg-card shadow-sm">
        <div className="h-1 bg-gradient-to-r from-acento via-ambar to-seafoam" />
        <div className="p-4 sm:p-5">
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
                <p className="animate-[pulso-suave_1.2s_ease-in-out_infinite] self-start rounded-2xl rounded-bl-sm bg-sand-2 px-3.5 py-2.5 text-sm text-ink-soft">
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
                className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-acento hover:text-acento disabled:opacity-40"
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
              aria-label="Escribe tu pregunta"
              className="flex-1 rounded-xl border border-ink/15 bg-sand px-3.5 py-2.5 text-sm outline-none transition focus:border-acento"
            />
            <button
              type="submit"
              disabled={cargando || !texto.trim()}
              className="rounded-xl bg-acento px-5 py-2.5 text-sm font-bold text-sobre-acento transition hover:brightness-110 disabled:opacity-40"
            >
              Enviar
            </button>
          </form>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        Responde con un catálogo cargado. Con el tuyo conectado, respondería
        igual pero con tus habitaciones, tus fotos y tus precios.
      </p>
    </section>
  );
}

/* ---------------------------------------------------------------- Acto 4
   La captura del perfil. Va antes de armar el plan porque es lo que hace que
   el paso siguiente hable de SU posada: el nombre, el tipo y los colores de su
   marca salen de acá. */

function ActoPerfil({ perfil, setPerfil, vestida }: {
  perfil: Perfil | null;
  setPerfil: (p: Perfil | null) => void;
  vestida: boolean;
}) {
  const [leyendo, setLeyendo] = useState(false);
  const [error, setError] = useState("");

  const subir = useCallback(async (file: File) => {
    setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Tiene que ser una imagen JPG, PNG o WEBP.");
      return;
    }
    setLeyendo(true);
    setPerfil(null);
    try {
      const { base64, colores } = await achicar(file);
      const res = await fetch("/api/perfil-instagram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagen_base64: base64, mime_type: "image/jpeg" }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) {
        setError(
          data?.error === "demasiados_intentos"
            ? "Ya subiste varias imágenes. Espera un rato e intenta de nuevo."
            : "No pudimos leer esa imagen. Prueba con otra captura.",
        );
        return;
      }
      // Los colores medidos de los píxeles mandan sobre los que nombró el
      // modelo. Los del modelo quedan de reserva por si la captura fuera casi
      // toda gris y no hubiera nada que medir.
      setPerfil({ ...(data as Perfil), colores: colores ?? data.colores ?? null });
    } catch {
      setError("Se cortó la conexión mientras subíamos la imagen.");
    } finally {
      setLeyendo(false);
    }
  }, [setPerfil]);

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-acento">Tu negocio</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        Muéstrale tu Instagram y mira qué entiende.
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        Sube una captura de tu perfil. En segundos te decimos qué entendió de tu
        negocio — y si reconoce los colores de tu marca, esta misma página se
        pone de esos colores.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <label className="group flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-ink/20 bg-card px-5 py-10 text-center transition hover:-translate-y-0.5 hover:border-acento hover:shadow-lg">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) subir(f); }}
            />
            <span className="text-3xl transition group-hover:scale-110" aria-hidden>📸</span>
            <span className="text-sm font-bold">Sube la captura de tu perfil</span>
            <span className="text-xs text-ink-soft">JPG, PNG o WEBP · se achica sola</span>
          </label>

          {leyendo && (
            <div className="animate-[surge_.3s_ease-out] rounded-2xl border border-ink/10 bg-card p-5">
              <p className="animate-[pulso-suave_1.2s_ease-in-out_infinite] text-sm font-bold text-acento">
                Mirando tu perfil…
              </p>
              <div className="mt-4 flex flex-col gap-2.5" aria-hidden>
                {[100, 78, 88].map((ancho, i) => (
                  <span
                    key={i}
                    className="block h-3 animate-[pulso-suave_1.4s_ease-in-out_infinite] rounded-full bg-sand-2"
                    style={{ width: `${ancho}%`, animationDelay: `${i * 180}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-acento">{error}</p>}

          {perfil && !perfil.es_perfil && (
            <p className="animate-[surge_.4s_ease-out] rounded-xl border border-ink/10 bg-card p-4 text-sm leading-relaxed text-ink-soft">
              {perfil.resumen || "Eso no parece un perfil de Instagram."}
            </p>
          )}
        </div>

        {perfil?.es_perfil ? (
          <div className="animate-[surge_.5s_ease-out] overflow-hidden rounded-2xl border border-acento/25 bg-card shadow-lg">
            {/* Fondo `acento-suave` y no un degradado de acento a ámbar: con la
                paleta del cliente el degradado podía terminar en un amarillo
                claro y el texto encima dejaba de leerse. Este par --fondo suave
                y texto acento-- mantiene el contraste con cualquier marca. */}
            <div className="border-b border-acento/20 bg-acento-suave px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
                Esto entendió la IA
              </p>
              {perfil.nombre && (
                <p className="mt-1 font-serif text-2xl leading-tight text-acento">{perfil.nombre}</p>
              )}
            </div>
            <div className="p-5">
              {perfil.resumen && (
                <p className="text-sm leading-relaxed">{perfil.resumen}</p>
              )}
              <dl className="mt-4 flex flex-col gap-1.5 text-sm text-ink-soft">
                {perfil.tipo && <Fila termino="Tipo" valor={perfil.tipo} />}
                {perfil.destino && <Fila termino="Dónde" valor={perfil.destino} />}
                {perfil.tono && <Fila termino="Tono" valor={perfil.tono} />}
                {perfil.destaca?.length > 0 && <Fila termino="Destaca" valor={perfil.destaca.join(", ")} />}
              </dl>

              {vestida && (
                <div className="mt-5 animate-[surge_.6s_ease-out] rounded-xl border border-acento/20 bg-acento-suave p-4">
                  <p className="text-sm font-bold">Y le tomamos prestados tus colores.</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                    Esta página se acaba de vestir con ellos. Así de tuya se vería
                    la asistente atendiendo a tu gente.
                  </p>
                  <div className="mt-3 flex gap-2" aria-hidden>
                    <span className="h-8 flex-1 animate-[saltar_.5s_ease-out] rounded-lg bg-acento" />
                    <span className="h-8 flex-1 animate-[saltar_.5s_ease-out_.1s_backwards] rounded-lg bg-ambar" />
                    <span className="h-8 flex-1 animate-[saltar_.5s_ease-out_.2s_backwards] rounded-lg bg-acento-suave ring-1 ring-inset ring-ink/10" />
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-3 rounded-2xl border border-dashed border-ink/15 p-6 text-sm leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">¿Para qué sirve esto?</strong> Lo que la
              IA entienda de tu perfil es exactamente lo que usaría para atender a
              tus clientes. Si acierta acá, acierta con ellos.
            </p>
            <p>
              Es opcional: puedes seguir sin subir nada y lo vemos juntos después.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- Acto 5
   Armar la asistente, elegir plan y cerrar. Es el último paso porque acá es
   donde se piden los datos de contacto. */

function ActoArmar({
  perfil, config, setConfig, plan, setPlan, tier, setTier, precio,
  nombre, setNombre, telefono, setTelefono, enviado, setEnviado,
}: {
  perfil: Perfil | null;
  config: Config; setConfig: (c: Config) => void;
  plan: IdPlan; setPlan: (p: IdPlan) => void;
  tier: number; setTier: React.Dispatch<React.SetStateAction<number>>;
  precio: number;
  nombre: string; setNombre: (v: string) => void;
  telefono: string; setTelefono: (v: string) => void;
  enviado: boolean; setEnviado: (v: boolean) => void;
}) {
  const { hace, noHace, ofrece } = config;
  const suyo = perfil?.es_perfil ? perfil : null;
  // El nombre del negocio se usa en el texto, así que se limita: viene de un
  // modelo mirando una captura y podría traer cualquier cosa larga.
  const comoSeLlama = suyo?.nombre?.slice(0, 40) || null;

  const alternar = (clave: keyof Config, id: string) => {
    const lista = config[clave];
    setConfig({
      ...config,
      [clave]: lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id],
    });
  };

  return (
    <section>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-acento">Ármala a tu gusto</p>
      <h2 className="mt-3 max-w-2xl text-balance font-serif text-3xl leading-tight sm:text-4xl">
        {comoSeLlama
          ? <>Así atendería <span className="text-acento">{comoSeLlama}</span>.</>
          : "Tú decides qué hace y qué no."}
      </h2>
      <p className="mt-5 max-w-xl text-ink-soft">
        {suyo
          ? <>Ya sabemos que eres {suyo.tipo ?? "un alojamiento"}
              {suyo.destino ? ` en ${suyo.destino}` : ""}. Ahora dinos cómo quieres
              que trate a quien te escriba. Solo habla de lo tuyo: nunca ofrece
              otro alojamiento.</>
          : <>No es un robot con respuestas fijas. Las reglas se escriben en
              palabras y se cambian cuando quieras. Solo habla de lo tuyo: nunca
              ofrece otro alojamiento.</>}
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <Grupo titulo="Quiero que…" opciones={HACE} elegidas={hace}
          alternar={(id) => alternar("hace", id)} color="seafoam" />
        <Grupo titulo="No quiero que…" opciones={NO_HACE} elegidas={noHace}
          alternar={(id) => alternar("noHace", id)} color="acento" />
        <Grupo titulo="Ofrece…" opciones={OFRECE} elegidas={ofrece}
          alternar={(id) => alternar("ofrece", id)} color="seafoam" />
      </div>

      <div className="mt-14">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-acento">Tu plan</p>
        <h3 className="mt-3 text-balance font-serif text-2xl leading-tight sm:text-3xl">
          Elige cuántos mensajes al mes.
        </h3>
        <p className="mt-4 max-w-xl text-ink-soft">
          Un mensaje es cada vez que alguien te escribe o la asistente le
          responde. Una conversación completa suele llevarse unos veinte.
        </p>

        <SelectorMensajes plan={plan} tier={tier} setTier={setTier} />

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {PLANES.map((p) => (
            <FichaPlan
              key={p.id}
              plan={p}
              elegido={plan === p.id}
              precio={TIERS[tier][p.id]}
              mensajes={TIERS[tier].mensajes}
              alElegir={() => setPlan(p.id)}
              destacado={p.id === "pro"}
            />
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-acento/25 bg-acento-suave p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
              Lo que pagarías
            </p>
            <p className="mt-2 flex items-baseline gap-1.5">
              <span key={precio} className="animate-[saltar_.4s_ease-out] font-serif text-5xl tabular-nums text-acento">
                ${precio}
              </span>
              <span className="text-sm font-semibold text-ink-soft">/ mes</span>
            </p>
            <p className="mt-1 text-sm font-semibold">
              Plan {plan === "pro" ? "Pro" : "Básico"} · {miles(TIERS[tier].mensajes)} mensajes al mes
            </p>
          </div>
          <div className="max-w-xs text-sm leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">${INSTALACION} de instalación, una sola vez</strong> —
              y el primer mes va incluido. Conectamos tu Instagram, cargamos tus
              habitaciones y escribimos tus reglas.
            </p>
          </div>
        </div>

        <p className="mt-5 rounded-xl bg-seafoam-bg px-4 py-4 text-sm leading-relaxed text-seafoam-text">
          <strong>Nos gusta trabajar contigo.</strong> Somos un equipo pequeño en
          Venezuela, igual que tú, y lo armamos primero para nosotros. Si algo no
          te encaja, se cambia — de eso se trata.
        </p>

        <Cierre
          nombre={nombre} setNombre={setNombre}
          telefono={telefono} setTelefono={setTelefono}
          enviado={enviado} setEnviado={setEnviado}
          config={config} plan={plan} precio={precio}
          mensajes={TIERS[tier].mensajes} perfil={suyo}
          comoSeLlama={comoSeLlama}
        />
      </div>
    </section>
  );
}

/** Las flechitas de mensajes. Solo se mueve entre los tiers que el plan
 *  elegido tiene: en Pro los dos primeros no existen. */
function SelectorMensajes({ plan, tier, setTier }: {
  plan: IdPlan; tier: number; setTier: React.Dispatch<React.SetStateAction<number>>;
}) {
  const minimo = primerTier(plan);
  const mover = (paso: number) =>
    setTier((t) => Math.max(minimo, Math.min(TIERS.length - 1, t + paso)));

  return (
    <div className="mt-6 overflow-hidden rounded-2xl border border-ink/10 bg-card">
      <div className="h-1 bg-gradient-to-r from-acento via-ambar to-seafoam" />
      <div className="flex items-center justify-center gap-4 p-4">
        <button
          onClick={() => mover(-1)}
          disabled={tier <= minimo}
          aria-label="Menos mensajes al mes"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-lg font-bold text-ink-soft transition hover:scale-110 hover:border-acento hover:text-acento disabled:opacity-30 disabled:hover:scale-100"
        >
          ←
        </button>
        <div className="min-w-[9.5rem] text-center">
          <p key={TIERS[tier].mensajes} className="animate-[saltar_.35s_ease-out] font-serif text-3xl tabular-nums">
            {miles(TIERS[tier].mensajes)}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            mensajes al mes
          </p>
        </div>
        <button
          onClick={() => mover(1)}
          disabled={tier >= TIERS.length - 1}
          aria-label="Más mensajes al mes"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-lg font-bold text-ink-soft transition hover:scale-110 hover:border-acento hover:text-acento disabled:opacity-30 disabled:hover:scale-100"
        >
          →
        </button>
      </div>
    </div>
  );
}

function FichaPlan({ plan, elegido, precio, mensajes, alElegir, destacado }: {
  plan: (typeof PLANES)[number];
  elegido: boolean;
  precio: number | null;
  mensajes: number;
  alElegir: () => void;
  destacado?: boolean;
}) {
  // Pro no existe por debajo de 5.000 mensajes, pero la ficha NO se desactiva:
  // apagada obligaba a adivinar que primero hay que subir los mensajes con las
  // flechas. Se puede elegir igual y el tier sube solo hasta donde el plan
  // arranca -- que además es la clase de movimiento que la página promete.
  const disponible = precio !== null;
  const desde = TIERS[primerTier("pro")].pro;
  return (
    <button
      onClick={alElegir}
      aria-pressed={elegido}
      className={`flex flex-col rounded-2xl border p-6 text-left transition duration-300 ${
        elegido
          ? "-translate-y-1 border-acento bg-card shadow-xl shadow-acento/15 ring-2 ring-acento/30"
          : "border-ink/10 bg-card hover:-translate-y-0.5 hover:border-ink/25 hover:shadow-lg"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="font-serif text-2xl">{plan.nombre}</span>
        {destacado && (
          <span className="rounded-full bg-ambar-suave px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ambar">
            Completo
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-ink-soft">{plan.gancho}</p>

      <p className="mt-5 flex items-baseline gap-1.5">
        {disponible ? (
          <>
            <span key={precio} className="animate-[saltar_.4s_ease-out] font-serif text-4xl tabular-nums text-acento">
              ${precio}
            </span>
            <span className="text-sm font-semibold text-ink-soft">/ mes</span>
          </>
        ) : (
          <>
            <span className="text-sm font-semibold text-ink-soft">desde</span>
            <span className="font-serif text-4xl tabular-nums text-acento">${desde}</span>
            <span className="text-sm font-semibold text-ink-soft">/ mes</span>
          </>
        )}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
        {miles(disponible ? mensajes : TIERS[primerTier("pro")].mensajes)} mensajes al mes
      </p>

      <ul className="mt-5 flex flex-col gap-2 border-t border-ink/10 pt-4">
        {plan.incluye.map((linea) => (
          <li key={linea} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span aria-hidden className="text-seafoam-text">✓</span>
            <span>{linea}</span>
          </li>
        ))}
      </ul>

      <span
        className={`mt-6 rounded-xl px-4 py-2.5 text-center text-sm font-bold transition ${
          elegido ? "bg-acento text-sobre-acento" : "border border-ink/15 text-ink-soft"
        }`}
      >
        {elegido ? "Elegido ✓" : disponible ? "Elegir este" : `Elegir Pro · ${miles(TIERS[primerTier("pro")].mensajes)} mensajes`}
      </span>
    </button>
  );
}

function Grupo({ titulo, opciones, elegidas, alternar, color }: {
  titulo: string; opciones: Opcion[]; elegidas: string[];
  alternar: (id: string) => void; color: "seafoam" | "acento";
}) {
  const activo = color === "acento"
    ? "border-acento bg-acento-suave text-ink"
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
              className={`rounded-xl border px-3.5 py-2 text-left text-sm transition duration-200 hover:-translate-y-0.5 ${
                on ? `${activo} shadow-sm` : "border-ink/15 text-ink-soft hover:border-ink/30"
              }`}
            >
              {on && <span aria-hidden className="mr-1.5 animate-[saltar_.3s_ease-out] inline-block">✓</span>}
              {o.texto}
              {o.full && (
                <span className="ml-2 rounded-full bg-ambar-suave px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ambar">
                  Pro
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* El cierre: los datos de contacto y el envío del lead al CRM. */

function Cierre({
  nombre, setNombre, telefono, setTelefono, enviado, setEnviado,
  config, plan, precio, mensajes, perfil, comoSeLlama,
}: {
  nombre: string; setNombre: (v: string) => void;
  telefono: string; setTelefono: (v: string) => void;
  enviado: boolean; setEnviado: (v: boolean) => void;
  config: Config; plan: IdPlan; precio: number; mensajes: number;
  perfil: Perfil | null; comoSeLlama: string | null;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  const enviar = useCallback(async () => {
    if (!nombre.trim() || !telefono.trim() || enviando) return;
    setEnviando(true);
    setError("");
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
            // El plan, el tier y la configuración van en el mismo texto: el CRM
            // los lee de acá para mostrarlos en "IA Atención al Cliente".
            `Plan: ${plan === "pro" ? "Pro" : "Básico"} — $${precio}/mes, ${miles(mensajes)} mensajes`,
            `Instalación: $${INSTALACION} (primer mes incluido)`,
            `Quiere que: ${listar(HACE, config.hace)}`,
            `No quiere que: ${listar(NO_HACE, config.noHace)}`,
            `Ofrece: ${listar(OFRECE, config.ofrece)}`,
            // `perfil` acá ya viene filtrado: solo llega cuando la IA reconoció
            // un perfil de verdad. Si no lo reconoció, `resumen` traería el
            // motivo del rechazo y en el CRM se leería como la descripción del
            // negocio.
            perfil?.nombre ? `Negocio: ${perfil.nombre}` : null,
            perfil?.resumen ? `Perfil leído por la IA: ${perfil.resumen}` : null,
            perfil?.tipo ? `Tipo: ${perfil.tipo}` : null,
            perfil?.tono ? `Tono: ${perfil.tono}` : null,
            perfil?.destaca?.length ? `Destaca: ${perfil.destaca.join(", ")}` : null,
          ].filter(Boolean).join("\n"),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.ok) { setError("No pudimos registrar tus datos. Intenta de nuevo."); return; }
      setEnviado(true);
    } catch {
      setError("Se cortó la conexión. Intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  }, [nombre, telefono, enviando, config, plan, precio, mensajes, perfil, setEnviado]);

  if (enviado) {
    return (
      <div className="mt-8 animate-[surge_.5s_ease-out] overflow-hidden rounded-2xl border border-acento/25 bg-card text-center shadow-lg">
        <div className="h-1.5 bg-gradient-to-r from-acento via-ambar to-seafoam" />
        <div className="px-6 py-10">
          <p className="animate-[saltar_.5s_ease-out] font-serif text-4xl text-acento">¡Listo!</p>
          <h3 className="mt-4 text-balance font-serif text-2xl leading-tight">
            Te escribimos por WhatsApp.
          </h3>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-soft">
            Ya tenemos lo que armaste{comoSeLlama ? ` para ${comoSeLlama}` : ""}. Te
            contactamos para conectar la asistente a tu Instagram y dejarla
            respondiendo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-2xl border border-ink/10 bg-card p-5 sm:p-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
        ¿Dónde te escribimos?
      </p>
      <h3 className="mt-2 text-balance font-serif text-2xl leading-tight">
        {comoSeLlama ? `Dejémosla lista para ${comoSeLlama}.` : "Dejémosla lista para ti."}
      </h3>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Tu nombre y el de la posada"
          aria-label="Tu nombre y el de la posada"
          className="rounded-xl border border-ink/15 bg-sand px-3.5 py-3 text-sm outline-none transition focus:border-acento"
        />
        <input
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="WhatsApp"
          inputMode="tel"
          aria-label="Tu número de WhatsApp"
          className="rounded-xl border border-ink/15 bg-sand px-3.5 py-3 text-sm outline-none transition focus:border-acento"
        />
      </div>
      <button
        onClick={enviar}
        disabled={enviando || !nombre.trim() || !telefono.trim()}
        className="mt-4 w-full rounded-xl bg-acento px-5 py-3.5 text-sm font-bold text-sobre-acento shadow-lg shadow-acento/20 transition hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
      >
        {enviando ? "Enviando…" : "Quiero que me contacten"}
      </button>
      {error && <p className="mt-3 text-sm font-medium text-acento">{error}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-soft">
        Te contactamos solo por esto. Nada de lo que subas se publica ni se
        comparte con nadie.
      </p>
    </div>
  );
}

function Fila({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-bold">{termino}:</dt>
      <dd>{valor}</dd>
    </div>
  );
}

/** Achica la captura antes de mandarla: una foto de teléfono son varios MB y
 *  el modelo no necesita más de 1024px de lado para leer un perfil.
 *
 *  De paso mide los colores sobre el mismo lienzo, que es el momento en que la
 *  imagen ya está decodificada y en memoria. */
async function achicar(file: File, maxLado = 1024): Promise<{ base64: string; colores: ColoresMarca | null }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const escala = Math.min(1, maxLado / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * escala);
      c.height = Math.round(img.height * escala);
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve({
        base64: c.toDataURL("image/jpeg", 0.82).split(",")[1],
        colores: extraerColores(c),
      });
    };
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error("imagen ilegible")); };
    img.src = URL.createObjectURL(file);
  });
}
