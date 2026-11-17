import type { AuthError } from "@supabase/supabase-js";

/** Correo que viaja entre formularios de acceso (registro -> entrar,
 * entrar -> recuperar). Solo sessionStorage: nunca en la URL. */
const CLAVE_CORREO = "lotus_auth_correo";

export function guardarCorreo(correo: string) {
  try {
    if (correo.trim()) sessionStorage.setItem(CLAVE_CORREO, correo.trim());
  } catch {
    /* sin almacenamiento */
  }
}

export function leerCorreo(): string {
  try {
    return sessionStorage.getItem(CLAVE_CORREO) ?? "";
  } catch {
    return "";
  }
}

export type TipoErrorAuth = "sin_confirmar" | "ya_existe" | "limite" | "red" | "credenciales" | "otro";

/** Clasifica un error de Supabase Auth por `code` (estable), no por el texto. */
export function tipoErrorAuth(error: Pick<AuthError, "code" | "status" | "name" | "message">): TipoErrorAuth {
  switch (error.code) {
    case "email_not_confirmed":
      return "sin_confirmar";
    case "user_already_exists":
    case "email_exists":
      return "ya_existe";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
      return "limite";
    case "invalid_credentials":
      return "credenciales";
  }
  if (error.status === 429) return "limite";
  if (error.status === 0 || error.name === "AuthRetryableFetchError" || /failed to fetch|network/i.test(error.message)) {
    return "red";
  }
  return "otro";
}

export const MENSAJE_LIMITE = "Demasiados intentos. Espere unos minutos e inténtelo de nuevo.";
export const MENSAJE_RED = "No hay conexión con el servidor. Revise su internet e inténtelo de nuevo.";
