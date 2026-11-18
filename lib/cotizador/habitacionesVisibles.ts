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

/** La tarifa que anuncia una oferta y, si no da precio para esa estadía (un
 * flyer sin grilla, una promo de otras fechas), la habitación más barata del
 * hotel que sí lo da: el cliente ve el precio real, no «a confirmar». El regalo
 * de niños es de la promo anunciada: con otra tarifa no se aplica. */
export function opcionDeOferta(
  anunciada: Tarifa | null,
  filasHotel: Tarifa[],
  estadia: Estadia,
): { tarifa: Tarifa; estimado: Estimado | null } | null {
  const propia = anunciada ? habitacionVisible(anunciada, filasHotel, estadia) : null;
  if (propia) return propia;
  if (!estadia.desde || !estadia.hasta || estadia.edades.some((e) => e === null)) return null;
  const sinRegalo = { ...estadia, ninosGratis: undefined };
  let mejor: { tarifa: Tarifa; estimado: Estimado; total: number } | null = null;
  for (const h of habitacionesVisibles(filasHotel, filasHotel, sinRegalo)) {
    const est = h.estimado;
    if (est?.ok && (!mejor || est.total < mejor.total)) mejor = { tarifa: h.tarifa, estimado: est, total: est.total };
  }
  if (!mejor) return null;
  const est = mejor.estimado;
  const aviso = anunciada?.titulo && est.ok ? `La promoción «${anunciada.titulo.trim()}» no cubre esta estadía: precio de la tarifa ${mejor.tarifa.titulo?.trim() || "vigente"}.` : null;
  return { tarifa: mejor.tarifa, estimado: aviso && est.ok ? { ...est, avisos: [aviso, ...est.avisos] } : est };
}

export function habitacionesVisibles(tarifas: Tarifa[], filasHotel: Tarifa[], estadia: Estadia) {
  return tarjetasPorHabitacion(tarifas, estadia.desde).flatMap((tarjeta) => {
    const visible = habitacionVisible(tarjeta.tarifa, filasHotel, estadia);
    return visible ? [{ ...tarjeta, estimado: visible.estimado }] : [];
  });
}
