"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { BarraFijaMovil } from "@/components/checkout/BarraFijaMovil";
import { Boleto } from "@/components/ui/Boleto";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { rangoFechas, usd } from "@/lib/checkout/formato";
import { ROTULO } from "./PaseFechas";

// Resumen de /reservar: el boleto pegajoso del aside (escritorio) y la barra fija con el total
// (teléfono). Montos SIEMPRE en dólares desde `usd`: nada de TalonPrecio/PrecioMostrado, que
// convierten a Bs con la tasa del selector de moneda y no con la que fija el servidor.

export interface Totales {
  precio: number;
  fee: number;
  feePct: number;
  igtf: number;
  igtfPct: number;
  total: number;
  riel: Riel | "";
  tasa: TasaBcv | null;
  noches: number;
  lineas: { texto: string; monto: number }[];
  avisos: string[];
  /** El servidor corrigió el precio: el desglose por temporada ya no aplica. */
  actualizado: boolean;
}

export interface DatosResumen {
  hotel: string;
  foto: string | null;
  habitacion: string | null;
  plan: string | null;
  desde: string;
  hasta: string;
  viajeros: string;
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
        {t.igtfPct > 0 ? (
          <Fila
            texto={`IGTF (${t.igtfPct} %)`}
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
          En bolívares {t.tasa === "EUR" ? "a la tasa euro del BCV" : "a la tasa del BCV"}: el monto exacto lo verá en el
          siguiente paso.
        </p>
      ) : null}
    </div>
  );
}

/** Aside de escritorio: boleto con foto, la estadía, el desglose y el total en el talón. La acción va debajo, tras la verificación. */
export function ResumenBoleto({
  datos,
  totales,
  sinPrecio,
}: {
  datos: DatosResumen;
  totales: Totales | null;
  /** Qué falta para ver el precio, o por qué no lo hay. */
  sinPrecio: string;
}) {
  return (
    <Boleto
      // El aside es una columna flex con alto máximo: sin shrink-0 el boleto se encoge y el talón tapa el desglose.
      className="shrink-0"
      tamanoTalon="4.5rem"
      talon={
        <div className="flex h-full items-center justify-between gap-3 px-4 pb-1" aria-live="polite">
          <span className={ROTULO}>Total</span>
          {totales ? (
            <span className="font-mono text-2xl font-bold tabular-nums text-ink">{usd(totales.total)}</span>
          ) : (
            <span className="text-right text-sm text-ink-soft">{sinPrecio}</span>
          )}
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      {datos.foto ? (
        <div className="relative aspect-video w-full">
          <Image src={datos.foto} alt="" fill sizes="23rem" className="object-cover" />
        </div>
      ) : null}
      <div className="flex flex-col gap-4 p-5">
        <div>
          <p className="font-display text-lg font-bold leading-tight text-ink">{datos.habitacion ?? datos.hotel}</p>
          {datos.plan ? <p className="text-sm text-ink-soft">{datos.plan}</p> : null}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className={ROTULO}>Fechas</p>
            <p className="font-mono text-sm font-bold text-ink">{datos.desde ? rangoFechas(datos.desde, datos.hasta || null) : "Por elegir"}</p>
          </div>
          <div>
            <p className={ROTULO}>Viajeros</p>
            <p className="text-sm font-semibold text-ink">{datos.viajeros}</p>
          </div>
        </div>
        {totales ? (
          <div className="border-t border-linea pt-4">
            <Desglose t={totales} />
          </div>
        ) : null}
      </div>
    </Boleto>
  );
}

/** Teléfono: total + acción al pie; tocar el total abre el desglose. */
export function BarraTotalMovil({
  totales,
  sinPrecio,
  falta,
  accion,
}: {
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
              <span className="sr-only">Total: </span>
              {usd(totales.total)}
              <Icono nombre="chevron-abajo" tamano={16} className="rotate-180 text-ink-soft" />
            </span>
          ) : (
            <span className="text-sm font-semibold text-ink">{sinPrecio}</span>
          )}
          <span aria-live="polite" className="max-w-full truncate text-xs text-ink-soft">
            {falta ?? (totales ? "Toque para ver el detalle" : "")}
          </span>
        </button>
        {accion}
      </div>
      {totales ? (
        <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Detalle del total">
          <div className="flex flex-col gap-4">
            <Desglose t={totales} />
            <div className="flex items-baseline justify-between border-t border-linea pt-3">
              <span className={ROTULO}>Total</span>
              <span className="font-mono text-2xl font-bold tabular-nums text-ink">{usd(totales.total)}</span>
            </div>
          </div>
        </Hoja>
      ) : null}
    </BarraFijaMovil>
  );
}
