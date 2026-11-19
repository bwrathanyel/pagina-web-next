"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Icono } from "@/components/ui/Icono";
import { TableroSalidas } from "@/components/ui/TableroSalidas";
import { hoyCaracas, sumarDias } from "@/lib/cotizador/cotizacionRapida";

// Calendario propio: el de <input type="date"> en Chromium no se puede
// estilizar. Es un popover (capa superior: la foto del hero no lo recorta, y
// Esc y el clic afuera lo cierran solos). La fecha viaja en un input oculto con
// el mismo name, así el formulario GET no cambia. Nada antes de `min` (hoy en
// Caracas si no se pasa). Con `rango` se pinta la estadía como una banda
// continua en seafoam (no naranja: se confundía con el rojo de las noches sin
// cupo). Todo se calcula en UTC para que la zona del navegador no corra un día.
//
// Movimiento (2026-11-19, pedido del dueño): el panel se despliega como una
// paleta del tablero, el cartel con el rótulo («ENTRADA») gira letra por letra
// como el del hero y los días caen en diagonal. Entrada → salida no salta:
// quien llama pide `seguirCon(idSalida)` dentro de su onCambio; este panel se va
// hacia la derecha y el de salida entra desde la izquierda con su cartel girando
// de «ENTRADA» a «SALIDA». Con reduced-motion todo es instantáneo.

const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const MES = new Intl.DateTimeFormat("es-VE", { month: "long", year: "numeric", timeZone: "UTC" });
const CORTA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" });
const CON_ANO = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const LARGA = new Intl.DateTimeFormat("es-VE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const PASOS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
/** Lo que tarda el panel en irse (globals.css: retraso + --dur-media) antes de abrir el siguiente. */
const PASE_MS = 400;

const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const nochesEntre = (a: string, b: string) => Math.round((aFecha(b).getTime() - aFecha(a).getTime()) / 864e5);

let siguiente = "";
/** Dentro del onCambio de un SelectorFecha: al cerrarse, abrir con transición el calendario cuyo botón tiene este id. */
export function seguirCon(idBoton: string) {
  siguiente = idBoton;
}
function tomarSiguiente() {
  const id = siguiente;
  siguiente = "";
  return id;
}

function moverMes(mes: string, n: number) {
  const d = aFecha(`${mes}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
}

/** Celdas del mes "AAAA-MM": null para los huecos antes del día 1. */
function celdas(mes: string): (string | null)[] {
  const primero = aFecha(`${mes}-01`);
  const total = new Date(Date.UTC(primero.getUTCFullYear(), primero.getUTCMonth() + 1, 0)).getUTCDate();
  return [
    ...Array<null>(primero.getUTCDay()).fill(null),
    ...Array.from({ length: total }, (_, k) => `${mes}-${String(k + 1).padStart(2, "0")}`),
  ];
}

const FLECHA =
  "flex h-11 w-11 md:h-9 md:w-9 items-center justify-center rounded-control text-ink transition-colors duration-150 ease-salida " +
  "enabled:hover:bg-sand-2 disabled:text-ink-soft/40";

export type SinCupo = { dia: (iso: string) => boolean; leyenda: string };
type Rango = { desde: string; hasta: string };

interface Props {
  id: string;
  name: string;
  /** Nombre visible del campo ("Entrada", "Ida"...): arma el nombre accesible y el cartel del panel. */
  etiqueta: string;
  valor: string;
  onCambio: (iso: string) => void;
  min?: string;
  rango?: Rango;
  /** Noches sin cupo (stop sale del hotel): van en rojo, con su leyenda,
   * y no se pueden elegir; intentarlo deja un aviso dentro del calendario. */
  sinCupo?: SinCupo;
  /** Calendario de salida: la entrada elegida. La salida sí puede caer en una
   * noche sin cupo (esa noche no se duerme), pero no después de ella. */
  salidaDe?: string;
  /** Texto sin fecha elegida: en tramos angostos, uno más corto. */
  vacio?: string;
  className?: string;
}

export function SelectorFecha({
  id,
  name,
  etiqueta,
  valor,
  onCambio,
  min,
  rango,
  sinCupo,
  salidaDe,
  vacio = "Cualquier fecha",
  className = "",
}: Props) {
  const [mes, setMes] = useState("");
  const [foco, setFoco] = useState("");
  const [aviso, setAviso] = useState("");
  const [aperturas, setAperturas] = useState(0);
  const [cartel, setCartel] = useState("");
  /** Día bajo el puntero o el foco en el calendario de salida: adelanta la estadía. */
  const [sobre, setSobre] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const grilla = useRef<HTMLDivElement>(null);
  const enfocar = useRef(false);
  const idPanel = useId();
  const ancla = `--fecha-${idPanel.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hoy = hoyCaracas();
  const piso = min && min > hoy ? min : hoy;
  const largoCartel = Math.max(8, etiqueta.length);

  // Solo el teclado y la apertura mueven el foco a la grilla: con las flechas
  // de mes, el foco se queda en la flecha para poder avanzar varios meses.
  useEffect(() => {
    if (!enfocar.current) return;
    enfocar.current = false;
    grilla.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [foco, mes, aperturas]);

  function alCambiar(abierto: boolean) {
    const p = panel.current;
    if (!abierto) {
      if (p) {
        delete p.dataset.pasa;
        delete p.dataset.llega;
      }
      setSobre("");
      return;
    }
    const base = valor && valor >= piso ? valor : piso;
    enfocar.current = true;
    setFoco(base);
    setMes(base.slice(0, 7));
    setAperturas((n) => n + 1);
    setAviso("");
    // El cartel arranca en blanco (o en el rótulo del calendario anterior) y gira al propio.
    setCartel(p?.dataset.llega ?? "");
    requestAnimationFrame(() => setCartel(etiqueta));
  }

  function cambiarMes(n: number) {
    const nuevo = moverMes(mes, n);
    const primero = `${nuevo}-01`;
    setMes(nuevo);
    setFoco(primero < piso ? piso : primero);
    setAviso("");
  }

  function elegir(iso: string) {
    tomarSiguiente();
    onCambio(iso);
    const idSig = tomarSiguiente();
    const p = panel.current;
    const sig = iso && idSig ? (document.getElementById(idSig) as HTMLButtonElement | null) : null;
    if (!p || !sig) return p?.hidePopover();
    const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
    p.dataset.pasa = "";
    window.setTimeout(
      () => {
        // Si lo cerró a mano mientras se iba (Esc, clic afuera), no se abre el siguiente.
        if (!p.matches(":popover-open")) return;
        p.hidePopover();
        const destino = sig.popoverTargetElement as HTMLElement | null;
        if (destino && !quieto) destino.dataset.llega = etiqueta;
        sig.click();
      },
      quieto ? 0 : PASE_MS,
    );
  }

  // Salida: la primera noche sin cupo desde la entrada es el tope; se puede
  // salir ese día, no después. Solo se calcula con el calendario abierto.
  let tope = "";
  if (mes && sinCupo && salidaDe) {
    for (let k = 0, n = salidaDe; k < 400 && !tope; k++, n = sumarDias(n, 1)) if (sinCupo.dia(n)) tope = n;
  }

  /** "lleno": noche sin cupo (rojo). "cruza": la estadía pasaría por una. */
  function bloqueo(iso: string): "" | "lleno" | "cruza" {
    if (!sinCupo || iso < piso) return "";
    if (salidaDe !== undefined) {
      if (!tope || iso <= tope) return "";
      return sinCupo.dia(iso) ? "lleno" : "cruza";
    }
    return sinCupo.dia(iso) ? "lleno" : "";
  }

  function intentar(iso: string) {
    const b = bloqueo(iso);
    if (!b) return elegir(iso);
    setAviso(
      b === "lleno"
        ? "Esa fecha no está disponible en este hotel."
        : "Entre la entrada y esa fecha hay noches sin disponibilidad en este hotel.",
    );
  }

  function teclas(e: KeyboardEvent<HTMLDivElement>) {
    const paso = PASOS[e.key];
    if (!paso) return;
    e.preventDefault();
    const nuevo = sumarDias(foco, paso);
    if (nuevo < piso) return;
    enfocar.current = true;
    setFoco(nuevo);
    setMes(nuevo.slice(0, 7));
  }

  // Lo que se pinta: la estadía elegida o, en la salida, la que quedaría con el día bajo el puntero.
  const previa = !!salidaDe && !!sobre && sobre > salidaDe && sobre >= piso && !bloqueo(sobre);
  const vista: Rango | undefined = previa ? { desde: salidaDe, hasta: sobre } : rango?.desde && rango.hasta ? rango : undefined;
  const noches = vista ? nochesEntre(vista.desde, vista.hasta) : 0;

  function clasesDia(iso: string, b: "" | "lleno" | "cruza") {
    const borde = vista ? (iso === vista.desde ? " rounded-r-none" : iso === vista.hasta ? " rounded-l-none" : "") : "";
    if (iso === valor && !previa) return `bg-seafoam-text font-semibold text-card${borde}${b ? " ring-2 ring-inset ring-peligro" : ""}`;
    if (b === "lleno") return "cursor-not-allowed bg-peligro font-medium text-card line-through";
    if (b === "cruza") return "cursor-not-allowed text-ink-soft/35";
    if (previa && iso === sobre) return `bg-seafoam-bg font-semibold text-seafoam-text ring-2 ring-inset ring-seafoam-text${borde}`;
    if (vista && (iso === vista.desde || iso === vista.hasta)) return `bg-seafoam-text font-semibold text-card${borde}`;
    if (vista && iso > vista.desde && iso < vista.hasta) return "rounded-none bg-seafoam-bg text-ink";
    if (iso === hoy) return "font-semibold text-acento ring-1 ring-inset ring-acento/50 hover:bg-acento-suave";
    return "enabled:hover:bg-sand-2 disabled:text-ink-soft/35";
  }

  const texto = valor ? (valor.slice(0, 4) === hoy.slice(0, 4) ? CORTA : CON_ANO).format(aFecha(valor)) : vacio;

  return (
    <>
      <button
        id={id}
        type="button"
        popoverTarget={idPanel}
        aria-label={`${etiqueta}: ${texto}`}
        style={{ anchorName: ancla } as CSSProperties}
        className={`flex items-center gap-2 text-left ${className}`}
      >
        <span key={texto} className={`valor-cambia min-w-0 truncate ${valor ? "" : "font-medium text-ink-soft"}`}>
          {texto}
        </span>
        <Icono nombre="calendario" tamano={18} className="ml-auto shrink-0 text-ink-soft" />
      </button>
      <input type="hidden" name={name} value={valor} disabled={!valor} />

      <div
        ref={panel}
        id={idPanel}
        popover="auto"
        role="dialog"
        aria-label={etiqueta === "Fecha" ? "Elegir fecha" : `Elegir fecha de ${etiqueta.toLowerCase()}`}
        onToggle={(e) => alCambiar(e.newState === "open")}
        style={{ positionAnchor: ancla } as CSSProperties}
        className="calendario-flotante w-[min(22rem,calc(100vw-1rem))] md:w-[19.5rem] rounded-card bg-card p-4 text-ink shadow-chrome"
      >
        {mes && (
          <>
            <div className="mb-3 flex items-center justify-between gap-3">
              <TableroSalidas key={aperturas} texto={cartel} largo={largoCartel} className="text-sm" />
              {salidaDe || noches > 0 ? (
                <p className="flex flex-col items-end text-right font-mono text-xs leading-snug text-ink-soft">
                  {salidaDe ? <span>Entrada {CORTA.format(aFecha(salidaDe))}</span> : null}
                  {noches > 0 ? (
                    <span key={noches} className="monto-flap font-bold text-seafoam-text">
                      {noches} {noches === 1 ? "noche" : "noches"}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </div>

            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                disabled={mes <= piso.slice(0, 7)}
                aria-label="Mes anterior"
                className={FLECHA}
              >
                <Icono nombre="chevron-izq" tamano={20} />
              </button>
              <p key={mes} aria-live="polite" className="monto-flap font-semibold first-letter:uppercase">
                {MES.format(aFecha(`${mes}-01`))}
              </p>
              <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className={FLECHA}>
                <Icono nombre="chevron-der" tamano={20} />
              </button>
            </div>

            <div aria-hidden className="mb-1 grid grid-cols-7 text-center text-xs font-medium text-ink-soft">
              {DIAS.map((d) => (
                <span key={d} className="py-1">
                  {d}
                </span>
              ))}
            </div>

            {/* key = mes: al cambiar de mes los días vuelven a caer en cascada. Sin hueco horizontal: la estadía es una banda. */}
            <div
              key={mes}
              ref={grilla}
              onKeyDown={teclas}
              onPointerLeave={() => setSobre("")}
              className="grid grid-cols-7 gap-y-0.5"
            >
              {celdas(mes).map((iso, k) => {
                if (!iso) return <span key={`hueco-${k}`} />;
                const b = bloqueo(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    data-dia={iso}
                    tabIndex={iso === foco ? 0 : -1}
                    disabled={iso < piso}
                    aria-disabled={b ? true : undefined}
                    aria-pressed={iso === valor}
                    aria-current={iso === hoy ? "date" : undefined}
                    aria-label={`${LARGA.format(aFecha(iso))}${b === "lleno" ? ", sin disponibilidad" : b ? ", no disponible" : ""}`}
                    onClick={() => intentar(iso)}
                    onPointerEnter={salidaDe ? () => setSobre(iso) : undefined}
                    onFocus={salidaDe ? () => setSobre(iso) : undefined}
                    style={{ "--n": Math.floor(k / 7) + (k % 7) } as CSSProperties}
                    className={
                      "cal-dia flex h-11 md:h-10 items-center justify-center rounded-control text-sm tabular-nums transition-colors duration-150 ease-salida focus-visible:outline-offset-0 " +
                      clasesDia(iso, b)
                    }
                  >
                    {Number(iso.slice(8))}
                  </button>
                );
              })}
            </div>

            {sinCupo ? (
              <div className="mt-3 flex flex-col gap-1.5 text-xs">
                <p role="status" className={`flex items-center gap-2 ${aviso ? "font-medium text-peligro" : "text-ink-soft"}`}>
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm bg-peligro" />
                  {aviso || sinCupo.leyenda}
                </p>
                <p className="flex items-center gap-2 text-ink-soft">
                  <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm bg-seafoam-text" />
                  Su estadía
                </p>
              </div>
            ) : null}

            <div className="mt-3 flex items-center justify-between border-t border-linea pt-3 text-sm font-medium">
              <button
                type="button"
                onClick={() => elegir("")}
                disabled={!valor}
                className="min-h-11 md:min-h-0 rounded-control px-2 py-1.5 text-ink-soft transition-colors enabled:hover:text-ink disabled:opacity-0"
              >
                Quitar fecha
              </button>
              {piso === hoy ? (
                <button
                  type="button"
                  onClick={() => intentar(hoy)}
                  className="min-h-11 md:min-h-0 rounded-control px-2 py-1.5 text-acento transition-colors hover:bg-acento-suave"
                >
                  Hoy
                </button>
              ) : null}
            </div>
          </>
        )}
      </div>
    </>
  );
}
