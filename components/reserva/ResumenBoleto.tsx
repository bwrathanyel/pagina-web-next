"use client";

import { useState, type ReactNode } from "react";
import { BarraFijaMovil } from "@/components/checkout/BarraFijaMovil";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { fechaCorta, rangoFechas, usd } from "@/lib/checkout/formato";
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

/** Las filas del pase. Una fila que se completa después de montar entra con `panel-entra`; las que
 * ya venían completas (borrador, enlace desde /cotizar) no animan. */
function FilasPase({ d }: { d: DatosResumen }) {
  const [alMontar] = useState(d.completos);
  const filas: { id: TramoId; rotulo: string; valor: ReactNode; falta: string }[] = [
    {
      id: "fechas",
      rotulo: "Fechas",
      valor: (
        <>
          <span className="font-mono font-bold">{rangoFechas(d.desde, d.hasta || null)}</span> · {d.viajeros}
        </>
      ),
      falta: "Por elegir",
    },
    { id: "habitacion", rotulo: "Habitación", valor: [d.habitacion, d.plan].filter(Boolean).join(" · ") || d.hotel, falta: "Por elegir" },
    { id: "pago", rotulo: "Pago", valor: d.pago, falta: "Por elegir" },
  ];
  return (
    <dl className="flex flex-col gap-1.5 border-t border-linea px-4 py-3 text-sm">
      {filas.map((f) => (
        <div key={f.id} className="flex items-baseline gap-3">
          <dt className={ROTULO + " w-24 shrink-0"}>{f.rotulo}</dt>
          {d.completos[f.id] ? (
            <dd className={"min-w-0 flex-1 text-ink " + (alMontar[f.id] ? "" : "panel-entra")}>{f.valor}</dd>
          ) : (
            <dd className="min-w-0 flex-1 text-ink-soft">{f.falta}</dd>
          )}
        </div>
      ))}
      {d.boleto ? (
        <div className="flex items-baseline gap-3">
          <dt className={ROTULO + " w-24 shrink-0"}>Boleto aéreo</dt>
          <dd className="min-w-0 flex-1 text-ink">
            {d.boleto} <span className="text-ink-soft">· lo cotiza boletería, no se cobra hoy</span>
          </dd>
        </div>
      ) : null}
    </dl>
  );
}

function Fila({ texto, monto, suave = false }: { texto: ReactNode; monto: ReactNode; suave?: boolean }) {
  return (
    <div className={"flex items-baseline justify-between gap-3 " + (suave ? "text-xs text-ink-soft" : "text-sm text-ink")}>
      <dt className="min-w-0">{texto}</dt>
      <dd className="shrink-0 font-mono tabular-nums">{monto}</dd>
    </div>
  );
}

export function Desglose({ t }: { t: Totales }) {
  const divisas = t.riel === "zelle" || t.riel === "binance";
  return (
    <div className="flex flex-col gap-2">
      <dl className="flex flex-col gap-1.5">
        <Fila texto={`Hospedaje · ${t.noches} ${t.noches === 1 ? "noche" : "noches"}`} monto={usd(t.precio)} />
        {!t.actualizado && t.lineas.length > 1
          ? t.lineas.map((l) => <Fila key={l.texto} texto={l.texto} monto={usd(l.monto)} suave />)
          : null}
        {t.fee > 0 ? <Fila texto={`Gestión web (${t.feePct} %)`} monto={usd(t.fee)} /> : null}
        {t.plan ? (
          <>
            <Fila texto="Total del viaje" monto={usd(t.precio + t.fee)} />
            <Fila texto={`Cuota 1 de ${t.plan.cuotas.length + 1}, hoy (${t.plan.pct} %)`} monto={usd(t.plan.inicial)} />
            {t.plan.cuotas.map((c) => (
              <Fila key={c.n} texto={`Cuota ${c.n} · ${fechaCorta(c.fecha)}`} monto={usd(c.monto)} suave />
            ))}
          </>
        ) : null}
        {t.igtfPct > 0 ? (
          <Fila
            texto={t.plan ? `IGTF de la cuota 1 (${t.igtfPct} %)` : `IGTF (${t.igtfPct} %)`}
            monto={divisas ? usd(t.igtf) : t.riel === "pago_movil" ? "No aplica" : "Según cómo pague"}
          />
        ) : null}
      </dl>
      {t.actualizado ? <p className="text-xs text-ink-soft">Precio actualizado según el tarifario vigente.</p> : null}
      {t.avisos.length ? (
        <ul className="flex flex-col gap-1 text-xs text-ink-soft">
          {t.avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
      {t.riel === "pago_movil" ? (
        <p className="text-xs text-ink-soft">
          En bolívares {t.tasa === "EUR" ? "a la tasa euro del BCV" : "a la tasa del BCV"}
          {t.ivaEnBs ? ", más 16% de IVA" : ""}: el monto exacto lo verá en el siguiente paso.
        </p>
      ) : null}
    </div>
  );
}

/** Contenido de la Hoja «Su reserva»: el pase con sus filas, el desglose y lo que se paga hoy. */
function DetallePase({ datos, totales }: { datos: DatosResumen; totales: Totales }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-card border border-linea bg-card">
        <p className="truncate px-4 pt-3 font-display text-base font-bold text-ink">{datos.hotel}</p>
        <FilasPase d={datos} />
      </div>
      <Desglose t={totales} />
      <div className="flex items-baseline justify-between border-t border-linea pt-3">
        <span className={ROTULO}>{rotuloDe(totales)}</span>
        <span className="flex flex-col items-end">
          <span className="font-mono text-2xl font-bold tabular-nums text-ink">{usd(hoyDe(totales))}</span>
          <TotalBs t={totales} />
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
            className="min-h-8 text-sm font-semibold text-acento underline-offset-4 hover:underline"
          >
            Ver detalle
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
