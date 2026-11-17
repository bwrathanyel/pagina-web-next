import type { Tarifa } from "@/types/supabase";
import { precioDeTarifa } from "@/lib/tarifas";
import { estimarEstadia, tarjetasPorHabitacion, type Estadia, type Estimado } from "./estimado";

/** Filtro de presentación: no cambia el motor compartido con CRM/checkout.
 * Sin fechas o edades completas se conserva el precio publicado, sin inventar
 * un total. Con los datos completos solo se ofrecen estadías cotizables. */
export function habitacionVisible(tarifa: Tarifa, filasHotel: Tarifa[], estadia: Estadia): { tarifa: Tarifa; estimado: Estimado | null } | null {
  if (/on[\s-]+request/i.test(tarifa.habitacion || tarifa.titulo || "")) return null;
  const calcular = !!(estadia.desde && estadia.hasta) && estadia.edades.every((e) => e !== null);
  const estimado = calcular ? estimarEstadia(tarifa, filasHotel, estadia) : null;
  if (estimado && (!estimado.ok || estimado.avisos.some((a) => /on[\s-]+request/i.test(a)))) return null;
  // El texto «A consultar» tampoco es un precio, aunque exista precio_texto.
  if (!estimado && !/^(?:[$€]\s*)?\d/.test(precioDeTarifa(tarifa)?.monto ?? "")) return null;
  return { tarifa, estimado };
}

export function habitacionesVisibles(tarifas: Tarifa[], filasHotel: Tarifa[], estadia: Estadia) {
  return tarjetasPorHabitacion(tarifas, estadia.desde).flatMap((tarjeta) => {
    const visible = habitacionVisible(tarjeta.tarifa, filasHotel, estadia);
    return visible ? [{ ...tarjeta, estimado: visible.estimado }] : [];
  });
}
