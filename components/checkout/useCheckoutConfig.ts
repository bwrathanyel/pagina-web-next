"use client";

import { useEffect, useState } from "react";

// Parámetros públicos del checkout (GET /api/checkout). Una sola consulta por minuto para toda
// la pestaña: la ficha (caja de precio + barra móvil) y /reservar la comparten, así el botón no
// hace dos fetch ni salta dos veces.

export interface CheckoutConfig {
  activo: boolean;
  /** Dentro de la ventana de atención (8 a 20 h de Venezuela por defecto). */
  abierto: boolean;
  hora_abre: number;
  hora_cierra: number;
  fee_pct: number;
  igtf_pct: number;
  hold_horas_usd: number;
  hold_horas_ves: number;
  /** true = no se pudo consultar (red caída): se trata como apagado, pero se puede reintentar. */
  fallo?: boolean;
}

const APAGADO: CheckoutConfig = {
  activo: false, abierto: false, hora_abre: 8, hora_cierra: 20,
  fee_pct: 0, igtf_pct: 0, hold_horas_usd: 24, hold_horas_ves: 2,
};
const TTL_MS = 60_000;

const num = (v: unknown, def: number) => (typeof v === "number" && Number.isFinite(v) ? v : def);

function normalizar(j: unknown): CheckoutConfig {
  const c = (j && typeof j === "object" ? j : {}) as Record<string, unknown>;
  if (c.ok !== true) return { ...APAGADO, fallo: true };
  return {
    activo: c.activo === true,
    abierto: c.abierto !== false,
    hora_abre: num(c.hora_abre, APAGADO.hora_abre),
    hora_cierra: num(c.hora_cierra, APAGADO.hora_cierra),
    fee_pct: num(c.fee_pct, 0),
    igtf_pct: num(c.igtf_pct, 0),
    hold_horas_usd: num(c.hold_horas_usd, APAGADO.hold_horas_usd),
    hold_horas_ves: num(c.hold_horas_ves, APAGADO.hold_horas_ves),
  };
}

let cache: { t: number; p: Promise<CheckoutConfig> } | null = null;

export function cargarCheckoutConfig(forzar = false): Promise<CheckoutConfig> {
  if (!forzar && cache && Date.now() - cache.t < TTL_MS) return cache.p;
  const p = fetch("/api/checkout", { cache: "no-store" })
    .then((r) => r.json())
    .then(normalizar)
    .catch((): CheckoutConfig => ({ ...APAGADO, fallo: true }));
  const entrada = { t: Date.now(), p };
  cache = entrada;
  // Un fallo no se cachea: el próximo componente (o «Reintentar») vuelve a preguntar.
  p.then((c) => { if (c.fallo && cache === entrada) cache = null; });
  return p;
}

/** null mientras carga. */
export function useCheckoutConfig(): { config: CheckoutConfig | null; reintentar: () => void } {
  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [vuelta, setVuelta] = useState(0);
  useEffect(() => {
    let vivo = true;
    cargarCheckoutConfig(vuelta > 0).then((c) => { if (vivo) setConfig(c); });
    return () => { vivo = false; };
  }, [vuelta]);
  return { config, reintentar: () => { setConfig(null); setVuelta((n) => n + 1); } };
}
