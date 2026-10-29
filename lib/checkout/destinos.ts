// Destinos con compra directa (reservar y pagar en la web). Una sola fuente para el botón, /reservar
// y el POST de /api/checkout: en el tarifario Margarita aparece como «Margarita» e «Isla Margarita».
const COMPRA_DIRECTA = /margarita/;

export function esDestinoCompraDirecta(destino?: string | null): boolean {
  if (!destino) return false;
  return COMPRA_DIRECTA.test(destino.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase());
}
