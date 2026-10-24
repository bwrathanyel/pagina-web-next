"use client";

import { FotoRotativa, useEncima } from "@/components/cotizador/OfertasHospedaje";
import { Boton } from "@/components/ui/Boton";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Etiqueta } from "@/components/ui/Insignia";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import type { Estimado } from "@/lib/cotizador/estimado";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { etiquetaMotivo, type Recomendacion } from "@/lib/cotizador/recomendar";
import { montoConMoneda, separarMonto } from "@/lib/tarifas";

/** Lo que se sabe del precio de un hotel para este viaje: el estimado (si hay
 * fechas y tarifas), "cargando" mientras llegan, o null (va el anunciado). */
export type PrecioViaje = Estimado | "cargando" | null;

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
      <p className="flex min-w-0 flex-col" aria-live="polite">
        <span className={`font-mono font-bold tabular-nums text-ink ${grande ? "text-2xl" : "text-lg"}`}>
          <span className="font-sans text-sm font-semibold text-ink-soft">Total </span>
          <PrecioMostrado texto={montoConMoneda(precio.total, precio.moneda)} />
        </span>
        <span className="truncate text-xs text-ink-soft">{detalle}</span>
      </p>
    );
  }
  if (!oferta.precio) return <p className="text-sm text-ink-soft">Precio a confirmar por el asesor</p>;
  const { monto, unidad, grande: montoGrande } = separarMonto(oferta.precio);
  return (
    <p className="flex min-w-0 flex-col">
      {montoGrande ? (
        <span className={`font-mono font-bold tabular-nums text-ink ${grande ? "text-xl" : "text-base"}`}>
          {oferta.precio.desde ? <span className="font-sans text-sm font-semibold text-ink-soft">Desde </span> : null}
          <PrecioMostrado texto={monto} />
        </span>
      ) : (
        <span className="line-clamp-2 text-sm font-semibold text-ink">{monto}</span>
      )}
      {unidad ? <span className="line-clamp-2 text-xs text-ink-soft">{unidad}</span> : null}
    </p>
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

/**
 * Hospedaje de /cotizar en tres opciones con su motivo, en vez de la grilla
 * completa: la recomendada grande y dos alternativas compactas, cada una con
 * el total de su viaje cuando hay fechas. Todos los hoteles quedan a un toque
 * ("Ver los N hoteles"), en una hoja aparte. Con un hotel ya elegido solo
 * quedan las alternativas.
 */
export function RecomendacionesHospedaje({
  recomendaciones,
  precioDe,
  onRequest,
  detalle,
  detalleCorto,
  ninos,
  elegido,
  totalHoteles,
  destino,
  onElegir,
  onVerHabitaciones,
  onVerTodos,
}: {
  recomendaciones: Recomendacion[];
  precioDe: (o: OfertaHotel) => PrecioViaje;
  /** El hotel cotiza sujeto a confirmación en esas fechas (on request). */
  onRequest: (o: OfertaHotel) => boolean;
  /** "3 noches · 2 adultos · 1 niño", bajo el total de la principal. */
  detalle: string;
  /** "3 noches", bajo el total de las alternativas. */
  detalleCorto: string;
  ninos: number;
  elegido: number | null;
  totalHoteles: number;
  destino: string;
  onElegir: (o: OfertaHotel) => void;
  onVerHabitaciones: (o: OfertaHotel) => void;
  onVerTodos: () => void;
}) {
  const [encima, sobre] = useEncima();
  const principal = elegido == null ? recomendaciones[0] : undefined;
  const precioPrincipal = principal ? precioDe(principal.oferta) : null;
  const regalo = principal ? textoRegalo(principal.oferta, ninos) : null;
  const resto = recomendaciones.filter((r) => r !== principal && r.oferta.hotelId !== elegido).slice(0, 2);
  const verTodos =
    totalHoteles > recomendaciones.length || (elegido != null && totalHoteles > 1) ? (
      <Boton variante="fantasma" className="self-start" aria-haspopup="dialog" onClick={onVerTodos}>
        Ver {totalHoteles === 1 ? "el hotel" : `los ${totalHoteles} hoteles`} en {destino}
      </Boton>
    ) : null;

  if (!recomendaciones.length) {
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

  return (
    <div className="flex flex-col gap-4">
      {principal ? (
        <article
          {...sobre(principal.oferta.hotelId)}
          className="overflow-hidden rounded-card border border-linea bg-card sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
        >
          <div className="relative aspect-video bg-sand-2 sm:aspect-auto sm:min-h-56">
            <FotoRotativa
              fotos={principal.oferta.fotos}
              sizes="(min-width: 1024px) 18rem, (min-width: 640px) 40vw, 100vw"
              apagada={false}
              encima={encima === principal.oferta.hotelId}
              prioridad
            />
            <span className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              <Etiqueta tono="acento">{etiquetaMotivo(principal)}</Etiqueta>
              {principal.oferta.ninosGratis && principal.motivo !== "ninos-gratis" ? (
                <Etiqueta tono="seafoam">1 niño gratis</Etiqueta>
              ) : null}
            </span>
          </div>
          <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
            <div className="flex flex-col gap-1">
              <h3 className="font-display text-2xl font-bold leading-tight text-ink">{principal.oferta.nombre}</h3>
              {principal.oferta.plan || principal.oferta.resumen ? (
                <p className="line-clamp-2 text-sm text-ink-soft">
                  {principal.oferta.plan ? principal.oferta.plan.toLowerCase() : principal.oferta.resumen}
                </p>
              ) : null}
              {regalo ? <p className="text-xs font-semibold text-seafoam-text">{regalo}</p> : null}
            </div>
            <Precio oferta={principal.oferta} precio={precioPrincipal} detalle={detalle} grande />
            {precioPrincipal && precioPrincipal !== "cargando" && !precioPrincipal.ok ? (
              <p className="text-xs text-ink-soft">
                {precioPrincipal.texto}
                {/asesor/i.test(precioPrincipal.texto) ? "" : " El asesor le confirma el total."}
              </p>
            ) : null}
            {onRequest(principal.oferta) ? (
              <p className="text-xs font-semibold text-ambar">Sujeto a confirmación del hotel en sus fechas</p>
            ) : null}
            <div className="mt-auto flex flex-wrap gap-2 pt-1">
              <Boton onClick={() => onElegir(principal.oferta)}>Elegir este hotel</Boton>
              {principal.oferta.conFotosHabitacion ? (
                <Boton variante="fantasma" aria-haspopup="dialog" onClick={() => onVerHabitaciones(principal.oferta)}>
                  Ver habitaciones
                </Boton>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}

      {resto.length ? (
        <div className="flex flex-col gap-2">
          {elegido != null ? <h3 className="font-semibold text-ink">Otras opciones en {destino}</h3> : null}
          <ul className="grid gap-3 sm:grid-cols-2">
            {resto.map((r) => (
              <li key={r.oferta.hotelId} {...sobre(r.oferta.hotelId)} className="flex items-center gap-3 rounded-card border border-linea bg-card p-3">
                <span className="relative size-20 shrink-0 overflow-hidden rounded-control bg-sand-2">
                  <FotoRotativa fotos={r.oferta.fotos} sizes="80px" apagada={false} encima={encima === r.oferta.hotelId} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="font-semibold leading-snug text-ink">{r.oferta.nombre}</span>
                  <Etiqueta tono={r.motivo === "ninos-gratis" ? "seafoam" : "neutro"} className="self-start">
                    {etiquetaMotivo(r)}
                  </Etiqueta>
                  <Precio oferta={r.oferta} precio={precioDe(r.oferta)} detalle={detalleCorto} />
                </span>
                <Boton
                  variante="secundario"
                  tamano="sm"
                  className="shrink-0"
                  aria-label={`Elegir ${r.oferta.nombre}`}
                  onClick={() => onElegir(r.oferta)}
                >
                  Elegir
                </Boton>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {verTodos}
    </div>
  );
}
