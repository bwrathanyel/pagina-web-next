"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { Icono } from "@/components/ui/Icono";
import { hoyCaracas } from "@/lib/cotizador/cotizacionRapida";

// Calendario propio: el de <input type="date"> en Chromium no se puede
// estilizar. Es un popover (capa superior: la foto del hero no lo recorta, y
// Esc y el clic afuera lo cierran solos). La fecha viaja en un input oculto con
// el mismo name, así el formulario GET no cambia. Nada antes de hoy (Caracas).
// Todo se calcula en UTC para que la zona del navegador no corra un día.

const DIAS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];
const MES = new Intl.DateTimeFormat("es-VE", { month: "long", year: "numeric", timeZone: "UTC" });
const CORTA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const LARGA = new Intl.DateTimeFormat("es-VE", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const PASOS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };

const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
const aIso = (d: Date) => d.toISOString().slice(0, 10);

function sumarDias(iso: string, n: number) {
  const d = aFecha(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return aIso(d);
}

function moverMes(mes: string, n: number) {
  const d = aFecha(`${mes}-01`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return aIso(d).slice(0, 7);
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
  "flex h-9 w-9 items-center justify-center rounded-control text-ink transition-colors duration-150 ease-salida " +
  "enabled:hover:bg-sand-2 disabled:text-ink-soft/40";

export function SelectorFecha({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const [valor, setValor] = useState("");
  const [mes, setMes] = useState("");
  const [foco, setFoco] = useState("");
  const [aperturas, setAperturas] = useState(0);
  const panel = useRef<HTMLDivElement>(null);
  const grilla = useRef<HTMLDivElement>(null);
  const enfocar = useRef(false);
  const idPanel = useId();
  const ancla = `--fecha-${idPanel.replace(/[^a-zA-Z0-9]/g, "")}`;
  const hoy = hoyCaracas();

  // Solo el teclado y la apertura mueven el foco a la grilla: con las flechas
  // de mes, el foco se queda en la flecha para poder avanzar varios meses.
  useEffect(() => {
    if (!enfocar.current) return;
    enfocar.current = false;
    grilla.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus();
  }, [foco, mes, aperturas]);

  function alAbrir(abierto: boolean) {
    if (!abierto) return;
    const base = valor || hoy;
    enfocar.current = true;
    setFoco(base);
    setMes(base.slice(0, 7));
    setAperturas((n) => n + 1);
  }

  function cambiarMes(n: number) {
    const nuevo = moverMes(mes, n);
    const primero = `${nuevo}-01`;
    setMes(nuevo);
    setFoco(primero < hoy ? hoy : primero);
  }

  function elegir(iso: string) {
    setValor(iso);
    panel.current?.hidePopover();
  }

  function teclas(e: KeyboardEvent<HTMLDivElement>) {
    const paso = PASOS[e.key];
    if (!paso) return;
    e.preventDefault();
    const nuevo = sumarDias(foco, paso);
    if (nuevo < hoy) return;
    enfocar.current = true;
    setFoco(nuevo);
    setMes(nuevo.slice(0, 7));
  }

  const texto = valor ? CORTA.format(aFecha(valor)) : "Cualquier fecha";

  return (
    <>
      <button
        id={id}
        type="button"
        popoverTarget={idPanel}
        aria-label={`Fecha: ${texto}`}
        style={{ anchorName: ancla } as CSSProperties}
        className={`flex items-center gap-2 text-left ${className}`}
      >
        <span className={valor ? "" : "font-medium text-ink-soft"}>{texto}</span>
        <Icono nombre="calendario" tamano={18} className="ml-auto shrink-0 text-ink-soft" />
      </button>
      <input type="hidden" name={name} value={valor} disabled={!valor} />

      <div
        ref={panel}
        id={idPanel}
        popover="auto"
        role="dialog"
        aria-label="Elegir fecha de viaje"
        onToggle={(e) => alAbrir(e.newState === "open")}
        style={{ positionAnchor: ancla } as CSSProperties}
        className="calendario-flotante w-[19.5rem] rounded-card bg-card p-4 text-ink shadow-chrome"
      >
        {mes && (
          <>
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                disabled={mes <= hoy.slice(0, 7)}
                aria-label="Mes anterior"
                className={FLECHA}
              >
                <Icono nombre="chevron-izq" tamano={20} />
              </button>
              <p aria-live="polite" className="font-semibold first-letter:uppercase">
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

            <div ref={grilla} onKeyDown={teclas} className="grid grid-cols-7 gap-0.5">
              {celdas(mes).map((iso, k) => {
                if (!iso) return <span key={`hueco-${k}`} />;
                const elegido = iso === valor;
                return (
                  <button
                    key={iso}
                    type="button"
                    data-dia={iso}
                    tabIndex={iso === foco ? 0 : -1}
                    disabled={iso < hoy}
                    aria-pressed={elegido}
                    aria-current={iso === hoy ? "date" : undefined}
                    aria-label={LARGA.format(aFecha(iso))}
                    onClick={() => elegir(iso)}
                    className={
                      "flex h-10 items-center justify-center rounded-control text-sm tabular-nums transition-colors duration-150 ease-salida focus-visible:outline-offset-0 disabled:text-ink-soft/35 " +
                      (elegido
                        ? "bg-acento font-semibold text-sobre-acento"
                        : iso === hoy
                          ? "font-semibold text-acento ring-1 ring-inset ring-acento/50 hover:bg-acento-suave"
                          : "enabled:hover:bg-sand-2")
                    }
                  >
                    {Number(iso.slice(8))}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-linea pt-3 text-sm font-medium">
              <button
                type="button"
                onClick={() => elegir("")}
                disabled={!valor}
                className="rounded-control px-2 py-1.5 text-ink-soft transition-colors enabled:hover:text-ink disabled:opacity-0"
              >
                Quitar fecha
              </button>
              <button
                type="button"
                onClick={() => elegir(hoy)}
                className="rounded-control px-2 py-1.5 text-acento transition-colors hover:bg-acento-suave"
              >
                Hoy
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
