"use client";

import { useSyncExternalStore } from "react";

const suscribirHidratacion = () => () => {};

function calcularEstado(): { online: boolean; texto: string } {
  const ahora = new Date();
  const ve = new Date(ahora.getTime() + ahora.getTimezoneOffset() * 60000 - 4 * 3600000);
  const dia = ve.getDay();
  const horaDecimal = ve.getHours() + ve.getMinutes() / 60;
  const online =
    dia >= 1 && dia <= 6 ? horaDecimal >= 8.5 && horaDecimal < 19 : dia === 0 && horaDecimal >= 10 && horaDecimal < 15;
  const texto = online
    ? "En línea · Respondemos pronto"
    : dia === 0
      ? "Domingos 10am-3pm"
      : "Lun-Sáb 8:30am-7pm";
  return { online, texto };
}

/** Client-only: depends on the visitor's clock, so it renders nothing
 * during SSR and fills in on mount to avoid a hydration mismatch. */
export function EstadoAtencion() {
  const hidratado = useSyncExternalStore(suscribirHidratacion, () => true, () => false);
  if (!hidratado) return null;
  const estado = calcularEstado();

  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-dusk-text-soft">
      <span
        className={"h-2 w-2 rounded-full " + (estado.online ? "bg-[#25D366]" : "bg-dusk-text-soft/50")}
        aria-hidden="true"
      />
      {estado.texto}
    </span>
  );
}
