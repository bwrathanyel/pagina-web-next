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
export function urlLoginConRetorno(aviso?: "vencida") {
  const base = `/cuenta/login?next=${encodeURIComponent(location.pathname + location.search)}`;
  return aviso ? `${base}&aviso=${aviso}` : base;
}

/** Marca de «cerré sesión yo»: quien cierra navega por su cuenta, así que
 * RequiereSesion no debe mandar a otro lado (dos navegaciones, destello y un
 * login más en el historial). Vive en memoria: no sobrevive a recargar. */
let salidaVoluntaria = false;
export const marcarSalidaVoluntaria = (valor: boolean) => {
  salidaVoluntaria = valor;
};
export const huboSalidaVoluntaria = () => salidaVoluntaria;

/** Solo en el navegador: deja la ruta de retorno en la cookie que ya usa el
 * acceso con Google (/auth/callback la lee y la borra). */
export function guardarRetorno(ruta: string, segundos = 600) {
  const seguro = location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${COOKIE_RETORNO_AUTH}=${encodeURIComponent(ruta)}; path=/; max-age=${segundos}; samesite=lax${seguro}`;
}

/** Solo en el navegador: lee y borra la cookie de retorno. */
export function tomarRetorno(): string {
  const par = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE_RETORNO_AUTH}=`));
  document.cookie = `${COOKIE_RETORNO_AUTH}=; path=/; max-age=0; samesite=lax`;
  return rutaInterna(par ? decodeURIComponent(par.slice(COOKIE_RETORNO_AUTH.length + 1)) : null);
}
