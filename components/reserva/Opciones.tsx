"use client";

import Image from "next/image";
import { useRef, useState, type PointerEvent } from "react";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { usd } from "@/lib/checkout/formato";

// Tarjetas de opción de /reservar (habitación y forma de pago): un radio nativo dentro de una
// tarjeta entera clicable, con el estado elegido en acento suave (el design system no usa radios sueltos).

const TARJETA =
  "flex cursor-pointer rounded-card border border-linea bg-card transition-colors duration-150 ease-salida " +
  "hover:border-ink/35 has-[:checked]:border-acento has-[:checked]:bg-acento-suave " +
  "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20";

const LEYENDA = "font-display text-xl font-bold text-ink";

/** Fotos de una tarjeta de habitación. En escritorio, al pasar el mouse por la foto se recorren de
 * izquierda a derecha según la posición del puntero; en el teléfono se deslizan. El «+» abre el visor con
 * todas. Vive dentro del `<label>` de la tarjeta, así que sus controles frenan el clic: tocar el «+» no
 * debe elegir la habitación (el visor va en un portal, fuera del label). */
function FotosHabitacion({ fotos, alt }: { fotos: string[]; alt: string }) {
  const n = fotos.length;
  const [activa, setActiva] = useState(0);
  // Las fotos 2..N solo se bajan cuando alguien las pide (primer gesto): 4-7 fotos por tarjeta.
  const [montarTodas, setMontarTodas] = useState(false);
  const [visor, setVisor] = useState(false);
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
      className="relative block aspect-video w-full overflow-hidden bg-sand-2"
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
        <>
          <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
            {fotos.map((foto, i) => (
              <span
                key={foto}
                className={"h-1.5 rounded-full shadow-sm transition-all duration-200 " + (i === activa ? "w-4 bg-white" : "w-1.5 bg-white/55")}
              />
            ))}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setVisor(true);
            }}
            aria-label={`Ver las ${n} fotos de ${alt}`}
            className="absolute bottom-2 right-2 inline-flex min-h-8 items-center gap-1 rounded-full bg-dusk/80 px-2.5 text-sm font-semibold text-dusk-text transition-colors hover:bg-dusk lg:backdrop-blur-sm"
          >
            <Icono nombre="suma" tamano={14} />
            {n}
          </button>
          <Hoja abierta={visor} onCerrar={() => setVisor(false)} titulo={`Fotos de ${alt}`} escritorio="centrado" anchoClassName="max-w-4xl">
            <ul className="flex flex-col gap-3">
              {fotos.map((foto, i) => (
                <li key={foto} className="relative aspect-[4/3] overflow-hidden rounded-media bg-sand-2">
                  <Image
                    src={foto}
                    alt={`${alt}, foto ${i + 1} de ${n}`}
                    fill
                    sizes="(min-width: 1024px) 56rem, 100vw"
                    loading="lazy"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </Hoja>
        </>
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
  /** Camas, m², capacidad y vista de la ficha revisada. */
  detalles: string[];
  descripcion: string | null;
  /** Total de la estadía (sin cargos); null = sin precio para estas fechas o aún sin fechas. */
  precio: number | null;
  /** Por qué no hay precio («A consultar», «Sin cupo»). */
  nota: string | null;
}

export function OpcionesHabitacion({
  opciones,
  elegida,
  onElegir,
  hayFechas,
}: {
  opciones: OpcionHabitacion[];
  elegida: number | null;
  onElegir: (id: number) => void;
  hayFechas: boolean;
}) {
  if (!opciones.length) return null;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className={LEYENDA + " mb-3"}>Habitación</legend>
      <div className="grid gap-3 lg:grid-cols-2">
        {opciones.map((o) => (
          <label key={o.id} className={TARJETA + " min-h-16 flex-col overflow-hidden"}>
            {o.fotos.length ? <FotosHabitacion fotos={o.fotos} alt={o.titulo} /> : null}
            <span className="flex items-center gap-3 px-4 py-3">
              <input
                type="radio"
                name="habitacion"
                value={o.id}
                checked={elegida === o.id}
                onChange={() => onElegir(o.id)}
                className="h-5 w-5 shrink-0 accent-acento"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-semibold text-ink">{o.titulo}</span>
                {o.plan ? <span className="text-sm text-ink-soft">{o.plan}</span> : null}
              </span>
              {o.precio !== null ? (
                <span className="flex shrink-0 flex-col items-end">
                  <span className="font-mono text-base font-bold tabular-nums text-ink">{usd(o.precio)}</span>
                  <span className="text-xs text-ink-soft">total de la estadía</span>
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
        ))}
      </div>
    </fieldset>
  );
}

const RIELES: { id: Riel; titulo: string; moneda: string }[] = [
  { id: "zelle", titulo: "Zelle", moneda: "Dólares" },
  { id: "pago_movil", titulo: "Pago Móvil", moneda: "Bolívares" },
  { id: "binance", titulo: "Binance", moneda: "USDT" },
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
  return `Pague en bolívares ${aTasa}.${c.igtf_pct > 0 ? " Sin IGTF." : ""}${cupo}`;
}

export function OpcionesRiel({
  riel,
  onElegir,
  detalle,
  error,
}: {
  riel: Riel | "";
  onElegir: (r: Riel) => void;
  detalle: string | null;
  error: string | null;
}) {
  return (
    <fieldset data-campo="riel" className="flex flex-col gap-3" aria-describedby={error ? "r-riel-error" : undefined}>
      <legend className={LEYENDA + " mb-3"}>¿Cómo va a pagar?</legend>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {RIELES.map((r) => (
          <label
            key={r.id}
            className={
              TARJETA +
              " min-h-14 flex-col items-center justify-center gap-0.5 px-2 py-2 text-center" +
              (error ? " border-peligro" : "")
            }
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
            <span className="text-xs text-ink-soft">{r.moneda}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p id="r-riel-error" role="alert" className="text-sm font-medium text-peligro">
          {error}
        </p>
      ) : (
        <p aria-live="polite" className="min-h-5 text-sm text-ink-soft">
          {detalle}
        </p>
      )}
    </fieldset>
  );
}
