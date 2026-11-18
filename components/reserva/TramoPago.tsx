"use client";

import { RIELES } from "@/lib/checkout/calculo";
import { detalleRiel, OpcionesModo, OpcionesRiel } from "./Opciones";
import { useBsHoy } from "./useBsHoy";
import type { Reserva } from "./useReserva";

type Props = {
  r: Pick<
    Reserva,
    "ofrecerPlan" | "modo" | "setModo" | "precio" | "plan" | "config" | "user" | "abrirCuenta" | "aceptaPlan" | "setAceptaPlan" | "errorDe" | "riel" | "poner" | "tasa" | "totales"
  >;
};

export function TramoPago({ r }: Props) {
  const { config, plan, riel, totales } = r;
  const ivaEnBs = !!totales?.ivaEnBs;
  const bs = useBsHoy(totales, riel, r.tasa);
  return (
    <>
      {r.ofrecerPlan ? (
        <OpcionesModo
          modo={r.modo}
          onElegir={r.setModo}
          plan={r.precio !== null || !plan?.disponible ? plan : null}
          pct={config?.plan_pct_inicial ?? 0}
          conSesion={Boolean(r.user)}
          onIniciarSesion={r.abrirCuenta}
          acepta={r.aceptaPlan}
          onAcepta={r.setAceptaPlan}
          error={r.errorDe("plan")}
        />
      ) : null}

      <OpcionesRiel
        riel={riel}
        rieles={config?.rieles ?? RIELES}
        onElegir={(x) => r.poner({ riel: x })}
        detalle={riel && config ? detalleRiel(riel, config, r.tasa, bs, ivaEnBs) : null}
        horas={config ? { usd: config.hold_horas_usd, ves: config.hold_horas_ves } : null}
        error={r.errorDe("riel")}
      />
    </>
  );
}
