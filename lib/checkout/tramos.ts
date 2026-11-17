// Tramos de /reservar: qué bloque está terminado y a cuál se pasa después. En el teléfono los
// terminados se pliegan a una línea; en escritorio solo cambian de aspecto.

export type TramoId = "fechas" | "habitacion" | "pago" | "datos";

export const ORDEN_TRAMOS: readonly TramoId[] = ["fechas", "habitacion", "pago", "datos"];

type Errores = Record<"fechas" | "edades" | "precio" | "plan" | "riel" | "nombre" | "telefono" | "email", string | null>;

/** Un tramo está terminado si no le queda ningún error; la habitación, además, necesita precio. */
export function tramosCompletos(errores: Errores, conPrecio: boolean): Record<TramoId, boolean> {
  const fechas = !errores.fechas && !errores.edades;
  return {
    fechas,
    habitacion: fechas && conPrecio && !errores.precio,
    pago: !errores.plan && !errores.riel,
    datos: !errores.nombre && !errores.telefono && !errores.email,
  };
}

/** El tramo que acaba de terminarse (antes no, ahora sí) y el primero pendiente después de él.
 * null si nada se terminó o si no queda nada pendiente detrás. */
export function siguienteTramo(antes: Record<TramoId, boolean>, ahora: Record<TramoId, boolean>, orden: readonly TramoId[] = ORDEN_TRAMOS): TramoId | null {
  const i = orden.findIndex((t) => ahora[t] && !antes[t]);
  if (i < 0) return null;
  return orden.slice(i + 1).find((t) => !ahora[t]) ?? null;
}
