"use client";

import { TicketCard } from "@/components/catalogo/TicketCard";
import { textoRangoCorto } from "@/lib/cotizador/estado";
import type { RutaVuelo } from "@/lib/cotizador/vuelo";
import {
  entradaInicial,
  esFijo,
  estimarPaquete,
  fechasPaquete,
  origenesValidos,
  planMostrado,
  tarifaInicial,
  tarifasDelPlan,
  vencido,
} from "@/lib/paquetes/precio";
import type { Paquete } from "@/lib/paquetes/tipos";
import { useHoy } from "@/lib/paquetes/useHoy";
import { montoConMoneda, type PrecioTarjeta } from "@/lib/tarifas";

const DOS_ADULTOS = { adultos: 2, edades: [], bebes: 0 };

const capitalizar = (s: string) => s.charAt(0).toLocaleUpperCase("es") + s.slice(1).toLocaleLowerCase("es");

/** Tarjeta del listado: el "desde por persona" es el paquete de 2 adultos con
 * el primer origen, la fecha y las noches por defecto, calculado en el
 * navegador con la fecha de hoy. */
export function PaqueteCard({ paquete, rutas, prioridad = false }: { paquete: Paquete; rutas: RutaVuelo[]; prioridad?: boolean }) {
  const hoy = useHoy();
  const fijo = esFijo(paquete);
  const f = fechasPaquete(paquete, hoy ? entradaInicial(paquete, hoy) : "", paquete.noches_default);
  const origenes = origenesValidos(paquete, rutas, f.desde);
  if (!origenes.length || (hoy && vencido(paquete, hoy))) return null;

  const plan = planMostrado(paquete.hotel.tarifas, paquete.plan);
  let precio: PrecioTarjeta | null = null;
  if (hoy) {
    const tarifas = tarifasDelPlan(paquete.hotel.tarifas, paquete.plan);
    const tarifa = tarifaInicial(tarifas, paquete.hotel.tarifaDestacadaId, { ...f, viajeros: DOS_ADULTOS });
    const est = estimarPaquete({ tarifa, tarifas, ...f, viajeros: DOS_ADULTOS, ruta: origenes[0].ruta, hoy });
    if (est.porPersona != null) {
      precio = { monto: montoConMoneda(est.porPersona, "USD"), unidad: "por persona en doble, con boleto", desde: true, corto: true };
    }
  }
  const href = `/paquete/${paquete.slug}`;

  return (
    <TicketCard
      href={href}
      cotizarHref={href}
      badge={paquete.etiqueta ?? undefined}
      nombre={paquete.titulo}
      subtitulo={paquete.hotel.nombre}
      destino={paquete.hotel.destino}
      fotos={paquete.hotel.fotos}
      prioridad={prioridad}
      precio={precio}
      duracion={`${f.noches} ${f.noches === 1 ? "noche" : "noches"}`}
      vigenciaLabel={
        fijo
          ? `Salida ${textoRangoCorto(paquete.fecha_entrada!, paquete.fecha_salida!)}`
          : `Usted elige la fecha · de ${paquete.noches_min} a ${paquete.noches_max} noches`
      }
      incluye={["Boleto ida y vuelta", plan ? capitalizar(plan) : "Hotel"]}
    />
  );
}
