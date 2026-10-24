// «Reserva abierta»: /reservar guarda aquí el link de pago recién creado para ofrecer «Continuar al
// pago» si el cliente cierra la pestaña. /pagar la borra cuando el pago deja de estar pendiente.
export const CLAVE_RESERVA_ABIERTA = "lotus-reserva-abierta";

export function olvidarReservaAbierta(token: string) {
  try {
    const r = JSON.parse(localStorage.getItem(CLAVE_RESERVA_ABIERTA) ?? "null") as { token?: string } | null;
    if (r?.token === token) localStorage.removeItem(CLAVE_RESERVA_ABIERTA);
  } catch {
    /* sin almacenamiento */
  }
}
