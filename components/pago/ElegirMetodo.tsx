"use client";

import { useState } from "react";
import { ROTULO } from "@/components/reserva/PaseFechas";
import { Aviso } from "@/components/ui/Aviso";
import { fechaHoraVenezuela, montoCentavos } from "@/lib/checkout/formato";
import type { PagoConRiel, PagoPublico, RielPago } from "@/lib/pago/pagar";
import { PagoPendiente } from "./PagoPendiente";

const METODOS: Record<string, { titulo: string; detalle: string }> = {
  zelle: { titulo: "Zelle", detalle: "En dólares desde su banco en EE. UU." },
  pago_movil: { titulo: "Pago Móvil", detalle: "En bolívares, a la tasa del BCV de hoy." },
  binance: { titulo: "Binance (USDT)", detalle: "En USDT por Binance Pay." },
};

/** El monto que ve el cliente según el método: Bs con la tasa del día, USDT o US$ tal cual. */
function conMetodo(pago: PagoPublico, riel: RielPago): PagoConRiel {
  const usd = pago.monto_usd_centavos ?? pago.monto_centavos;
  const o = pago.opciones;
  if (riel === "pago_movil" && o?.bs_centavos && o.tasa_hoy) {
    return { ...pago, riel, moneda: "VES", monto_centavos: o.bs_centavos, tasa_usd_ves: o.tasa_hoy };
  }
  return { ...pago, riel, moneda: riel === "binance" ? "USDT" : "USD", monto_centavos: usd, tasa_usd_ves: null };
}

/** Link del asesor sin método fijo: el cliente elige cómo pagar y recién ahí ve los datos. */
export function ElegirMetodo({
  pago, token, onDeclarado, onVencer,
}: {
  pago: PagoPublico;
  token: string;
  onDeclarado: () => void;
  onVencer: () => void;
}) {
  const [riel, setRiel] = useState<RielPago | null>(null);
  const o = pago.opciones;
  const sinTasa = !o?.bs_centavos || !o.tasa_hoy;

  if (riel) {
    return <PagoPendiente pago={conMetodo(pago, riel)} token={token} onDeclarado={onDeclarado} onVencer={onVencer} onCambiarMetodo={() => setRiel(null)} />;
  }

  const usd = montoCentavos(pago.monto_usd_centavos ?? pago.monto_centavos, "USD");
  const rieles = (o?.rieles ?? ["zelle", "pago_movil", "binance"]).filter((r) => METODOS[r]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink">¿Cómo quiere pagar?</h1>
        <p className={ROTULO + " mt-2"}>{pago.tipo === "abono" ? "Abono / reserva" : "Pago total"}</p>
        <p className="mt-3 font-mono text-3xl font-bold tabular-nums text-ink">{usd}</p>
        <p className="mt-1 text-sm text-ink-soft">Link válido hasta el {fechaHoraVenezuela(pago.expira_en)}.</p>
      </header>

      <ul className="flex flex-col gap-3" aria-label="Métodos de pago">
        {rieles.map((r) => {
          const bs = r === "pago_movil";
          const apagado = bs && sinTasa;
          const monto = bs
            ? apagado ? "Tasa no disponible" : montoCentavos(o!.bs_centavos!, "VES")
            : montoCentavos(pago.monto_usd_centavos ?? pago.monto_centavos, r === "binance" ? "USDT" : "USD");
          return (
            <li key={r}>
              <button
                type="button"
                disabled={apagado}
                onClick={() => setRiel(r)}
                className="flex w-full items-center justify-between gap-4 rounded-card border border-linea bg-card p-5 text-left transition hover:border-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="min-w-0">
                  <span className="block font-display text-xl font-bold text-ink">{METODOS[r].titulo}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">
                    {bs && !apagado
                      ? `Tasa ${pago.tasa_tipo === "EUR" ? "euro" : "dólar"} del BCV: ${montoCentavos(Math.round(o!.tasa_hoy! * 100), "VES")}`
                      : METODOS[r].detalle}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-ink">{monto}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {sinTasa ? <Aviso>Hoy no tenemos la tasa del BCV cargada, así que Pago Móvil no está disponible. Puede pagar por Zelle o Binance, o escribirle a su asesor.</Aviso> : null}
      <p className="text-center text-sm text-ink-soft">Verificamos cada pago a mano. Nunca le pediremos claves ni datos de tarjeta.</p>
    </div>
  );
}
