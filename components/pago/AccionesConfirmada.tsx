"use client";

import { useCopiar } from "@/components/checkout/DatoCopiable";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { rangoFechas } from "@/lib/checkout/formato";
import { icsReserva } from "@/lib/pago/ics";
import type { ReservaWeb } from "@/lib/pago/pagar";
import { hospedajeDe } from "./ResumenCompra";

/** Reserva confirmada: llevarla al calendario y mandarla a quien viaja con uno. */
export function AccionesConfirmada({ reserva }: { reserva: ReservaWeb }) {
  const h = hospedajeDe(reserva);
  const { copiado, manual, copiar } = useCopiar();

  function alCalendario() {
    if (!h) return;
    const ics = icsReserva({
      codigo: reserva.codigo,
      hotel: h.hotel ?? h.descripcion,
      habitacion: h.habitacion,
      entrada: h.fecha_inicio,
      salida: h.fecha_fin,
      enlace: window.location.href,
    });
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `reserva-${reserva.codigo}.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  async function compartir() {
    const lugar = h?.hotel ? ` en ${h.hotel}` : "";
    const fechas = h ? ` (${rangoFechas(h.fecha_inicio, h.fecha_fin)})` : "";
    const texto = `Mi reserva ${reserva.codigo}${lugar}${fechas} con Destino y Eventos Lotus 360 está confirmada.`;
    const url = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: `Reserva ${reserva.codigo}`, text: texto, url });
        return;
      } catch (e) {
        if ((e as DOMException)?.name === "AbortError") return; // el cliente cerró la hoja de compartir
      }
    }
    await copiar(`${texto} ${url}`);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      {h ? (
        <Boton type="button" variante="secundario" tamano="md" ancho iconoInicio={<Icono nombre="calendario" tamano={18} />} onClick={alCalendario}>
          Agregar al calendario
        </Boton>
      ) : null}
      <Boton
        type="button"
        variante="secundario"
        tamano="md"
        ancho
        iconoInicio={<Icono nombre={copiado ? "check" : "enviar"} tamano={18} />}
        onClick={() => void compartir()}
      >
        {copiado ? "Enlace copiado" : "Compartir mi reserva"}
      </Boton>
      <span className="sr-only" aria-live="polite">
        {copiado ? "Enlace de la reserva copiado" : manual ? "Mantenga presionado el enlace del navegador para copiarlo" : ""}
      </span>
    </div>
  );
}
