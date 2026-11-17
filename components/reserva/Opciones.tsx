"use client";

import Image from "next/image";
import { useState } from "react";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { ELEGIBLE } from "@/components/ui/movimiento";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { fechaCorta, usd } from "@/lib/checkout/formato";
import type { Plan } from "@/lib/checkout/plan";

// Opciones de /reservar (habitación y forma de pago): un radio nativo dentro de una
// tarjeta entera clicable, con el estado elegido en acento suave (el design system no usa radios sueltos).

const TARJETA =
  "group flex cursor-pointer rounded-card border bg-card " + ELEGIBLE + " " +
  "has-[:checked]:border-acento has-[:checked]:bg-acento-suave " +
  "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20";

/** Subtítulo dentro de un tramo (el título grande lo pone `Tramo`). */
const LEYENDA = "text-base font-semibold text-ink";

/** Círculo de check de una tarjeta de opción: se llena al elegirla. */
function MarcaElegida({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={
        "flex h-5 w-5 shrink-0 items-center justify-center rounded-pill border border-linea-fuerte text-sobre-acento transition-colors duration-150 ease-salida " +
        "group-has-[:checked]:border-acento group-has-[:checked]:bg-acento " +
        className
      }
    >
      <Icono nombre="check" tamano={12} className="opacity-0 group-has-[:checked]:opacity-100" />
    </span>
  );
}

/** Visor con todas las fotos (Hoja centrada en escritorio). */
function VisorFotos({ fotos, alt, abierta, onCerrar }: { fotos: string[]; alt: string; abierta: boolean; onCerrar: () => void }) {
  const n = fotos.length;
  return (
    <Hoja abierta={abierta} onCerrar={onCerrar} titulo={`Fotos de ${alt}`} escritorio="centrado" anchoClassName="max-w-4xl">
      <ul className="flex flex-col gap-3">
        {fotos.map((foto, i) => (
          <li key={foto} className="relative aspect-[4/3] overflow-hidden rounded-media bg-sand-2">
            <Image src={foto} alt={`${alt}, foto ${i + 1} de ${n}`} fill sizes="(min-width: 1024px) 56rem, 100vw" loading="lazy" className="object-cover" />
          </li>
        ))}
      </ul>
    </Hoja>
  );
}

/** «+N»: abre el visor con todas las fotos. Va FUERA del `<label>` de la opción (B-09), así tocarlo
 * nunca elige la habitación. */
export function VerFotos({ fotos, alt, className = "" }: { fotos: string[]; alt: string; className?: string }) {
  const [visor, setVisor] = useState(false);
  const n = fotos.length;
  if (n < 2) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setVisor(true)}
        aria-label={`Ver las ${n} fotos de ${alt}`}
        className={
          "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-control bg-dusk/80 px-2.5 text-sm font-semibold text-dusk-text transition-colors hover:bg-dusk md:min-h-8 md:min-w-0 lg:backdrop-blur-sm " +
          className
        }
      >
        <Icono nombre="suma" tamano={14} />
        {n}
      </button>
      <VisorFotos fotos={fotos} alt={alt} abierta={visor} onCerrar={() => setVisor(false)} />
    </>
  );
}

/** Miniatura de la fila de habitación: la primera foto, y tocarla abre el visor con todas. Queda fuera
 * del `<label>` (B-09): mirar fotos no elige la habitación. */
function MiniFotos({ fotos, alt }: { fotos: string[]; alt: string }) {
  const [visor, setVisor] = useState(false);
  const n = fotos.length;
  const foto = (
    <Image src={fotos[0]} alt="" fill sizes="(min-width: 1024px) 7rem, 6rem" className="object-cover" />
  );
  const caja = "relative w-24 shrink-0 self-stretch overflow-hidden bg-sand-2 lg:w-28";
  if (n < 2) return <span className={caja}>{foto}</span>;
  return (
    <>
      <button type="button" onClick={() => setVisor(true)} aria-label={`Ver las ${n} fotos de ${alt}`} className={caja + " group/fotos"}>
        {foto}
        <span className="absolute bottom-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-control bg-dusk/80 px-1.5 py-0.5 font-mono text-xs font-bold text-dusk-text transition-colors group-hover/fotos:bg-dusk">
          <Icono nombre="suma" tamano={12} />
          {n}
        </span>
      </button>
      <VisorFotos fotos={fotos} alt={alt} abierta={visor} onCerrar={() => setVisor(false)} />
    </>
  );
}

export interface OpcionHabitacion {
  id: number;
  titulo: string;
  plan: string | null;
  /** Fotos de la habitación o, si no tiene, las del hotel. */
  fotos: string[];
  /** true = `fotos` son de la habitación (producto_fotos.habitacion_id), no del hotel. */
  fotoPropia: boolean;
  /** Camas, m², capacidad y vista de la ficha revisada. */
  detalles: string[];
  descripcion: string | null;
  /** Total de la estadía (sin cargos); null = sin precio para estas fechas o aún sin fechas. */
  precio: number | null;
  /** Por qué no hay precio («A consultar», «Sin cupo»). */
  nota: string | null;
}

/** Habitaciones como filas compactas (pedido del dueño, 2026-11-18: la página entera en una vista):
 * miniatura que abre las fotos, nombre y plan, y el precio a la derecha. Sin fotos por habitación (la
 * mayoría de los hoteles), las del hotel ya están en la cabecera: va su visor, chips con lo que traen
 * las habitaciones y filas sin miniatura (pedido del dueño, 2026-10-25). */
export function OpcionesHabitacion({
  opciones,
  elegida,
  onElegir,
  hayFechas,
  nombreHotel,
  fotosHotel,
  caracteristicas,
  noches,
}: {
  opciones: OpcionHabitacion[];
  elegida: number | null;
  onElegir: (id: number) => void;
  hayFechas: boolean;
  nombreHotel: string;
  fotosHotel: string[];
  caracteristicas: string[];
  noches: number | null;
}) {
  // Sin precio concreto no se ofrece nada (useReserva): con fechas puestas puede quedar vacío.
  if (!opciones.length) {
    return hayFechas ? (
      <p className="rounded-card border border-linea bg-card p-4 text-sm text-ink-soft">
        No hay habitaciones con precio confirmado para estas fechas. Pruebe otras fechas o escríbanos por WhatsApp y un asesor le consulta disponibilidad.
      </p>
    ) : null;
  }
  const conFotos = opciones.some((o) => o.fotoPropia);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend className="sr-only">Habitación</legend>
      {!conFotos && (fotosHotel.length > 1 || caracteristicas.length) ? (
        <div className="flex flex-wrap items-center gap-2">
          {fotosHotel.length > 1 ? <VerFotos fotos={fotosHotel} alt={nombreHotel} className="border border-linea bg-card text-ink hover:bg-sand-2" /> : null}
          {caracteristicas.length ? (
            <>
              <ul className="contents xl:hidden" aria-label="Características de las habitaciones">
                {caracteristicas.map((c) => (
                  <li key={c}>
                    <Etiqueta>{c}</Etiqueta>
                  </li>
                ))}
              </ul>
              {/* xl (tres columnas): los chips ocupaban tres o cuatro renglones; una línea de texto. */}
              <p className="hidden min-w-0 flex-1 text-xs text-ink-soft xl:line-clamp-2" title={caracteristicas.join(" · ")}>
                <span className="sr-only">Características de las habitaciones: </span>
                {caracteristicas.join(" · ")}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
      {/* xl: la lista se desplaza por dentro para que el pago y los datos queden a la vista sin bajar. */}
      <div className="flex flex-col gap-2 xl:-m-1 xl:max-h-[max(13rem,calc(100dvh-27rem))] xl:overflow-y-auto xl:overscroll-contain xl:p-1">
        {opciones.map((o) => {
          const fotos = conFotos && o.fotos.length ? o.fotos : null;
          const porNoche = o.precio !== null && noches ? o.precio / noches : null;
          const detalle = o.detalles.length ? o.detalles.join(" · ") : o.descripcion;
          return (
            <div key={o.id} className={TARJETA + " min-h-16 items-stretch overflow-hidden"}>
              {fotos ? <MiniFotos fotos={fotos} alt={o.titulo} /> : null}
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-3 py-2.5 sm:px-4">
                <input
                  type="radio"
                  name="habitacion"
                  value={o.id}
                  checked={elegida === o.id}
                  onChange={() => onElegir(o.id)}
                  className="sr-only"
                />
                <MarcaElegida />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="line-clamp-2 font-semibold leading-snug text-ink">{o.titulo}</span>
                  {o.plan ? <span className="truncate text-sm text-ink-soft">{o.plan}</span> : null}
                  {detalle ? (
                    <span className="truncate text-xs text-ink-soft" title={o.descripcion ?? undefined}>
                      {detalle}
                    </span>
                  ) : null}
                </span>
                {o.precio !== null ? (
                  <span className="flex shrink-0 flex-col items-end">
                    <span className="font-mono text-base font-bold tabular-nums text-ink">{usd(o.precio)}</span>
                    <span className="text-xs text-ink-soft">
                      {porNoche !== null ? (
                        <>
                          <span className="font-mono tabular-nums">{usd(porNoche)}</span>/noche
                        </>
                      ) : (
                        "la estadía"
                      )}
                    </span>
                  </span>
                ) : hayFechas && o.nota ? (
                  <span className="shrink-0 text-sm text-ink-soft">{o.nota}</span>
                ) : null}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

const RIELES: { id: Riel; titulo: string; moneda: string; enBs: boolean }[] = [
  { id: "zelle", titulo: "Zelle", moneda: "USD", enBs: false },
  { id: "pago_movil", titulo: "Pago Móvil", moneda: "Bs", enBs: true },
  { id: "binance", titulo: "Binance", moneda: "USDT", enBs: false },
];

/** Una línea que explica el método elegido: moneda, IGTF y cuánto se guarda el cupo. */
export function detalleRiel(
  riel: Riel,
  c: { igtf_pct: number; hold_horas_usd: number; hold_horas_ves: number },
  tasa: TasaBcv | null,
  bs: { monto: string; tasa: string } | null = null,
  ivaEnBs = false,
): string {
  const horas = riel === "pago_movil" ? c.hold_horas_ves : c.hold_horas_usd;
  const cupo = horas > 0 ? ` Le guardamos el cupo ${horas} ${horas === 1 ? "hora" : "horas"}.` : "";
  const igtf = c.igtf_pct > 0 ? ` Se suma ${c.igtf_pct} % de IGTF.` : "";
  if (riel === "zelle") return `Pague en dólares desde su banco.${igtf}${cupo}`;
  if (riel === "binance") return `Pague en USDT.${igtf}${cupo}`;
  // «EUR» en el tarifario es la tasa con que se pasa a bolívares, no otra moneda.
  const sinIgtf = c.igtf_pct > 0 ? " Sin IGTF." : "";
  const iva = ivaEnBs ? ", más 16% de IVA" : "";
  // Con la tasa cargada se muestra cuánto sería hoy; el monto que se cobra lo fija el servidor al reservar.
  if (bs) {
    const nombre = tasa === "EUR" ? "tasa euro del BCV" : "tasa del BCV";
    return `Hoy serían ${bs.monto} (${nombre}: ${bs.tasa}${iva}). El monto exacto lo verá en el siguiente paso.${sinIgtf}${cupo}`;
  }
  const aTasa = tasa === "EUR" ? "a la tasa euro del BCV del día" : "a la tasa del BCV del día";
  return `Pague en bolívares ${aTasa}${iva}; el monto exacto lo verá en el siguiente paso.${sinIgtf}${cupo}`;
}

export function OpcionesRiel({
  riel,
  rieles,
  onElegir,
  detalle,
  horas,
  error,
}: {
  riel: Riel | "";
  /** Los que ofrece el servidor hoy (GET /api/checkout). */
  rieles: readonly Riel[];
  onElegir: (r: Riel) => void;
  detalle: string | null;
  /** Horas que se retiene el cupo según la moneda (config del checkout); null = aún sin config. */
  horas: { usd: number; ves: number } | null;
  error: string | null;
}) {
  const visibles = RIELES.filter((r) => rieles.includes(r.id));
  return (
    <fieldset data-campo="riel" className="flex min-w-0 flex-col gap-3" aria-describedby={error ? "r-riel-error" : undefined}>
      <legend className={LEYENDA + " mb-2"}>Método de pago</legend>
      <div
        role="radiogroup"
        aria-label="Método de pago"
        className={"grid gap-2 sm:gap-3 " + (visibles.length >= 3 ? "grid-cols-3" : visibles.length === 2 ? "grid-cols-2" : "grid-cols-1")}
      >
        {visibles.map((r) => {
          const h = horas ? (r.enBs ? horas.ves : horas.usd) : 0;
          return (
            <label
              key={r.id}
              className={TARJETA + " min-h-16 flex-col items-center justify-center gap-0.5 px-2 py-2.5 text-center" + (error ? " border-peligro" : "")}
            >
              <input
                type="radio"
                name="riel"
                value={r.id}
                checked={riel === r.id}
                onChange={() => onElegir(r.id)}
                className="sr-only"
              />
              <span className="text-sm font-bold text-ink sm:text-base">{r.titulo}</span>
              <span className="font-mono text-xs font-bold text-ink-soft">{r.moneda}</span>
              {h > 0 ? <span className="text-xs text-ink-soft">Cupo {h} h</span> : null}
            </label>
          );
        })}
      </div>
      {error ? (
        <p id="r-riel-error" role="alert" className="text-sm font-medium text-peligro">
          {error}
        </p>
      ) : (
        <p aria-live="polite" className="min-h-5 text-sm text-ink-soft">
          {/* El detalle entra al elegir: cambia la clave, se reinicia `panel-entra`. */}
          {detalle ? (
            <span key={riel} className="panel-entra block">
              {detalle}
            </span>
          ) : null}
        </p>
      )}
    </fieldset>
  );
}

export type ModoPago = "total" | "plan";

/** «¿Cómo quiere pagar?»: pago total o plan de abonos (requiere sesión y viaje lejano). Al elegir el
 * plan aparece la aceptación obligatoria de sus condiciones. Las fechas de las cuotas son solo para
 * mostrar: el servidor las recalcula al crear la reserva. */
export function OpcionesModo({
  modo,
  onElegir,
  plan,
  pct,
  conSesion,
  onIniciarSesion,
  acepta,
  onAcepta,
  error,
}: {
  modo: ModoPago;
  onElegir: (m: ModoPago) => void;
  /** null = todavía sin precio. */
  plan: Plan | null;
  pct: number;
  conSesion: boolean;
  onIniciarSesion: () => void;
  acepta: boolean;
  onAcepta: (v: boolean) => void;
  error: string | null;
}) {
  const disponible = plan?.disponible === true ? plan : null;
  const cercano = plan?.disponible === false && plan.motivo === "viaje_cercano";
  const n = disponible?.cuotas.length ?? 0;
  const detallePlan = cercano
    ? `Disponible para viajes a ${plan.minDias} días o más`
    : !conSesion
      ? "Inicie sesión para pagar en cuotas"
      : disponible
        ? `${n} ${n === 1 ? "cuota" : "cuotas"}${
            disponible.cuotas.every((c) => c.monto === disponible.cuotas[0].monto) ? ` de ${usd(disponible.cuotas[0].monto)}` : ""
          }: ${disponible.cuotas.map((c) => fechaCorta(c.fecha)).join(" · ")}`
        : "Elija fechas y habitación para ver las cuotas";
  const tituloPlan = <span className="text-base font-bold text-ink">Plan de abonos</span>;
  // Dos tarjetas grandes: el monto de hoy en mono es lo primero que se compara.
  const CAJA = " min-h-20 flex-col justify-center gap-1 px-4 py-3 lg:min-h-16 lg:py-2.5";

  return (
    <fieldset data-campo="plan" className="flex min-w-0 flex-col gap-3" aria-describedby={error ? "r-plan-error" : undefined}>
      <legend className={LEYENDA + " mb-2"}>¿Cómo quiere pagar?</legend>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
        <label className={TARJETA + CAJA}>
          <input type="radio" name="modo" value="total" checked={modo === "total"} onChange={() => onElegir("total")} className="sr-only" />
          <span className="flex items-center gap-2">
            <MarcaElegida />
            <span className="text-base font-bold text-ink">Pago total</span>
          </span>
          <span className="text-xs text-ink-soft">Paga hoy la estadía completa</span>
        </label>
        {!conSesion && !cercano ? (
          <button type="button" onClick={onIniciarSesion} className={TARJETA + CAJA + " items-start text-left"}>
            {tituloPlan}
            <span className="text-xs font-semibold text-acento underline underline-offset-2">{detallePlan}</span>
          </button>
        ) : (
          <label className={TARJETA + CAJA + (disponible ? "" : " cursor-not-allowed opacity-60 hover:border-linea")}>
            <input
              type="radio"
              name="modo"
              value="plan"
              checked={modo === "plan"}
              disabled={!disponible}
              onChange={() => onElegir("plan")}
              className="sr-only"
            />
            <span className="flex items-center gap-2">
              {disponible ? <MarcaElegida /> : null}
              {tituloPlan}
            </span>
            {disponible ? (
              <span className="font-mono text-base font-bold tabular-nums text-ink">
                Hoy {usd(disponible.inicial)} <span className="text-xs font-normal text-ink-soft">({pct} %)</span>
              </span>
            ) : null}
            <span className="text-xs text-ink-soft">{detallePlan}</span>
          </label>
        )}
      </div>
      {modo === "plan" ? (
        <div>
          <label className="flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={acepta}
              onChange={(e) => onAcepta(e.target.checked)}
              aria-invalid={error ? true : undefined}
              className="mt-0.5 h-5 w-5 shrink-0 accent-acento"
            />
            <span>
              Acepto las{" "}
              <a className="underline underline-offset-2" href="/terminos#plan-abonos" target="_blank" rel="noopener">
                condiciones del plan de abonos
              </a>
              . Si una cuota queda sin pagar después de los días de gracia, la reserva se cancela y lo abonado no se devuelve.
            </span>
          </label>
          {error ? (
            <p id="r-plan-error" role="alert" className="mt-1 text-sm font-medium text-peligro">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </fieldset>
  );
}
