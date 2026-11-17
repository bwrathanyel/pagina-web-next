"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { ELEGIBLE } from "@/components/ui/movimiento";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { fechaCorta, usd } from "@/lib/checkout/formato";
import type { Plan } from "@/lib/checkout/plan";

// Tarjetas de opción de /reservar (habitación y forma de pago): un radio nativo dentro de una
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

/** «+N»: abre el visor con todas las fotos. Va FUERA del `<label>` de la tarjeta (B-09), así tocarlo
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
      <Hoja abierta={visor} onCerrar={() => setVisor(false)} titulo={`Fotos de ${alt}`} escritorio="centrado" anchoClassName="max-w-4xl">
        <ul className="flex flex-col gap-3">
          {fotos.map((foto, i) => (
            <li key={foto} className="relative aspect-[4/3] overflow-hidden rounded-media bg-sand-2">
              <Image src={foto} alt={`${alt}, foto ${i + 1} de ${n}`} fill sizes="(min-width: 1024px) 56rem, 100vw" loading="lazy" className="object-cover" />
            </li>
          ))}
        </ul>
      </Hoja>
    </>
  );
}

/** Fotos de una tarjeta de habitación. En escritorio, al pasar el mouse por la foto se recorren de
 * izquierda a derecha según la posición del puntero; en el teléfono se deslizan. */
function FotosHabitacion({ fotos, alt, forma = "aspect-[4/3]" }: { fotos: string[]; alt: string; forma?: string }) {
  const n = fotos.length;
  const [activa, setActiva] = useState(0);
  // Las fotos 2..N solo se bajan cuando alguien las pide (primer gesto): 4-7 fotos por tarjeta.
  const [montarTodas, setMontarTodas] = useState(false);
  const toqueX = useRef<number | null>(null);

  function alMover(e: PointerEvent<HTMLSpanElement>) {
    if (e.pointerType !== "mouse" || n < 2) return;
    const caja = e.currentTarget.getBoundingClientRect();
    if (caja.width <= 0) return;
    setMontarTodas(true);
    setActiva(Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - caja.left) / caja.width) * n))));
  }

  return (
    <span
      className={"relative block w-full overflow-hidden bg-sand-2 " + forma}
      onPointerMove={alMover}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") setActiva(0);
      }}
      onTouchStart={(e) => {
        toqueX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const x0 = toqueX.current;
        toqueX.current = null;
        if (x0 === null || n < 2) return;
        const dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 38) {
          setMontarTodas(true);
          setActiva((i) => (i + (dx < 0 ? 1 : -1) + n) % n);
        }
      }}
    >
      {fotos.map((foto, i) =>
        montarTodas || i === 0 ? (
          <Image
            key={foto}
            src={foto}
            alt={i === activa ? alt : ""}
            fill
            sizes="(min-width: 1024px) 20rem, 90vw"
            className={"object-cover transition-opacity duration-200 motion-reduce:transition-none " + (i === activa ? "opacity-100" : "opacity-0")}
          />
        ) : null,
      )}
      {n > 1 ? (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {fotos.map((foto, i) => (
            <span
              key={foto}
              className={"h-1.5 rounded-full shadow-sm transition-all duration-200 " + (i === activa ? "w-4 bg-white" : "w-1.5 bg-white/55")}
            />
          ))}
        </span>
      ) : null}
    </span>
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

/** Sin fotos por habitación (la mayoría de los hoteles), repetir las del hotel en cada tarjeta no
 * distingue nada: va un mini hero con las del hotel, chips con lo que traen las habitaciones y
 * tarjetas sin foto para elegir habitación/plan (pedido del dueño, 2026-10-25). */
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
  if (!opciones.length) return null;
  const conFotos = opciones.some((o) => o.fotoPropia);
  // Con más de 3 tarjetas con foto, en el teléfono pasan a un carrusel con snap.
  const carrusel = conFotos && opciones.length > 3;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="sr-only">Habitación</legend>
      {/* Sin fotos por habitación, las del hotel ya están en la cabecera: aquí solo su visor. */}
      {!conFotos && fotosHotel.length > 1 ? (
        <VerFotos fotos={fotosHotel} alt={nombreHotel} className="self-start border border-linea bg-card text-ink hover:bg-sand-2" />
      ) : null}
      {!conFotos && caracteristicas.length ? (
        <ul className="flex flex-wrap gap-2" aria-label="Características de las habitaciones">
          {caracteristicas.map((c) => (
            <li key={c}>
              <Etiqueta>{c}</Etiqueta>
            </li>
          ))}
        </ul>
      ) : null}
      <div
        className={
          carrusel
            ? "-mx-5 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 py-2 lg:mx-0 lg:grid lg:grid-cols-2 lg:overflow-visible lg:p-0"
            : "grid gap-3 lg:grid-cols-2"
        }
      >
        {opciones.map((o) => {
          const fotos = conFotos && o.fotos.length ? o.fotos : null;
          const porNoche = o.precio !== null && noches ? o.precio / noches : null;
          return (
            <div key={o.id} className={"relative " + (carrusel ? "w-[85%] shrink-0 snap-start lg:w-auto" : "")}>
              <label className={TARJETA + " h-full min-h-16 flex-col overflow-hidden"}>
                {fotos ? <FotosHabitacion fotos={fotos} alt={o.titulo} /> : null}
                <span className="flex items-start gap-3 px-4 py-3">
                  <input
                    type="radio"
                    name="habitacion"
                    value={o.id}
                    checked={elegida === o.id}
                    onChange={() => onElegir(o.id)}
                    className="sr-only"
                  />
                  <MarcaElegida className="mt-0.5" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="font-semibold text-ink">{o.titulo}</span>
                    {o.plan ? <span className="text-sm text-ink-soft">{o.plan}</span> : null}
                  </span>
                  {o.precio !== null ? (
                    <span className="flex shrink-0 flex-col items-end">
                      <span className="font-mono text-base font-bold tabular-nums text-ink">{usd(o.precio)}</span>
                      <span className="text-xs text-ink-soft">
                        {porNoche !== null ? (
                          <>
                            <span className="font-mono tabular-nums">{usd(porNoche)}</span> por noche
                          </>
                        ) : (
                          "total de la estadía"
                        )}
                      </span>
                    </span>
                  ) : hayFechas && o.nota ? (
                    <span className="shrink-0 text-sm text-ink-soft">{o.nota}</span>
                  ) : null}
                </span>
                {o.detalles.length || o.descripcion ? (
                  <span className="flex flex-col gap-1 px-4 pb-3 text-sm text-ink-soft">
                    {o.detalles.length ? <span>{o.detalles.join(" · ")}</span> : null}
                    {o.descripcion ? <span className="line-clamp-3">{o.descripcion}</span> : null}
                  </span>
                ) : null}
              </label>
              {fotos ? <VerFotos fotos={fotos} alt={o.titulo} className="absolute right-2 top-2" /> : null}
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
export function detalleRiel(riel: Riel, c: { igtf_pct: number; hold_horas_usd: number; hold_horas_ves: number }, tasa: TasaBcv | null): string {
  const horas = riel === "pago_movil" ? c.hold_horas_ves : c.hold_horas_usd;
  const cupo = horas > 0 ? ` Le guardamos el cupo ${horas} ${horas === 1 ? "hora" : "horas"}.` : "";
  const igtf = c.igtf_pct > 0 ? ` Se suma ${c.igtf_pct} % de IGTF.` : "";
  if (riel === "zelle") return `Pague en dólares desde su banco.${igtf}${cupo}`;
  if (riel === "binance") return `Pague en USDT.${igtf}${cupo}`;
  // «EUR» en el tarifario es la tasa con que se pasa a bolívares, no otra moneda.
  const aTasa = tasa === "EUR" ? "a la tasa euro del BCV del día" : "a la tasa del BCV del día";
  // La tasa del día la fija el servidor al crear la reserva: acá no se estima un monto en Bs.
  return `Pague en bolívares ${aTasa}; el monto exacto lo verá en el siguiente paso.${c.igtf_pct > 0 ? " Sin IGTF." : ""}${cupo}`;
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
    <fieldset data-campo="riel" className="flex flex-col gap-3" aria-describedby={error ? "r-riel-error" : undefined}>
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
              className={TARJETA + " min-h-20 flex-col items-center justify-center gap-0.5 px-2 py-3 text-center" + (error ? " border-peligro" : "")}
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
  const CAJA = " min-h-24 flex-col justify-center gap-1 px-4 py-4";

  return (
    <fieldset data-campo="plan" className="flex flex-col gap-3" aria-describedby={error ? "r-plan-error" : undefined}>
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
