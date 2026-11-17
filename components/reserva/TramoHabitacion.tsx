"use client";

import { OpcionesHabitacion } from "./Opciones";
import type { Reserva } from "./useReserva";

type Props = {
  r: Pick<Reserva, "opciones" | "tarifaEfectiva" | "poner" | "hayFechas" | "caracteristicas" | "noches" | "editando" | "cerrarTramo">;
  nombreHotel: string;
  fotosHotel: string[];
};

export function TramoHabitacion({ r, nombreHotel, fotosHotel }: Props) {
  return (
    <div data-campo="precio" className="flex flex-col gap-3">
      <OpcionesHabitacion
        opciones={r.opciones}
        elegida={r.tarifaEfectiva}
        onElegir={(id) => {
          r.poner({ tarifaId: id });
          // Reabierta con «Cambiar», elegir otra habitación ya es la respuesta: se vuelve a plegar.
          if (r.editando === "habitacion") r.cerrarTramo();
        }}
        noches={r.noches}
        hayFechas={r.hayFechas}
        nombreHotel={nombreHotel}
        fotosHotel={fotosHotel}
        caracteristicas={r.caracteristicas}
      />
    </div>
  );
}
