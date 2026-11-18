"use client";

import { useCurrency } from "@/components/providers/CurrencyProvider";
import type { Riel, TasaBcv } from "@/lib/checkout/calculo";
import { estimarBsCentavos, montoCentavos } from "@/lib/checkout/formato";
import { IVA_BS } from "@/lib/utils/convertirPrecio";

type Base = { precio: number; fee: number; total: number; ivaEnBs: boolean; plan?: { hoy: number } | null };

/** Pago Móvil: lo de hoy (total o cuota 1) a la tasa BCV de la tarifa (USD dólar, EUR euro; +16% si BT no incluye IVA),
 * de la misma tabla que usa el servidor. Estimado: el monto que se cobra lo fija el servidor al reservar. */
export function useBsHoy(totales: Base | null, riel: Riel | "" | null | undefined, tasa: TasaBcv | null) {
  const { tasaUSD, tasaEUR } = useCurrency();
  const tasaBcv = tasa === "EUR" ? tasaEUR : tasaUSD;
  if (riel !== "pago_movil" || !totales || !tasaBcv) return null;
  // El 16% va solo sobre la tarifa, no sobre el cargo web: misma cuenta que checkout_web_crear.
  const factor = totales.ivaEnBs ? (totales.precio * IVA_BS + totales.fee) / (totales.precio + totales.fee) : 1;
  const centavos = estimarBsCentavos(totales.plan ? totales.plan.hoy : totales.total, tasaBcv * factor);
  if (centavos === null) return null;
  return { monto: montoCentavos(centavos, "VES"), tasa: montoCentavos(Math.round(tasaBcv * 100), "VES") };
}
