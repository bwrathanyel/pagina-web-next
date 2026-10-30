export const COOKIE_RETORNO_AUTH = "lotus_auth_next";

const SIN_RETORNO = /^\/(auth|cuenta\/(login|registro|recuperar|restablecer))(?=$|[/?#])/;

/** Solo rutas del propio sitio: "/x" sí; "//host", "/\host", URLs absolutas,
 * /auth y los formularios de acceso no (open redirect y bucles). */
export function rutaInterna(valor: string | null | undefined, porDefecto = "/cuenta") {
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return porDefecto;
  if (/[\u0000-\u001f\u007f\\]/.test(valor) || SIN_RETORNO.test(valor)) return porDefecto;
  return valor;
}

/** /auth y los formularios de acceso: ahí el panel de cuenta del header no se
 * abre (quedarían dos formularios de login, uno encima del otro). */
export function esFormularioAcceso(pathname: string) {
  return SIN_RETORNO.test(pathname);
}

/** Solo en el navegador (handlers/efectos): login que vuelve a esta página. */
export function urlLoginConRetorno() {
  return `/cuenta/login?next=${encodeURIComponent(location.pathname + location.search)}`;
}
