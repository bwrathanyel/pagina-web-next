// Política de cambios y cancelaciones de la compra directa. Mientras sea null, /reservar no deja
// comprar (el cliente tiene que ver y aceptar la política ANTES de pagar) y /terminos no muestra
// la sección. Cada elemento es un párrafo.
// Redactada por Claude y aprobada por el dueño con dos ajustes: devolución completa solo si no hay
// disponibilidad y el cliente no es flexible; sin reembolso si ya viajó o el inconveniente es ajeno.
export const POLITICA_CANCELACION: string[] | null = [
  "Su reserva queda confirmada cuando una persona de nuestro equipo verifica su pago. Hasta entonces el cupo está retenido por el plazo que se le muestra antes de pagar; si no paga a tiempo, la reserva se libera sola y no se le cobra nada.",
  "Si pagó después de vencido el plazo, escríbanos por WhatsApp con su código de reserva: revisamos si el cupo sigue disponible. Si ya no hay disponibilidad para sus fechas y usted no tiene flexibilidad para cambiarlas, le devolvemos el monto completo.",
  "Una vez confirmada, la reserva está sujeta a la política de cancelación del hotel y de la tarifa elegida. Las tarifas en promoción pueden ser no reembolsables.",
  "Para cambiar fechas o cancelar, escríbanos por WhatsApp o al correo con su código de reserva lo antes posible. Si el hotel acepta el cambio o la cancelación, le devolvemos lo que el hotel reembolse, descontadas las comisiones bancarias y el IGTF cuando aplique.",
  "No hay reembolso si el viaje ya se realizó, ni cuando el inconveniente que motiva la solicitud es ajeno a Lotus 360.",
];
