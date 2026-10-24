/** Rutas de la compra directa (/reservar y /pagar/<token>). En el teléfono no llevan la
 * barra de pestañas ni a Solcito: tienen su propia barra fija con el total y la acción,
 * y el botón flotante caía encima del botón de pago. En escritorio no cambia nada. */
export function esRutaCheckout(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === "/reservar" || pathname.startsWith("/reservar/") || pathname.startsWith("/pagar/");
}
