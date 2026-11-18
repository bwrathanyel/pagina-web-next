"use client";

import { PaseFechas } from "./PaseFechas";
import type { Reserva } from "./useReserva";

type Props = { r: Pick<Reserva, "desde" | "hasta" | "hoy" | "noches" | "sinCupo" | "poner" | "pasajeros" | "hojaViajeros" | "setHojaViajeros" | "errores" | "mostrarErrores"> };

export function TramoFechas({ r }: Props) {
  return (
    <PaseFechas
      desde={r.desde}
      hasta={r.hasta}
      hoy={r.hoy}
      noches={r.noches}
      sinCupo={r.sinCupo}
      onFechas={(d, h) => r.poner({ desde: d, hasta: h })}
      pasajeros={r.pasajeros}
      onPasajeros={(p) => r.poner({ pasajeros: p })}
      hojaAbierta={r.hojaViajeros}
      onHoja={r.setHojaViajeros}
      errorFechas={r.errores.fechas}
      mostrarErrores={r.mostrarErrores}
    />
  );
}
