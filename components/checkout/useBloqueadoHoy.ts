"use client";

import { useEffect, useState } from "react";
import { bloqueosEnFechas } from "@/lib/cotizador/hotel";
import { hoyCaracas, sumarDias } from "@/lib/cotizador/estado";

// ¿El hotel tiene stop sale entre hoy y los próximos 7 días? Las tarjetas del catálogo y el hero
// lo preguntan a la vez: los ids que llegan en el mismo tick van en una sola consulta a
// `web_stop_sales`, y la respuesta se guarda un minuto por hotel (mismo TTL que el checkout).
// /reservar y el POST de /api/checkout vuelven a validar contra las fechas reales.

const DIAS = 7;
const TTL_MS = 60_000;

const cache = new Map<number, { t: number; p: Promise<boolean> }>();
let pendientes: Map<number, (v: boolean) => void> | null = null;

function despachar() {
  const lote = pendientes!;
  pendientes = null;
  const desde = hoyCaracas();
  bloqueosEnFechas([...lote.keys()], desde, sumarDias(desde, DIAS))
    .then((m) => lote.forEach((ok, id) => ok((m.get(id) ?? []).some((b) => b.estado === "stop_sale"))))
    .catch(() => {
      // Sin red no se esconde el botón ni se cachea el fallo: el servidor revalida al pagar.
      lote.forEach((ok, id) => { cache.delete(id); ok(false); });
    });
}

function consultar(id: number): Promise<boolean> {
  const previa = cache.get(id);
  if (previa && Date.now() - previa.t < TTL_MS) return previa.p;
  const p = new Promise<boolean>((ok) => {
    if (!pendientes) {
      pendientes = new Map();
      queueMicrotask(despachar);
    }
    pendientes.set(id, ok);
  });
  cache.set(id, { t: Date.now(), p });
  return p;
}

/** null mientras carga o sin hotel; true = stop sale en la semana. */
export function useBloqueadoHoy(productoId: number | null): boolean | null {
  const [estado, setEstado] = useState<{ id: number; bloqueado: boolean } | null>(null);
  useEffect(() => {
    if (!productoId) return;
    let vivo = true;
    consultar(productoId).then((bloqueado) => { if (vivo) setEstado({ id: productoId, bloqueado }); });
    return () => { vivo = false; };
  }, [productoId]);
  return productoId && estado?.id === productoId ? estado.bloqueado : null;
}
