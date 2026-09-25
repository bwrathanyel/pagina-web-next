"use client";

import Image from "next/image";
import { chip } from "@/components/cotizador/BarraViaje";
import { Aviso } from "@/components/ui/Aviso";
import { TOURS_MAX } from "@/lib/cotizador/estado";
import { textoPrecioTour, type TourWeb } from "@/lib/cotizador/tours";

/** Full day y tours del destino, del catálogo. Se agregan como selección
 * múltiple; el precio por persona sale de la tabla de la web y, sin él, "a
 * confirmar". No suma al estimado: el grupo y la fecha los confirma el asesor. */
export function SeccionTours({
  destino,
  tours,
  elegidos,
  cargando,
  error,
  onAlternar,
}: {
  destino: string;
  tours: TourWeb[];
  elegidos: number[];
  cargando: boolean;
  error: boolean;
  onAlternar: (id: number) => void;
}) {
  const lista = tours.filter((t) => t.destino === destino);
  return (
    <>
      <p className="text-ink-soft">
        Los full day son por grupo privado, con un mínimo de 15 personas. Agregue los que le interesen y el asesor confirma fechas y precio.
      </p>
      {cargando ? (
        <p className="text-sm text-ink-soft" role="status">
          Buscando tours en {destino}...
        </p>
      ) : error ? (
        <Aviso>No pudimos cargar los tours. Puede enviar la solicitud igual: un asesor le propone los tours disponibles.</Aviso>
      ) : lista.length ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {lista.map((t) => {
            const activo = elegidos.includes(t.id);
            const precio = textoPrecioTour(t);
            const lleno = !activo && elegidos.length >= TOURS_MAX;
            return (
              <li
                key={t.id}
                className={`flex flex-col overflow-hidden rounded-card border bg-card ${activo ? "border-acento ring-2 ring-acento" : "border-linea"}`}
              >
                {t.foto ? (
                  <span className="relative block aspect-video w-full overflow-hidden bg-sand-2">
                    <Image src={t.foto} alt="" fill sizes="(min-width: 640px) 45vw, 100vw" className="object-cover" />
                  </span>
                ) : null}
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <p className="font-display text-lg font-bold leading-tight text-ink">{t.nombre}</p>
                  {t.nota ? <p className="text-sm text-ink-soft">{t.nota}</p> : null}
                  <p className="text-sm text-ink-soft">{precio ?? "Precio a confirmar por el asesor"}</p>
                  <button
                    type="button"
                    aria-pressed={activo}
                    aria-label={`${activo ? "Quitar" : "Agregar"} ${t.nombre}`}
                    disabled={lleno}
                    onClick={() => onAlternar(t.id)}
                    className={`${chip(activo)} mt-auto self-start disabled:opacity-50`}
                  >
                    {activo ? "Agregado" : "Agregar"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-ink-soft">
          No tenemos tours publicados para {destino}. Un asesor le propone los disponibles para sus fechas.
        </p>
      )}
      {elegidos.length >= TOURS_MAX ? <p className="text-sm text-ink-soft">Llegó al máximo de {TOURS_MAX} tours por cotización.</p> : null}
    </>
  );
}
