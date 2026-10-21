"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { GaleriaProducto } from "@/components/producto/GaleriaProducto";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { CLASE_CONTROL, Selector } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { SelectorViajeros, type Viajeros } from "@/components/ui/SelectorViajeros";
import {
  ADULTOS_MAX,
  ajustarEdades,
  BEBES_MAX,
  EDAD_NINO_MAX,
  EDAD_NINO_MIN,
  NINOS_MAX,
  sumarDias,
  textoDuracion,
  textoRangoCorto,
} from "@/lib/cotizador/estado";
import { tarjetasPorHabitacion } from "@/lib/cotizador/estimado";
import { bloqueosEnFechas, esOnRequest, habitacionDeTarifa, textoSinDisponibilidad, type Bloqueo } from "@/lib/cotizador/hotel";
import { textoBoletos, type RutaVuelo } from "@/lib/cotizador/vuelo";
import {
  enlaceCotizarPaquete,
  entradaInicial,
  esFijo,
  estimarPaquete,
  fechasPaquete,
  limitarNoches,
  origenesValidos,
  planMostrado,
  tarifaInicial,
  tarifasDelPlan,
  vencido,
  type EstimadoPaquete,
} from "@/lib/paquetes/precio";
import type { Paquete } from "@/lib/paquetes/tipos";
import { useHoy } from "@/lib/paquetes/useHoy";
import { bloqueDe, montoConMoneda } from "@/lib/tarifas";

const CONTROL_BOTON = `${CLASE_CONTROL} min-h-12 py-2.5 cursor-pointer`;
const TITULO = "font-display text-2xl font-bold leading-tight text-ink md:text-3xl";
const PASO =
  "flex h-11 w-11 items-center justify-center rounded-full border border-linea-fuerte text-ink " +
  "transition-colors duration-150 ease-salida enabled:hover:border-ink/40 enabled:hover:bg-sand-2 disabled:opacity-35";

const capitalizar = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1).toLocaleLowerCase("es");
const usd = (n: number) => montoConMoneda(n, "USD");
const ANIO = (iso: string) => iso.slice(0, 4);

function Rotulo({ htmlFor, children }: { htmlFor?: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
      {children}
    </label>
  );
}

/** Ficha de un paquete: hotel precargado + boleto, con origen, fecha, noches
 * y pasajeros configurables. El total se recalcula en el navegador con las
 * mismas funciones de /cotizar, y el botón lleva todo precargado a /cotizar. */
export function FichaPaquete({ paquete, rutas }: { paquete: Paquete; rutas: RutaVuelo[] }) {
  const id = useId();
  const hoy = useHoy();
  const { hotel } = paquete;
  const origenes = origenesValidos(paquete, rutas);
  const fijo = esFijo(paquete);

  const [origen, setOrigen] = useState(origenes[0]?.iata ?? "");
  const [entradaElegida, setEntrada] = useState<string | null>(null);
  const [noches, setNoches] = useState(paquete.noches_default);
  const [viajeros, setViajeros] = useState<Viajeros>({ adultos: 2, ninos: 0, bebes: 0 });
  const [edades, setEdades] = useState<number[]>([]);
  const [tarifaId, setTarifaId] = useState<number | null>(null);
  const [bloqueos, setBloqueos] = useState<Bloqueo[] | undefined>(undefined);

  const elegido = origenes.find((o) => o.iata === origen) ?? origenes[0];
  const entrada = entradaElegida ?? (hoy ? entradaInicial(paquete, hoy) : "");
  const f = fechasPaquete(paquete, entrada, noches);
  const pax = { adultos: viajeros.adultos, edades, bebes: viajeros.bebes };
  const tarifas = tarifasDelPlan(hotel.tarifas, paquete.plan);
  const plan = planMostrado(hotel.tarifas, paquete.plan);
  const tarifa =
    tarifas.find((t) => t.id === tarifaId) ?? (hoy ? tarifaInicial(tarifas, hotel.tarifaDestacadaId, { ...f, viajeros: pax }) : null);
  const est = hoy && elegido ? estimarPaquete({ tarifa, tarifas, ...f, viajeros: pax, ruta: elegido.ruta, hoy }) : null;
  const yaPaso = !!hoy && vencido(paquete, hoy);

  useEffect(() => {
    if (!f.desde || !f.hasta) return;
    let vivo = true;
    bloqueosEnFechas([hotel.id], f.desde, f.hasta)
      .then((m) => vivo && setBloqueos(m.get(hotel.id) ?? []))
      .catch(() => vivo && setBloqueos([]));
    return () => {
      vivo = false;
    };
  }, [hotel.id, f.desde, f.hasta]);
  const sinDisponibilidad = textoSinDisponibilidad(bloqueos, f.desde, f.hasta);

  const href =
    elegido && f.desde
      ? enlaceCotizarPaquete({
          hotelId: hotel.id,
          hotelDestino: hotel.destino,
          vueloDestinoIata: paquete.vuelo_destino_iata,
          origen: elegido.valor,
          desde: f.desde,
          hasta: f.hasta,
          viajeros: pax,
          tarifaId: tarifa?.id ?? null,
        })
      : null;

  const cambiarViajeros = (v: Viajeros) => {
    setViajeros(v);
    setEdades((e) => ajustarEdades(e, v.ninos));
  };

  const bloque = bloqueDe(tarifa);
  const incluye = [...new Set([
    elegido ? `Boleto aéreo ida y vuelta ${elegido.etiqueta} – ${elegido.ruta.destino_nombre}` : "Boleto aéreo ida y vuelta",
    `${f.noches} ${f.noches === 1 ? "noche" : "noches"} en ${hotel.nombre}`,
    plan ? `Plan ${capitalizar(plan)}` : null,
    ...(bloque?.incluye ?? []).slice(0, 8).map(capitalizar),
    ...paquete.incluye,
  ].filter((x): x is string => !!x))];

  const fechasTexto = fijo
    ? `${textoRangoCorto(paquete.fecha_entrada!, paquete.fecha_salida!)} ${ANIO(paquete.fecha_salida!)}`
    : f.desde
      ? `${textoRangoCorto(f.desde, f.hasta)} ${ANIO(f.hasta)}`
      : "";

  const configurador = (
    <div className="flex flex-col gap-5 rounded-card border border-linea bg-card p-5">
      <div>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Arme su paquete</p>
        <p className="mt-1 text-sm text-ink-soft">Boleto ida y vuelta + hotel</p>
      </div>

      {origenes.length > 1 ? (
        <div className="flex flex-col gap-1.5">
          <Rotulo htmlFor={`${id}-origen`}>Sale desde</Rotulo>
          <Selector id={`${id}-origen`} value={origen} onChange={(e) => setOrigen(e.target.value)}>
            {origenes.map((o) => (
              <option key={o.iata} value={o.iata}>
                {o.etiqueta}
              </option>
            ))}
          </Selector>
        </div>
      ) : elegido ? (
        <p className="text-sm text-ink">
          <span className="font-semibold">Sale desde</span> {elegido.etiqueta}
        </p>
      ) : null}

      {fijo ? (
        <div className="rounded-control bg-sand-2 px-4 py-3">
          <p className="font-mono text-sm font-bold tabular-nums text-ink">{fechasTexto}</p>
          <p className="text-sm text-ink-soft">Salida fija · {textoDuracion(f.noches)}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <Rotulo htmlFor={`${id}-entrada`}>Fecha de ida</Rotulo>
            <SelectorFecha
              id={`${id}-entrada`}
              name="fecha"
              etiqueta="Fecha de ida"
              valor={entrada}
              onCambio={(iso) => setEntrada(iso)}
              min={hoy ? sumarDias(hoy, 2) : undefined}
              rango={f.desde ? { desde: f.desde, hasta: f.hasta } : undefined}
              vacio="Elegir fecha"
              className={CONTROL_BOTON}
            />
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Noches</p>
              <p className="text-sm text-ink-soft" aria-live="polite">
                {f.desde ? textoRangoCorto(f.desde, f.hasta) : textoDuracion(f.noches)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className={PASO}
                aria-label="Una noche menos"
                disabled={f.noches <= paquete.noches_min}
                onClick={() => setNoches(limitarNoches(paquete, f.noches - 1))}
              >
                <Icono nombre="menos" tamano={18} />
              </button>
              <span className="w-6 text-center font-mono text-lg font-bold tabular-nums text-ink">{f.noches}</span>
              <button
                type="button"
                className={PASO}
                aria-label="Una noche más"
                disabled={f.noches >= paquete.noches_max}
                onClick={() => setNoches(limitarNoches(paquete, f.noches + 1))}
              >
                <Icono nombre="suma" tamano={18} />
              </button>
            </div>
          </div>
        </>
      )}

      <div className="flex flex-col gap-1.5">
        <Rotulo htmlFor={`${id}-viajeros`}>Pasajeros</Rotulo>
        <SelectorViajeros
          id={`${id}-viajeros`}
          valor={viajeros}
          onCambio={cambiarViajeros}
          maximos={{ adultos: ADULTOS_MAX, ninos: NINOS_MAX, bebes: BEBES_MAX }}
          className={CONTROL_BOTON}
        />
      </div>

      {edades.length ? (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold text-ink">Edad de cada niño</legend>
          <div className="flex flex-wrap gap-3">
            {edades.map((edad, i) => (
              <div key={i} className="flex w-28 flex-col gap-1">
                <label htmlFor={`${id}-edad-${i}`} className="text-sm text-ink-soft">
                  Niño {i + 1}
                </label>
                <Selector
                  id={`${id}-edad-${i}`}
                  value={edad}
                  onChange={(ev) => setEdades((e) => e.map((x, j) => (j === i ? Number(ev.target.value) : x)))}
                >
                  {Array.from({ length: EDAD_NINO_MAX - EDAD_NINO_MIN + 1 }, (_, k) => EDAD_NINO_MIN + k).map((a) => (
                    <option key={a} value={a}>
                      {a} años
                    </option>
                  ))}
                </Selector>
              </div>
            ))}
          </div>
        </fieldset>
      ) : null}

      <ResumenPrecio est={est} noches={f.noches} />

      {sinDisponibilidad ? <Aviso>{sinDisponibilidad}. El asesor le propone otra fecha u hotel.</Aviso> : null}
      {esOnRequest(bloqueos) ? <Aviso tono="info">El hotel confirma disponibilidad para estas fechas (on request).</Aviso> : null}
      {yaPaso ? <Aviso>Esta salida ya pasó. Escríbanos y le armamos otra fecha.</Aviso> : null}

      {href && !yaPaso ? (
        <Boton href={href} ancho iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
          Reservar con un asesor
        </Boton>
      ) : null}
      <p className="text-xs text-ink-soft">Sin pagar nada todavía: un asesor confirma disponibilidad y precio final.</p>
    </div>
  );

  return (
    <>
      <header className="mb-5 md:mb-8">
        <Link
          href="/catalogo/paquetes"
          className="mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-acento"
        >
          <Icono nombre="flecha-izq" tamano={16} /> Paquetes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          {paquete.etiqueta ? <Etiqueta tono="acento">{paquete.etiqueta}</Etiqueta> : null}
          <Etiqueta tono="seafoam" icono={<Icono nombre="avion" tamano={12} />}>
            Boleto incluido
          </Etiqueta>
        </div>
        <h1 className="mt-3 max-w-[24ch] text-balance font-display text-4xl font-bold leading-none text-ink md:text-5xl">
          {paquete.titulo}
        </h1>
        <p className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
          {[hotel.nombre, hotel.destino, fijo ? fechasTexto : `de ${paquete.noches_min} a ${paquete.noches_max} noches`]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {paquete.descripcion ? <p className="mt-4 max-w-2xl text-lg text-ink-soft">{paquete.descripcion}</p> : null}
      </header>

      <div className="flex flex-col gap-10 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-x-10">
        <section aria-labelledby={`${id}-areas`} className="order-1 min-w-0 lg:col-start-1 lg:row-start-1">
          {hotel.fotos.length ? <GaleriaProducto fotos={hotel.fotos} alt={hotel.nombre} /> : null}
          <h2 id={`${id}-areas`} className="mt-3 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">
            Áreas comunes de {hotel.nombre}
          </h2>
        </section>

        <aside
          aria-label="Configure su paquete"
          className="order-2 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
        >
          {configurador}
        </aside>

        <div className="order-3 flex min-w-0 flex-col gap-10 lg:col-start-1 lg:row-start-2">
          <section aria-labelledby={`${id}-incluye`}>
            <h2 id={`${id}-incluye`} className={TITULO}>
              Qué incluye
            </h2>
            <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {incluye.map((i) => (
                <li key={i} className="flex items-start gap-2 text-ink">
                  <span aria-hidden="true" className="mt-1 shrink-0 text-seafoam">
                    <Icono nombre="check" tamano={16} />
                  </span>
                  {i}
                </li>
              ))}
            </ul>
            {bloque?.check_in || bloque?.check_out ? (
              <p className="mt-3 text-sm text-ink-soft">
                {[bloque.check_in && `Entrada al hotel ${bloque.check_in}`, bloque.check_out && `salida ${bloque.check_out}`]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            ) : null}
          </section>

          {hotel.descripcion ? (
            <section aria-labelledby={`${id}-hotel`}>
              <h2 id={`${id}-hotel`} className={TITULO}>
                El hotel
              </h2>
              <div className="mt-4 flex max-w-2xl flex-col gap-3 text-ink-soft">
                {hotel.descripcion
                  .split(/\n+/)
                  .filter((p) => p.trim())
                  .map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
              </div>
            </section>
          ) : null}

          <Habitaciones
            paquete={paquete}
            tarifas={tarifas}
            elegidaId={tarifa?.id ?? null}
            desde={f.desde}
            onElegir={setTarifaId}
            estimar={(t) => (hoy && elegido ? estimarPaquete({ tarifa: t, tarifas, ...f, viajeros: pax, ruta: elegido.ruta, hoy }) : null)}
            personas={viajeros.adultos + viajeros.ninos}
            idTitulo={`${id}-habitaciones`}
          />

          <section aria-labelledby={`${id}-letra`} className="rounded-card bg-seafoam-bg p-5 text-sm text-seafoam-text">
            <h2 id={`${id}-letra`} className="font-semibold">
              Antes de reservar
            </h2>
            <ul className="mt-2 flex list-disc flex-col gap-1 pl-5">
              <li>El precio es un estimado con las tarifas publicadas hoy. El asesor confirma disponibilidad y precio final.</li>
              <li>El boleto sale de la tarifa «Desde» de la ruta y puede variar según la aerolínea y la fecha.</li>
              <li>Los niños pagan asiento; los bebés viajan en brazos.</li>
              {paquete.notas ? <li>{paquete.notas}</li> : null}
            </ul>
          </section>
        </div>
      </div>

      {href && !yaPaso ? (
        <div className="fixed inset-x-0 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-30 flex items-center gap-3 border-t border-linea bg-card px-5 py-3 lg:hidden">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-lg font-bold tabular-nums text-ink">
              {est?.total != null ? <PrecioMostrado texto={usd(est.total)} /> : "Precio a confirmar"}
            </p>
            <p className="truncate text-xs text-ink-soft">
              {est?.total != null ? `Total estimado · ${textoBoletos(est.asientos)} + hotel` : "El asesor le cotiza"}
            </p>
          </div>
          <Boton href={href} tamano="sm" iconoFin={<Icono nombre="flecha-der" tamano={16} />}>
            Reservar
          </Boton>
        </div>
      ) : null}
    </>
  );
}

function ResumenPrecio({ est, noches }: { est: EstimadoPaquete | null; noches: number }) {
  if (!est) {
    return <div className="h-24 animate-pulse rounded-control bg-sand-2" aria-hidden="true" />;
  }
  const { hotel, vuelo } = est;
  const avisos = [
    ...(hotel.ok ? hotel.avisos : []),
    vuelo.cercano ? `Faltan ${vuelo.dias} días para el vuelo: el boleto ya está en tarifa de última hora.` : null,
  ].filter((x): x is string => !!x);

  return (
    <div className="flex flex-col gap-3 border-t border-dashed border-linea-fuerte pt-4" aria-live="polite">
      <dl className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-soft">
            Hotel · {noches} {noches === 1 ? "noche" : "noches"}
          </dt>
          <dd className="font-mono font-bold tabular-nums text-ink">
            {hotel.ok ? <PrecioMostrado texto={montoConMoneda(hotel.total, hotel.moneda)} /> : "A confirmar"}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-ink-soft">{textoBoletos(est.asientos)} ida y vuelta</dt>
          <dd className="font-mono font-bold tabular-nums text-ink">
            {vuelo.total != null ? <PrecioMostrado texto={usd(vuelo.total)} /> : "A confirmar"}
          </dd>
        </div>
      </dl>
      {est.total != null ? (
        <div>
          <p className="font-mono text-3xl font-bold tabular-nums text-acento">
            <PrecioMostrado texto={usd(est.total)} />
          </p>
          <p className="text-sm text-ink-soft">
            Total estimado · <PrecioMostrado texto={usd(est.porPersona!)} /> por persona
          </p>
        </div>
      ) : (
        <p className="text-sm font-semibold text-ink">
          {!hotel.ok ? `${hotel.texto} ` : hotel.moneda !== "USD" ? "El hotel cotiza en euros. " : ""}
          Precio a confirmar por el asesor.
        </p>
      )}
      {avisos.length ? (
        <ul className="flex flex-col gap-1 text-xs text-ink-soft">
          {avisos.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function Habitaciones({
  paquete,
  tarifas,
  elegidaId,
  desde,
  onElegir,
  estimar,
  personas,
  idTitulo,
}: {
  paquete: Paquete;
  tarifas: Paquete["hotel"]["tarifas"];
  elegidaId: number | null;
  desde: string;
  onElegir: (id: number) => void;
  estimar: (t: Paquete["hotel"]["tarifas"][number]) => EstimadoPaquete | null;
  personas: number;
  idTitulo: string;
}) {
  const { hotel } = paquete;
  const tarjetas = tarjetasPorHabitacion(tarifas, desde);
  if (!tarjetas.length) return null;

  return (
    <section aria-labelledby={idTitulo}>
      <h2 id={idTitulo} className={TITULO}>
        Habitaciones
      </h2>
      <p className="mt-1 text-sm text-ink-soft">Elija la habitación y el total se actualiza.</p>
      <ul className="mt-4 flex flex-col gap-3">
        {tarjetas.map(({ tarifa: t, filas }) => {
          const hab = habitacionDeTarifa(hotel.habitaciones, t);
          const foto = hab?.fotos[0] ?? hotel.fotos[0] ?? null;
          const elegida = filas.some((x) => x.id === elegidaId);
          const est = estimar(t);
          const excede = hab?.capacidad_max != null && personas > hab.capacidad_max;
          const ficha = [
            hab?.camas,
            hab?.metros2 ? `${Number(hab.metros2)} m²` : null,
            hab?.capacidad_max ? `Hasta ${hab.capacidad_max} personas` : null,
            hab?.vista,
          ].filter(Boolean);
          return (
            <li
              key={t.id}
              className={`flex flex-col gap-3 rounded-card border bg-card p-3 sm:flex-row ${
                elegida ? "border-acento ring-2 ring-acento" : "border-linea"
              }`}
            >
              <span className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-control bg-sand-2 sm:w-44">
                {foto ? <Image src={foto} alt="" fill sizes="(min-width: 640px) 11rem, 90vw" className="object-cover" /> : null}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <p className="font-semibold text-ink">{capitalizar(t.habitacion || t.titulo || "Habitación")}</p>
                {ficha.length ? <p className="text-sm text-ink-soft">{ficha.join(" · ")}</p> : null}
                {hab?.descripcion ? <p className="line-clamp-3 text-sm text-ink-soft">{hab.descripcion}</p> : null}
                {hab?.amenities?.length ? (
                  <p className="line-clamp-1 text-xs text-ink-soft">{hab.amenities.slice(0, 6).join(" · ")}</p>
                ) : null}
                <p className="text-sm text-ink">
                  {est?.total != null ? (
                    <>
                      Paquete:{" "}
                      <span className="font-mono text-base font-bold tabular-nums">
                        <PrecioMostrado texto={usd(est.total)} />
                      </span>{" "}
                      <span className="text-ink-soft">total estimado</span>
                    </>
                  ) : est ? (
                    <span className="text-ink-soft">Precio a confirmar por el asesor</span>
                  ) : null}
                </p>
                {excede ? (
                  <p className="text-sm font-semibold text-ambar">
                    Son {personas} personas y la habitación admite {hab?.capacidad_max}: el asesor le propone la combinación.
                  </p>
                ) : null}
                <Boton
                  tamano="sm"
                  variante={elegida ? "secundario" : "primario"}
                  onClick={() => onElegir(t.id)}
                  aria-pressed={elegida}
                  className="mt-auto self-start"
                >
                  {elegida ? "Elegida" : "Elegir esta habitación"}
                </Boton>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
