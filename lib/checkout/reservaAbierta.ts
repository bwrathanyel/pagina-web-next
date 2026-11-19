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

const ERROR_DESCARTAR: Record<string, string> = {
  pago_en_curso: "Esta reserva ya tiene un pago declarado y lo está revisando una persona. Si quiere cambiarla, escríbanos por WhatsApp.",
  demasiadas_solicitudes: "Demasiados intentos seguidos. Espere unos minutos y vuelva a intentarlo.",
};

/** Suelta en la base la reserva que quedó esperando pago (libera el cupo) y la olvida en este navegador.
 * Devuelve el texto del error para mostrar, o null si quedó descartada. Un token que la base ya no
 * reconoce cuenta como descartada: no hay nada que soltar. */
export async function descartarReservaAbierta(token: string): Promise<string | null> {
  let error = "";
  try {
    const res = await fetch("/api/checkout/descartar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    if (data?.ok !== true) error = data?.error ?? "servicio_no_disponible";
  } catch {
    error = "servicio_no_disponible";
  }
  if (error && error !== "token_invalido") return ERROR_DESCARTAR[error] ?? "No se pudo descartar ahora. Intente de nuevo en un momento.";
  olvidarReservaAbierta(token);
  return null;
}
