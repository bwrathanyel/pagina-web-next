"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { sumarDias } from "@/lib/cotizador/cotizacionRapida";
import { BarraFijaMovil } from "@/components/checkout/BarraFijaMovil";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { fechaCorta, usd } from "@/lib/checkout/formato";
import type { CuotaPlan } from "@/lib/checkout/plan";
import { MontoTablero } from "@/components/ui/MontoTablero";
import type { TramoId } from "@/lib/checkout/tramos";
import { ROTULO } from "./PaseFechas";
import { useBsHoy } from "./useBsHoy";

// Resumen de /reservar: el total en la cabecera (escritorio) y la barra fija con el total (teléfono). Montos SIEMPRE en dólares desde `usd`: nada de TalonPrecio/PrecioMostrado, que
// convierten a Bs con la tasa del selector de moneda y no con la que fija el servidor. Con Pago Móvil, debajo va el estimado
// en Bs a la tasa BCV de la tarifa (`useBsHoy`, mismo cálculo que TramoPago).

export interface Totales {
  precio: number;
  fee: number;
  feePct: number;
  igtf: number;
  igtfPct: number;
  total: number;
  riel: Riel | "";
  tasa: TasaBcv | null;
  ivaEnBs: boolean;
  noches: number;
  lineas: { texto: string; monto: number }[];
  avisos: string[];
  /** El servidor corrigió el precio: el desglose por temporada ya no aplica. */
  actualizado: boolean;
  /** Plan de abonos elegido: hoy se paga la cuota 1 (+IGTF solo de ella) y el resto en `cuotas`. */
  plan?: { pct: number; inicial: number; hoy: number; cuotas: CuotaPlan[] } | null;
}

/** Lo que se cobra hoy: el total, o la cuota 1 si eligió el plan. */
const hoyDe = (t: Totales) => (t.plan ? t.plan.hoy : t.total);
const rotuloDe = (t: Totales | null) => (t?.plan ? "Hoy paga" : "Total");

/** Pago Móvil: lo de hoy en bolívares bajo el total en dólares (estimado con la misma tasa que muestra TramoPago). */
function TotalBs({ t, className = "" }: { t: Totales; className?: string }) {
  const bs = useBsHoy(t, t.riel, t.tasa);
  if (!bs) return null;
  return (
    <span className={"font-mono text-sm font-semibold tabular-nums text-ink-soft " + className}>
      <span className="sr-only">En bolívares: </span>≈ {bs.monto}
    </span>
  );
}

export interface DatosResumen {
  hotel: string;
  habitacion: string | null;
  plan: string | null;
  desde: string;
  hasta: string;
  viajeros: string;
  /** «Pago total · Zelle». */
  pago: string;
  /** Qué tramos ya están terminados: cada dato del pase aparece al terminarse el suyo. */
  completos: Record<TramoId, boolean>;
  /** Boleto aéreo agregado: «Caracas a Isla de Margarita, … · aprox. $400». No suma al total de hoy. */
  boleto?: string | null;
}

const DIA_SEMANA = new Intl.DateTimeFormat("es-VE", { weekday: "short", timeZone: "UTC" });
const DIA_LARGO = new Intl.DateTimeFormat("es-VE", { weekday: "long", timeZone: "UTC" });
const aFecha = (iso: string) => new Date(`${iso}T00:00:00Z`);
/** Hasta cuántas noches se dibujan como fichas; más que eso, solo el conteo. */
const FICHAS_MAX = 14;
const rielVar = (r: Riel) => ({ "--riel": `var(--color-riel-${r.replace("_", "-")})` }) as CSSProperties;
const enCola = (n: number) => ({ "--n": n }) as CSSProperties;

/** Entrada y salida como los dos extremos de un pase: la ruta se dibuja y las noches aparecen al medio. */
function TrayectoPase({ desde, hasta, noches }: { desde: string; hasta: string; noches: number }) {
  const extremo = (rotulo: string, iso: string, fin = false) => (
    <div className={"flex flex-col " + (fin ? "items-end text-right" : "")}>
      <span className={ROTULO}>{rotulo}</span>
      <span className="font-mono text-lg font-bold leading-tight text-ink">{fechaCorta(iso)}</span>
      <span className="text-xs text-ink-soft first-letter:uppercase">{DIA_LARGO.format(aFecha(iso))}</span>
    </div>
  );
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-t border-linea px-4 py-3">
      {extremo("Entrada", desde)}
      <div aria-hidden className="relative flex items-center justify-center">
        <span className="pase-ruta absolute inset-x-0 top-1/2 border-t border-dashed border-linea-fuerte" />
        <span className="pase-noches relative rounded-pill bg-seafoam-bg px-2.5 py-1 font-mono text-xs font-bold text-seafoam-text">
          {noches} {noches === 1 ? "noche" : "noches"}
        </span>
      </div>
      {extremo("Salida", hasta, true)}
    </div>
  );
}

/** Las filas del pase que no son fechas: cada una entra escalonada al abrir la hoja. */
function FilasPase({ d, riel }: { d: DatosResumen; riel: Riel | "" }) {
  const filas: { id: TramoId | "viajeros"; rotulo: string; valor: ReactNode; listo: boolean }[] = [
    { id: "viajeros", rotulo: "Viajeros", valor: d.viajeros, listo: d.completos.fechas },
    { id: "habitacion", rotulo: "Habitación", valor: [d.habitacion, d.plan].filter(Boolean).join(" · ") || d.hotel, listo: d.completos.habitacion },
    {
      id: "pago",
      rotulo: "Pago",
      valor: (
        <span className="inline-flex items-center gap-1.5">
          {riel ? <span aria-hidden className="riel-punto size-2 shrink-0 rounded-pill" style={rielVar(riel)} /> : null}
          {d.pago}
        </span>
      ),
      listo: d.completos.pago,
    },
  ];
  return (
    <dl className="flex flex-col gap-1.5 border-t border-linea px-4 py-3 text-sm">
      {!d.completos.fechas ? (
        <div className="flex items-baseline gap-3">
          <dt className={ROTULO + " w-24 shrink-0"}>Fechas</dt>
          <dd className="min-w-0 flex-1 text-ink-soft">Por elegir</dd>
        </div>
      ) : null}
      {filas.map((f, i) => (
        <div key={f.id} className="entra-card flex items-baseline gap-3" style={enCola(i + 1)}>
          <dt className={ROTULO + " w-24 shrink-0"}>{f.rotulo}</dt>
          <dd className={"min-w-0 flex-1 " + (f.listo ? "text-ink" : "text-ink-soft")}>{f.listo ? f.valor : "Por elegir"}</dd>
        </div>
      ))}
      {d.boleto ? (
        <div className="entra-card flex items-baseline gap-3" style={enCola(4)}>
          <dt className={ROTULO + " w-24 shrink-0"}>Boleto aéreo</dt>
          <dd className="min-w-0 flex-1 text-ink">
            {d.boleto} <span className="text-ink-soft">· lo cotiza boletería, no se cobra hoy</span>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

/** Una ficha por noche (mié 25, jue 26…): se ve qué noches se pagan. */
function NochesFichas({ desde, noches, porNoche }: { desde: string; noches: number; porNoche: string | null }) {
  if (!desde || noches < 1 || noches > FICHAS_MAX) return null;
  return (
    <div className="flex flex-col gap-1.5">
      <ul className="flex flex-wrap gap-1.5" aria-label={`${noches} ${noches === 1 ? "noche" : "noches"}`}>
        {Array.from({ length: noches }, (_, k) => {
          const iso = sumarDias(desde, k);
          return (
            <li
              key={iso}
              style={enCola(k)}
              className="ficha-noche flex min-w-11 flex-col items-center rounded-control bg-seafoam-bg px-2 py-1 text-seafoam-text"
            >
              <span className="text-xs">{DIA_SEMANA.format(aFecha(iso)).replace(".", "")}</span>
              <span className="font-mono text-sm font-bold tabular-nums">{Number(iso.slice(8))}</span>
            </li>
          );
        })}
      </ul>
      {porNoche ? <p className="text-xs text-ink-soft">{porNoche}</p> : null}
    </div>
  );
}

type Parte = { id: string; texto: string; monto: number; color: string };

/** De qué se compone lo que paga: una barra que se llena por partes y, debajo, cada parte con su monto. */
function Composicion({ partes }: { partes: Parte[] }) {
  const suma = partes.reduce((s, p) => s + p.monto, 0);
  if (suma <= 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div aria-hidden className="flex h-2.5 gap-0.5 overflow-hidden rounded-pill bg-sand-2">
        {partes.map((p, i) => (
          <span key={p.id} className={"barra-crece h-full " + p.color} style={{ flexGrow: p.monto, ...enCola(i) }} />
        ))}
      </div>
      <dl className="flex flex-col gap-1.5">
        {partes.map((p, i) => (
          <div key={p.id} className="entra-card flex items-baseline justify-between gap-3 text-sm text-ink" style={enCola(i + 1)}>
            <dt className="flex min-w-0 items-center gap-2">
              <span aria-hidden className={"size-2.5 shrink-0 rounded-sm " + p.color} />
              {p.texto}
            </dt>
            <dd className="flex shrink-0 items-baseline gap-2 font-mono tabular-nums">
              <span className="text-xs text-ink-soft">{Math.round((p.monto / suma) * 100)} %</span>
              {usd(p.monto)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** Plan de abonos como línea de tiempo: hoy la cuota 1, después cada cuota con su fecha. */
function LineaCuotas({ plan }: { plan: NonNullable<Totales["plan"]> }) {
  const pasos = [
    { n: 1, cuando: `hoy (${plan.pct} %)`, monto: plan.inicial, hoy: true },
    ...plan.cuotas.map((c) => ({ n: c.n, cuando: fechaCorta(c.fecha), monto: c.monto, hoy: false })),
  ];
  return (
    <ol className="flex flex-col">
      {pasos.map((p, i) => (
        <li key={p.n} className="entra-card flex gap-3" style={enCola(i)}>
          <span aria-hidden className="flex flex-col items-center pt-1.5">
            <span className={"size-2.5 shrink-0 rounded-pill " + (p.hoy ? "bg-seafoam-text" : "border-2 border-linea-fuerte")} />
            {i < pasos.length - 1 ? <span className="w-px flex-1 bg-linea-fuerte" /> : null}
          </span>
          <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pb-3 text-sm">
            <span className={p.hoy ? "font-semibold text-ink" : "text-ink"}>
              Cuota {p.n} de {pasos.length} <span className="text-ink-soft">· {p.cuando}</span>
            </span>
            <span className="shrink-0 font-mono tabular-nums text-ink">{usd(p.monto)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

/** El total sube de 0 a su monto al abrir la hoja (el lector de pantalla recibe el monto final). */
function TotalQueSube({ monto }: { monto: number }) {
  const reducido = useReducedMotion();
  const [visto, setVisto] = useState(0);
  useEffect(() => {
    if (reducido) return;
    let id = 0;
    const t0 = performance.now();
    const paso = (t: number) => {
      const p = Math.min(1, (t - t0) / CUENTA_MS);
      setVisto(monto * (1 - (1 - p) ** 3));
      if (p < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [monto, reducido]);
  return (
    <span className="font-mono text-3xl font-bold tabular-nums text-ink">
      <span className="sr-only">{usd(monto)}</span>
      <span aria-hidden>{usd(reducido ? monto : visto)}</span>
    </span>
  );
}
const CUENTA_MS = 700;

function Fila({ texto, monto, suave = false }: { texto: ReactNode; monto: ReactNode; suave?: boolean }) {
  return (
    <div className={"flex items-baseline justify-between gap-3 " + (suave ? "text-xs text-ink-soft" : "text-sm text-ink")}>
      <dt className="min-w-0">{texto}</dt>
      <dd className="shrink-0 font-mono tabular-nums">{monto}</dd>
    </div>
  );
}

/** Contenido de la Hoja «Su reserva»: el pase (trayecto, filas), las noches una por una, de qué se compone
 * el monto (barra por partes), el plan de abonos como línea de tiempo y el total que sube al abrir.
 * Todo entra escalonado; con reduced-motion, quieto (bloque global de globals.css). */
function DetallePase({ datos, totales: t }: { datos: DatosResumen; totales: Totales }) {
  const divisas = t.riel === "zelle" || t.riel === "binance";
  const conFechas = datos.completos.fechas && datos.desde && datos.hasta;
  const uniforme = !t.actualizado && t.lineas.length <= 1 && t.noches > 0;
  const partes: Parte[] = [
    { id: "hospedaje", texto: `Hospedaje · ${t.noches} ${t.noches === 1 ? "noche" : "noches"}`, monto: t.precio, color: "bg-seafoam-text" },
    ...(t.fee > 0 ? [{ id: "gestion", texto: `Gestión web (${t.feePct} %)`, monto: t.fee, color: "bg-ambar" }] : []),
    ...(divisas && t.igtf > 0 && !t.plan ? [{ id: "igtf", texto: `IGTF (${t.igtfPct} %)`, monto: t.igtf, color: "bg-ink-soft" }] : []),
  ];
  return (
    <div className="flex flex-col gap-5">
      <div className="entra-card overflow-hidden rounded-card border border-linea bg-card" style={enCola(0)}>
        <p className="truncate px-4 pt-3 pb-2 font-display text-lg font-bold text-ink">{datos.hotel}</p>
        {conFechas ? <TrayectoPase desde={datos.desde} hasta={datos.hasta} noches={t.noches} /> : null}
        <FilasPase d={datos} riel={t.riel} />
      </div>

      {conFechas ? (
        <section className="flex flex-col gap-2">
          <h3 className={ROTULO}>Sus noches</h3>
          <NochesFichas
            desde={datos.desde}
            noches={t.noches}
            porNoche={uniforme ? `${usd(t.precio / t.noches)} por noche` : null}
          />
          {!t.actualizado && t.lineas.length > 1 ? (
            <dl className="flex flex-col gap-1">
              {t.lineas.map((l) => (
                <Fila key={l.texto} texto={l.texto} monto={usd(l.monto)} suave />
              ))}
            </dl>
          ) : null}
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h3 className={ROTULO}>Cómo se compone</h3>
        <Composicion partes={partes} />
        {t.igtfPct > 0 && (!divisas || t.plan) ? (
          <dl>
            <Fila
              texto={t.plan ? `IGTF de la cuota 1 (${t.igtfPct} %)` : `IGTF (${t.igtfPct} %)`}
              monto={divisas ? usd(t.igtf) : t.riel === "pago_movil" ? "No aplica" : "Según cómo pague"}
              suave
            />
          </dl>
        ) : null}
      </section>

      {t.plan ? (
        <section className="flex flex-col gap-2">
          <h3 className={ROTULO}>Plan de abonos · total {usd(t.precio + t.fee)}</h3>
          <LineaCuotas plan={t.plan} />
        </section>
      ) : null}

      {t.actualizado || t.avisos.length || t.riel === "pago_movil" ? (
        <div className="flex flex-col gap-1 text-xs text-ink-soft">
          {t.actualizado ? <p>Precio actualizado según el tarifario vigente.</p> : null}
          {t.avisos.map((a) => (
            <p key={a}>{a}</p>
          ))}
          {t.riel === "pago_movil" ? (
            <p>
              En bolívares {t.tasa === "EUR" ? "a la tasa euro del BCV" : "a la tasa del BCV"}
              {t.ivaEnBs ? ", más 16% de IVA" : ""}: el monto exacto lo verá en el siguiente paso.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="perforacion-h flex items-end justify-between gap-3 pt-4">
        <span className="flex flex-col">
          <span className={ROTULO}>{rotuloDe(t)}</span>
          {t.riel ? (
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs text-ink-soft">
              <span aria-hidden className="riel-punto size-2 shrink-0 rounded-pill" style={rielVar(t.riel)} />
              {datos.pago}
            </span>
          ) : null}
        </span>
        <span className="flex flex-col items-end">
          <TotalQueSube monto={hoyDe(t)} />
          <TotalBs t={t} />
        </span>
      </div>
    </div>
  );
}

/** Escritorio: el total del pase en la cabecera (flap al cambiar); «Ver detalle» abre el pase completo.
 * Reemplaza al aside pegajoso: así fechas, habitación, pago y datos entran en una vista (2026-11-18). */
export function PaseCabecera({
  datos,
  totales,
  sinPrecio,
  className = "",
}: {
  datos: DatosResumen;
  totales: Totales | null;
  /** Qué falta para ver el precio, o por qué no lo hay. */
  sinPrecio: string;
  className?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className={"flex shrink-0 flex-col items-end gap-0.5 text-right " + className} aria-live="polite">
      <span className={ROTULO}>{rotuloDe(totales)}</span>
      {totales ? (
        <>
          <span className="font-mono text-2xl font-bold tabular-nums text-ink">
            <MontoTablero texto={usd(hoyDe(totales))} convertir={false} />
          </span>
          <TotalBs t={totales} />
          <button
            type="button"
            onClick={() => setAbierta(true)}
            aria-haspopup="dialog"
            className="group inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-acento underline-offset-4 hover:underline"
          >
            Ver desglose
            <Icono nombre="chevron-der" tamano={14} className="transition-transform duration-150 ease-salida group-hover:translate-x-0.5" />
          </button>
          <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Su reserva">
            <DetallePase datos={datos} totales={totales} />
          </Hoja>
        </>
      ) : (
        <span className="max-w-56 text-sm text-ink-soft">{sinPrecio}</span>
      )}
    </div>
  );
}

/** Teléfono: total + acción al pie; tocar el total abre el pase completo con el desglose. */
export function BarraTotalMovil({
  datos,
  totales,
  sinPrecio,
  falta,
  accion,
}: {
  datos: DatosResumen;
  totales: Totales | null;
  sinPrecio: string;
  /** «Falta: sus datos» (o null si ya está todo). */
  falta: string | null;
  accion: ReactNode;
}) {
  const [abierta, setAbierta] = useState(false);
  return (
    <BarraFijaMovil etiqueta="Total y reserva">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => totales && setAbierta(true)}
          disabled={!totales}
          aria-haspopup="dialog"
          className="flex min-h-12 min-w-0 flex-1 flex-col items-start justify-center text-left"
        >
          {totales ? (
            <span className="flex items-center gap-1 font-mono text-xl font-bold tabular-nums text-ink">
              <span className="sr-only">{rotuloDe(totales)}: </span>
              <MontoTablero texto={usd(hoyDe(totales))} convertir={false} />
              <Icono nombre="chevron-abajo" tamano={16} className="rotate-180 text-ink-soft" />
            </span>
          ) : null}
          {totales ? <TotalBs t={totales} className="text-xs" /> : (
            <span className="text-sm font-semibold text-ink">{sinPrecio}</span>
          )}
          <span aria-live="polite" className="max-w-full truncate text-xs text-ink-soft">
            {falta ?? (totales ? "Toque para ver su reserva" : "")}
          </span>
        </button>
        {accion}
      </div>
      {totales ? (
        <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Su reserva">
          <DetallePase datos={datos} totales={totales} />
        </Hoja>
      ) : null}
    </BarraFijaMovil>
  );
}
