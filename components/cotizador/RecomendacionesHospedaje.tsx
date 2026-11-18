"use client";

import Image from "next/image";
import { m } from "motion/react";
import { useId, useState, ViewTransition } from "react";
import { MontoTablero } from "@/components/ui/MontoTablero";
import { FotoRotativa, useEncima } from "@/components/cotizador/OfertasHospedaje";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Carrusel } from "@/components/ui/Carrusel";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { nombreFoto } from "@/components/ui/movimiento";
import { useCheckoutConfig } from "@/components/checkout/useCheckoutConfig";
import { avisoIgtf, type Estimado } from "@/lib/cotizador/estimado";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { etiquetaMotivo, type Recomendacion } from "@/lib/cotizador/recomendar";
import { montoConMoneda, separarMonto } from "@/lib/tarifas";

/** Lo que se sabe del precio de un hotel para este viaje: el estimado (si hay
 * fechas y tarifas), "cargando" mientras llegan, o null (va el anunciado). */
export type PrecioViaje = Estimado | "cargando" | null;

/** El hotel que ya está en la cotización, con lo que solo sabe el cotizador:
 * la habitación, el estimado del resumen y si las fechas lo dejaron sin cupo. */
export interface SuHotel {
  oferta: OfertaHotel;
  habitacion: string | null;
  /** El del resumen (habitación elegida); null mientras llega el detalle. */
  estimado: Estimado | null;
  /** Tarifa elegida; null o la anunciada = el total que anuncia la oferta. */
  tarifaId: number | null;
  /** Stop sale en las fechas: no hay total y se pide cambiar. */
  bloqueado: string | null;
  /** Por qué no hay total todavía. */
  nota: string | null;
  onQuitar: () => void;
}

// Miniaturas, alternativas y el fondo de la foto grande piden el mismo
// derivado: al cambiar de hotel, la foto chica ya está en caché.
const MINI = "112px";
const RESORTE = { type: "spring", stiffness: 500, damping: 38 } as const;

// Tarjeta de opción de DESIGN.md: radio nativo oculto y el estado en la etiqueta.
const OPCION =
  "group relative flex cursor-pointer rounded-card border border-linea bg-card transition-colors duration-150 ease-salida " +
  "motion-reduce:transition-none hover:border-ink/35 has-[:checked]:border-acento has-[:checked]:bg-acento-suave " +
  "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20";

const CIRCULO =
  "flex size-6 shrink-0 items-center justify-center rounded-pill border-2 transition-colors duration-150 ease-salida " +
  "motion-reduce:transition-none ";
const CIRCULO_ESTADO = {
  vacio: "border-linea-fuerte text-transparent",
  sugerido: "border-acento text-acento",
  elegido: "border-acento bg-acento text-sobre-acento",
};
const CIRCULO_RADIO =
  "border-linea-fuerte text-transparent group-has-[:checked]:border-acento group-has-[:checked]:bg-acento " +
  "group-has-[:checked]:text-sobre-acento";

/** Círculo de check. Sin `estado` lo pinta el radio de su tarjeta de opción. */
function CirculoCheck({ estado }: { estado?: keyof typeof CIRCULO_ESTADO }) {
  return (
    <span aria-hidden="true" className={CIRCULO + (estado ? CIRCULO_ESTADO[estado] : CIRCULO_RADIO)}>
      <Icono nombre="check" tamano={14} />
    </span>
  );
}

function Precio({
  oferta,
  precio,
  detalle,
  grande = false,
}: {
  oferta: OfertaHotel;
  precio: PrecioViaje;
  detalle: string;
  grande?: boolean;
}) {
  if (precio === "cargando") return <Esqueleto className={grande ? "h-12 w-44" : "h-10 w-28"} />;
  if (precio?.ok) {
    return (
      <span className="flex min-w-0 flex-col">
        <span className={`font-mono font-bold tabular-nums text-ink ${grande ? "text-2xl" : "text-lg"}`}>
          <span className="font-sans text-sm font-semibold text-ink-soft">Total </span>
          <MontoTablero texto={montoConMoneda(precio.total, precio.moneda)} ivaEnBs={precio.ivaEnBs} tasa={precio.moneda} />
        </span>
        <span className="truncate text-xs text-ink-soft">{detalle}</span>
      </span>
    );
  }
  if (!oferta.precio) return <span className="text-sm text-ink-soft">Precio a confirmar por el asesor</span>;
  const { monto, unidad, grande: montoGrande, ivaEnBs, tasa } = separarMonto(oferta.precio);
  return (
    <span className="flex min-w-0 flex-col">
      {montoGrande ? (
        <span className={`font-mono font-bold tabular-nums text-ink ${grande ? "text-xl" : "text-base"}`}>
          {oferta.precio.desde ? <span className="font-sans text-sm font-semibold text-ink-soft">Desde </span> : null}
          <MontoTablero texto={monto} ivaEnBs={ivaEnBs} tasa={tasa} />
        </span>
      ) : (
        <span className="line-clamp-2 text-sm font-semibold text-ink">{monto}</span>
      )}
      {unidad ? <span className="line-clamp-2 text-xs text-ink-soft">{unidad}</span> : null}
    </span>
  );
}

/** Lo que el cliente con niños necesita leer del regalo, igual que en la grilla. */
function textoRegalo(o: OfertaHotel, ninos: number): string | null {
  if (!o.ninosGratis || ninos <= 0) return null;
  return (
    (o.ninosGratisCantidad > 1 ? `${o.ninosGratisCantidad} niños gratis` : "1er niño gratis") +
    (o.ninosGratisEdades ? ` (${o.ninosGratisEdades} años)` : "") +
    (ninos > Math.max(1, o.ninosGratisCantidad) && o.precioNino ? ` · siguiente: ${o.precioNino}/noche` : "")
  );
}

/** Lo que incluye, solo con datos de la oferta: perfil, plan, todo incluido y
 * el regalo. Sin repetir (el perfil "Solo desayuno" ya lo dice el plan). */
function incluye(o: OfertaHotel, rec: Recomendacion | undefined) {
  const vistos = new Set<string>();
  const chips: { texto: string; tono: "neutro" | "seafoam" }[] = [];
  const sumar = (texto: string | null, tono: "neutro" | "seafoam" = "neutro") => {
    const clave = texto?.trim().toLowerCase();
    if (!texto || !clave || vistos.has(clave)) return;
    vistos.add(clave);
    chips.push({ texto: texto.trim(), tono });
  };
  const dePlan = rec?.motivo === "desayuno" || rec?.motivo === "todo-incluido";
  if (rec && (rec.motivo === "economico" || rec.motivo === "exclusivo" || (dePlan && !o.plan))) sumar(etiquetaMotivo(rec));
  sumar(o.plan);
  if (o.todoIncluido && !/todo incluido/i.test(o.plan ?? "")) sumar("Todo incluido");
  if (o.ninosGratis) sumar(o.ninosGratisCantidad > 1 ? `${o.ninosGratisCantidad} niños gratis` : "1 niño gratis", "seafoam");
  return chips;
}

/**
 * Hospedaje de /cotizar: una sola tarjeta «Su hotel» y, alrededor, las opciones
 * para cambiarlo con un toque. Todo es un grupo de radios nativos (los
 * recomendados en miniatura dentro de la tarjeta, los otros perfiles debajo):
 * las opciones no se mueven de sitio, la tarjeta muestra la marcada y el total
 * cae como en el tablero. Sin hotel elegido, la tarjeta muestra el primer
 * recomendado y tocarla lo elige. El resto de hoteles queda a un toque ("Ver
 * los N hoteles"), en una hoja aparte.
 */
export function RecomendacionesHospedaje({
  destacados,
  alternativas,
  sugerido,
  suHotel = null,
  precioDe,
  onRequest,
  detalle,
  detalleCorto,
  ninos,
  elegidoId,
  totalHoteles,
  destino,
  onElegir,
  onVerHabitaciones,
  onVerTodos,
}: {
  /** Ya rotados por visitante: [0] es el principal. */
  destacados: Recomendacion[];
  alternativas: Recomendacion[];
  /** El elegido es el que preseleccionó la web: «Sugerido para usted». */
  sugerido: boolean;
  /** El hotel elegido, si tiene oferta en el destino (esté o no entre los recomendados). */
  suHotel?: SuHotel | null;
  precioDe: (o: OfertaHotel) => PrecioViaje;
  /** El hotel cotiza sujeto a confirmación en esas fechas (on request). */
  onRequest: (o: OfertaHotel) => boolean;
  /** "3 noches · 2 adultos · 1 niño", bajo el total de la tarjeta. */
  detalle: string;
  /** "por 3 noches", bajo el total de las alternativas. */
  detalleCorto: string;
  ninos: number;
  elegidoId: number | null;
  totalHoteles: number;
  destino: string;
  onElegir: (o: OfertaHotel) => void;
  onVerHabitaciones: (o: OfertaHotel) => void;
  onVerTodos: () => void;
}) {
  const grupo = useId();
  const [encima, sobre] = useEncima();
  const igtfPct = useCheckoutConfig().config?.igtf_pct;
  // Destinos sin destacados: la primera alternativa hace de principal.
  const base = destacados.length ? destacados : alternativas.slice(0, 1);
  const otras = destacados.length ? alternativas : alternativas.slice(1);
  const recomendaciones = [...base, ...otras];
  const su = suHotel;
  const oferta = su?.oferta ?? base[0]?.oferta;

  // El hotel de la tarjeta cambió: su nombre sube (nunca al montar).
  const idVisto = oferta?.hotelId ?? null;
  const [vista, setVista] = useState({ id: idVisto, cambios: 0 });
  if (vista.id !== idVisto) setVista({ id: idVisto, cambios: vista.id == null ? vista.cambios : vista.cambios + 1 });

  const verTodos =
    totalHoteles > recomendaciones.length ? (
      <Boton variante="fantasma" className="self-start" aria-haspopup="dialog" onClick={onVerTodos}>
        Ver {totalHoteles === 1 ? "el hotel" : `los ${totalHoteles} hoteles`} en {destino}
      </Boton>
    ) : null;

  if (!oferta) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-ink-soft">
          Ningún hotel de {destino} tiene cupo publicado en esas fechas. Pruebe otras fechas o escríbanos en los
          comentarios y un asesor le busca opciones.
        </p>
        {verTodos}
      </div>
    );
  }

  const idDe = (o: OfertaHotel) => `${grupo}-${o.hotelId}`;
  const radio = (o: OfertaHotel) => {
    const marcado = o.hotelId === elegidoId;
    return {
      type: "radio" as const,
      name: grupo,
      id: idDe(o),
      "aria-label": `Elegir ${o.nombre}`,
      checked: marcado,
      onChange: () => onElegir(o),
      // Tocar el sugerido lo confirma: ya está marcado y no dispara onChange.
      onClick: marcado && sugerido ? () => onElegir(o) : undefined,
      className: "sr-only",
    };
  };

  const rec = recomendaciones.find((r) => r.oferta.hotelId === oferta.hotelId);
  const estado = su ? (sugerido ? "sugerido" : "elegido") : "vacio";
  const tocable = !!rec && estado !== "elegido";
  // Con un solo recomendado a la vista, su radio no necesita miniatura.
  const tira = base.length > 1 || (base.length === 1 && base[0].oferta.hotelId !== oferta.hotelId);

  // Elegido: el total del resumen. Mientras llega su detalle, el anunciado (es
  // el mismo cálculo) si la habitación es la de la oferta.
  const anunciado = precioDe(oferta);
  const precio: PrecioViaje = !su
    ? anunciado
    : (su.estimado ?? (su.tarifaId == null || su.tarifaId === oferta.tarifaId ? anunciado : null));
  const nota =
    precio === "cargando" || precio?.ok
      ? null
      : su
        ? su.nota
        : precio
          ? `${precio.texto}${/asesor/i.test(precio.texto) ? "" : " El asesor le confirma el total."}`
          : null;
  const avisos = su?.estimado?.ok && precio === su.estimado ? [...su.estimado.avisos, avisoIgtf(igtfPct)].filter((a): a is string => !!a) : [];
  const chips = incluye(oferta, rec);
  const regalo = textoRegalo(oferta, ninos);

  const quitar = () => {
    if (!su) return;
    // El botón se va con el hotel: el foco pasa al primer recomendado.
    const destinoFoco = base[0]
      ? document.getElementById(idDe(base[0].oferta))
      : document.getElementById(`${grupo}-grupo`);
    destinoFoco?.focus({ preventScroll: true });
    su.onQuitar();
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset id={`${grupo}-grupo`} tabIndex={-1} className="flex min-w-0 flex-col gap-4 outline-none">
        <legend className="sr-only">Hotel para su viaje a {destino}</legend>

        <article
          {...sobre(oferta.hotelId)}
          className={
            "relative isolate overflow-hidden rounded-card border bg-card transition-colors duration-150 ease-salida " +
            "motion-reduce:transition-none sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] " +
            (su ? "border-acento" : "border-linea hover:border-ink/35") +
            (tira ? "" : " has-[input:focus-visible]:ring-4 has-[input:focus-visible]:ring-acento/20")
          }
        >
          {/* Con el hotel ya elegido (llega con `hotel=` desde la ficha), su foto
              es la de la ficha que viaja hasta acá. */}
          <ViewTransition name={su ? nombreFoto(oferta.hotelId) : undefined} share="morph" default="none">
          <div className="relative aspect-video overflow-hidden bg-sand-2 sm:aspect-auto sm:min-h-56">
            {oferta.fotos[0] ? (
              <Image
                src={oferta.fotos[0]}
                alt=""
                fill
                sizes={MINI}
                className={"object-cover" + (su?.bloqueado ? " grayscale" : "")}
              />
            ) : null}
            <FotoRotativa
              key={oferta.hotelId}
              fotos={oferta.fotos}
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 40vw, 100vw"
              apagada={!!su?.bloqueado}
              encima={encima === oferta.hotelId}
              prioridad
            />
            <span className="absolute left-3 top-3 flex">
              {estado === "elegido" ? (
                <Etiqueta tono="acento">Su hotel</Etiqueta>
              ) : estado === "sugerido" ? (
                <Etiqueta tono="dusk" icono={<Icono nombre="destello" tamano={12} />}>
                  Sugerido para usted
                </Etiqueta>
              ) : rec ? (
                <Etiqueta tono="dusk">{etiquetaMotivo(rec)}</Etiqueta>
              ) : null}
            </span>
            <span className="absolute right-3 top-3 rounded-pill bg-card">
              <CirculoCheck estado={estado} />
            </span>
          </div>
          </ViewTransition>

          <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
            {/* Arriba, donde el alto no cambia: al pasar de un hotel a otro las
                miniaturas no se corren bajo el dedo. */}
            {base.length ? (
              <div className={tira ? "flex flex-col gap-2 border-b border-dashed border-linea-fuerte pb-3" : "sr-only"}>
                {tira ? (
                  <p className="text-xs font-semibold text-ink-soft">
                    {base.length === 1 ? "Nuestra recomendación" : `Nuestras ${base.length} recomendaciones`}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  {base.map((r) => (
                    <label
                      key={r.oferta.hotelId}
                      className="group relative z-20 flex min-w-11 max-w-28 flex-1 cursor-pointer flex-col gap-1 rounded-control has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20"
                    >
                      <input {...radio(r.oferta)} />
                      {tira ? (
                        <span className="relative block pb-2">
                          <span className="relative block aspect-4/3 overflow-hidden rounded-control bg-sand-2">
                            {r.oferta.fotos[0] ? (
                              <Image src={r.oferta.fotos[0]} alt="" fill sizes={MINI} className="object-cover" />
                            ) : null}
                          </span>
                          {r.oferta.hotelId === oferta.hotelId ? (
                            <m.span
                              layoutId={`${grupo}-visto`}
                              aria-hidden="true"
                              transition={RESORTE}
                              className="absolute inset-x-0 bottom-0 h-1 rounded-pill bg-acento"
                            />
                          ) : null}
                        </span>
                      ) : null}
                      <span className="line-clamp-2 text-xs font-semibold leading-tight text-ink-soft transition-colors duration-150 ease-salida motion-reduce:transition-none group-hover:text-ink group-has-[:checked]:text-ink">
                        {r.oferta.nombre}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}

            <div key={oferta.hotelId} className={"flex flex-col gap-2" + (vista.cambios ? " hotel-sube" : "")}>
              <h3 className="font-display text-2xl font-bold leading-tight text-ink">{oferta.nombre}</h3>
              {su?.habitacion ? <p className="text-sm text-ink-soft">{su.habitacion}</p> : null}
              {chips.length ? (
                <ul aria-label="Incluye" className="flex flex-wrap gap-1.5">
                  {chips.map((c) => (
                    <li key={c.texto} className="flex min-w-0 max-w-full">
                      <Etiqueta tono={c.tono} className="min-w-0">
                        <span className="truncate">{c.texto}</span>
                      </Etiqueta>
                    </li>
                  ))}
                </ul>
              ) : null}
              {!oferta.plan && oferta.resumen ? (
                <p className="line-clamp-2 text-sm text-ink-soft">{oferta.resumen}</p>
              ) : null}
              {regalo ? <p className="text-xs font-semibold text-seafoam-text">{regalo}</p> : null}
            </div>

            {su?.bloqueado ? (
              <p className="text-sm font-semibold text-peligro">{su.bloqueado}. Cambie las fechas o elija otro hotel.</p>
            ) : (
              <>
                {nota && !oferta.precio ? null : <Precio oferta={oferta} precio={precio} detalle={detalle} grande />}
                {nota ? <p className="text-xs text-ink-soft">{nota}</p> : null}
                {avisos.map((a) => (
                  <p key={a} className="text-xs text-ink-soft">
                    {a}
                  </p>
                ))}
                {onRequest(oferta) ? (
                  <p className="text-xs font-semibold text-ambar">Sujeto a confirmación del hotel en sus fechas</p>
                ) : null}
              </>
            )}

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
              {su ? null : (
                <label htmlFor={idDe(oferta)} aria-hidden="true" className={clasesBoton({ tamano: "sm", className: "relative z-20 cursor-pointer" })}>
                  Elegir este hotel
                </label>
              )}
              {su || oferta.conFotosHabitacion ? (
                <Boton
                  variante="secundario"
                  tamano="sm"
                  className="relative z-20"
                  aria-haspopup="dialog"
                  onClick={() => onVerHabitaciones(oferta)}
                >
                  {su?.tarifaId != null ? "Cambiar habitación" : "Ver habitaciones"}
                </Boton>
              ) : null}
              {su ? (
                <Boton
                  variante="fantasma"
                  tamano="sm"
                  className="relative z-20"
                  aria-label={`Quitar ${oferta.nombre}`}
                  onClick={quitar}
                >
                  Quitar
                </Boton>
              ) : null}
            </div>
          </div>

          {/* Canto del pase: el degradado del logo solo acá, y solo con hotel elegido. */}
          <span
            aria-hidden="true"
            className={
              "franja-marca absolute inset-x-0 bottom-0 h-1 origin-left transition-transform duration-(--dur-media) ease-salida " +
              "motion-reduce:transition-none " +
              (su ? "scale-x-100" : "scale-x-0")
            }
          />
          {/* Toda la tarjeta elige (o confirma el sugerido): etiqueta del radio
              tendida encima; miniaturas y botones quedan por arriba (z-20). */}
          {tocable ? <label htmlFor={idDe(oferta)} aria-hidden="true" className="absolute inset-0 z-10 cursor-pointer" /> : null}
        </article>

        {otras.length ? (
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold text-ink">Otras opciones en {destino}</h3>
            {/* Teléfono: carrusel con snap y la siguiente asomada. Desde sm, la fila de siempre. */}
            <Carrusel
              gap="gap-3"
              anchoItem={otras.length > 1 ? "82%" : "100%"}
              maxItem={otras.length > 1 ? "20rem" : "100%"}
              desktop="max-sm:-mx-4 max-sm:px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0"
              items={otras.map((r) => (
                <label key={r.oferta.hotelId} {...sobre(r.oferta.hotelId)} className={OPCION + " h-full items-center gap-3 p-3"}>
                  <input {...radio(r.oferta)} />
                  <span className="relative size-20 shrink-0 overflow-hidden rounded-control bg-sand-2">
                    <FotoRotativa fotos={r.oferta.fotos} sizes={MINI} apagada={false} encima={encima === r.oferta.hotelId} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="font-semibold leading-snug text-ink">{r.oferta.nombre}</span>
                    <Etiqueta tono={r.motivo === "ninos-gratis" ? "seafoam" : "neutro"} className="self-start">
                      {etiquetaMotivo(r)}
                    </Etiqueta>
                    <Precio
                      oferta={r.oferta}
                      precio={su && r.oferta.hotelId === oferta.hotelId ? precio : precioDe(r.oferta)}
                      detalle={detalleCorto}
                    />
                  </span>
                  <CirculoCheck />
                </label>
              ))}
            />
          </div>
        ) : null}
      </fieldset>

      {verTodos}
    </div>
  );
}
