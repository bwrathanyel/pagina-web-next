"use client";

import Image from "next/image";
import { GaleriaProducto } from "@/components/producto/GaleriaProducto";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Etiqueta } from "@/components/ui/Insignia";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { estimarEstadia, tarjetasPorHabitacion, type Estadia } from "@/lib/cotizador/estimado";
import { habitacionDeTarifa, type HotelDetalle } from "@/lib/cotizador/hotel";
import { agruparPorPlan, bloqueDe, montoConMoneda, precioDeTarifa } from "@/lib/tarifas";

export function DetalleHotel({
  detalle,
  error,
  estadia,
  personas,
  tarifaElegida,
  sinDisponibilidad,
  onElegir,
}: {
  detalle: HotelDetalle | null;
  error: boolean;
  estadia: Estadia;
  personas: number;
  tarifaElegida: number | null;
  sinDisponibilidad: string | null;
  onElegir: (tarifaId: number | null) => void;
}) {
  if (error) {
    return (
      <div className="flex flex-col gap-4 p-5">
        <Aviso>No pudimos cargar las habitaciones de este hotel. Puede elegirlo igual y el asesor le cotiza.</Aviso>
        <Boton onClick={() => onElegir(null)} disabled={!!sinDisponibilidad}>
          Elegir este hotel
        </Boton>
      </div>
    );
  }
  if (!detalle) {
    return (
      <div className="flex flex-col gap-4 p-5" aria-busy="true">
        <Esqueleto className="aspect-4/3 w-full" />
        <Esqueleto className="h-6 w-2/3" />
        <Esqueleto className="h-28 w-full" />
        <Esqueleto className="h-28 w-full" />
      </div>
    );
  }

  const planes = agruparPorPlan(detalle.tarifas, detalle.tarifaDestacadaId);
  const hayFechas = !!estadia.desde && !!estadia.hasta;

  return (
    <div className="flex flex-col gap-6 p-5">
      {detalle.fotos.length ? <GaleriaProducto fotos={detalle.fotos} alt={detalle.nombre} /> : null}
      {sinDisponibilidad ? <Aviso>{sinDisponibilidad}. Pruebe otras fechas u otro hotel.</Aviso> : null}
      {!hayFechas ? (
        <Aviso tono="info">Elija las fechas de entrada y salida para ver el estimado de su estadía.</Aviso>
      ) : null}

      {planes.length === 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-ink-soft">Este hotel aún no tiene tarifas publicadas. El asesor le cotiza con disponibilidad.</p>
          <Boton onClick={() => onElegir(null)} disabled={!!sinDisponibilidad}>
            Elegir este hotel
          </Boton>
        </div>
      ) : null}

      {planes.map(({ plan, tarifas }) => {
        const b = bloqueDe(tarifas[0]);
        return (
          <section key={plan} className="flex flex-col gap-3">
            <h3 className="font-display text-2xl font-bold leading-tight text-ink lowercase first-letter:uppercase">{plan}</h3>
            {b?.incluye?.length ? (
              <ul className="grid gap-x-4 gap-y-1 text-sm text-ink-soft sm:grid-cols-2">
                {b.incluye.slice(0, 8).map((i) => (
                  <li key={i} className="lowercase first-letter:uppercase">
                    {i}
                  </li>
                ))}
              </ul>
            ) : null}
            {b?.check_in || b?.check_out ? (
              <p className="text-sm text-ink-soft">
                {[b.check_in && `Entrada ${b.check_in}`, b.check_out && `salida ${b.check_out}`].filter(Boolean).join(", ")}
              </p>
            ) : null}

            <ul className="flex flex-col gap-3">
              {tarjetasPorHabitacion(tarifas, estadia.desde).map(({ tarifa: t, filas }) => {
                const hab = habitacionDeTarifa(detalle.habitaciones, t);
                const foto = hab?.fotos[0] ?? detalle.fotos[0] ?? null;
                const precio = precioDeTarifa(t);
                const est = hayFechas ? estimarEstadia(t, detalle.tarifas, estadia) : null;
                const minimo = t.minimo_noches;
                // La elegida puede ser otra temporada de esta misma habitación.
                const elegida = filas.some((x) => x.id === tarifaElegida);
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
                    <span className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-control bg-sand-2 sm:w-40">
                      {foto ? <Image src={foto} alt="" fill sizes="(min-width: 640px) 10rem, 90vw" className="object-cover" /> : null}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-ink">{t.habitacion || t.titulo || "Habitación"}</p>
                        {minimo ? <Etiqueta tono="neutro">Mínimo {minimo} noches</Etiqueta> : null}
                      </div>
                      {ficha.length ? <p className="text-sm text-ink-soft">{ficha.join(" · ")}</p> : null}
                      {hab?.descripcion ? <p className="line-clamp-2 text-sm text-ink-soft">{hab.descripcion}</p> : null}
                      {precio ? (
                        <p className="text-sm text-ink">
                          {precio.desde ? "Desde " : ""}
                          <span className="font-mono font-bold tabular-nums">
                            <PrecioMostrado texto={precio.monto} />
                          </span>
                          {precio.unidad ? ` ${precio.unidad} por noche` : ""}
                        </p>
                      ) : null}
                      {est ? (
                        est.ok ? (
                          <p className="text-sm text-ink">
                            Su estadía:{" "}
                            <span className="font-mono text-base font-bold tabular-nums">
                              <PrecioMostrado texto={montoConMoneda(est.total, est.moneda)} />
                            </span>{" "}
                            <span className="text-ink-soft">
                              {est.noches} {est.noches === 1 ? "noche" : "noches"}, estimado
                            </span>
                          </p>
                        ) : (
                          <p className="text-sm text-ink-soft">{est.texto} Precio a confirmar por el asesor.</p>
                        )
                      ) : null}
                      {excede ? (
                        <p className="text-sm font-semibold text-ambar">
                          Son {personas} personas y la habitación admite {hab?.capacidad_max}: el asesor le propone la combinación.
                        </p>
                      ) : null}
                      <Boton
                        tamano="sm"
                        variante={elegida ? "secundario" : "primario"}
                        onClick={() => onElegir(t.id)}
                        disabled={!!sinDisponibilidad}
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
      })}
    </div>
  );
}
