// Lógica sin DOM del talón de pago y del estado «verificando».

/** «Copiar todo»: un bloque pegable en una nota o en el chat del banco. */
export function textoCopiarTodo({
  titulo, monto, datos, codigo,
}: {
  titulo: string;
  monto: string;
  datos: { etiqueta: string; valor: string }[];
  codigo?: string | null;
}): string {
  return [
    `${titulo} · Destino y Eventos Lotus 360`,
    `Monto exacto: ${monto}`,
    ...datos.map((d) => `${d.etiqueta}: ${d.valor}`),
    codigo ? `Concepto: Reserva ${codigo}` : null,
  ].filter(Boolean).join("\n");
}

/** Refresco de «verificando»: 1 min los primeros 10, 2 min hasta la media hora, después 5 min. Nunca se corta. */
export function intervaloRefresco(transcurridoMs: number): number {
  if (transcurridoMs < 10 * 60_000) return 60_000;
  if (transcurridoMs < 30 * 60_000) return 2 * 60_000;
  return 5 * 60_000;
}
