"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import { RIELES } from "@/lib/checkout/calculo";
import { IVA_BS } from "@/lib/utils/convertirPrecio";
import { estimarBsCentavos, montoCentavos } from "@/lib/checkout/formato";
import { detalleRiel, OpcionesModo, OpcionesRiel } from "./Opciones";
import type { Reserva } from "./useReserva";

type Props = {
  r: Pick<
    Reserva,
    "ofrecerPlan" | "modo" | "setModo" | "precio" | "plan" | "config" | "user" | "abrirCuenta" | "aceptaPlan" | "setAceptaPlan" | "errorDe" | "riel" | "poner" | "tasa" | "totales"
  >;
};

export function TramoPago({ r }: Props) {
  const { config, plan, riel, totales } = r;
  // Pago Móvil: lo de hoy (total o cuota 1) a la tasa BCV euro (+16% si BT no incluye IVA), de la misma
  // tabla que usa el servidor.
  const { tasaUSD, tasaEUR } = useCurrency();
  const tasaBcv = r.tasa === "EUR" ? tasaEUR : tasaUSD;
  // El 16% va solo sobre la tarifa, no sobre el cargo web: misma cuenta que checkout_web_crear.
  const ivaEnBs = !!totales?.ivaEnBs;
  const factor = ivaEnBs && totales ? (totales.precio * IVA_BS + totales.fee) / (totales.precio + totales.fee) : 1;
  const centavos =
    riel === "pago_movil" && totales && tasaBcv
      ? estimarBsCentavos(totales.plan ? totales.plan.hoy : totales.total, tasaBcv * factor)
      : null;
  const bs = centavos !== null && tasaBcv ? { monto: montoCentavos(centavos, "VES"), tasa: montoCentavos(Math.round(tasaBcv * 100), "VES") } : null;
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
