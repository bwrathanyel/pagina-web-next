// Excursiones y Traslados deshabilitados al público (pedido del dueño,
// 2026-10-21). Para reactivarlos: vaciar estas dos listas; el resto del código
// (rutas, tarifas, fichas) sigue intacto.
export const CATEGORIAS_OCULTAS: readonly string[] = ["excursiones", "traslados"];
export const TIPOS_OCULTOS: readonly string[] = ["excursion", "traslado"];

export const tipoOculto = (tipo: string | null | undefined) => !!tipo && TIPOS_OCULTOS.includes(tipo);

/** Enlace del menú que apunta a una categoría oculta (el contenido del menú es
 * editable desde el panel y puede traer "/catalogo/excursiones" guardado). */
export function esEnlaceOculto(href: string): boolean {
  const m = /^\/catalogo\/([^/?#]+)/.exec(href.trim());
  return !!m && CATEGORIAS_OCULTAS.includes(m[1]);
}

export const itemMenuPublico = (item: { visible: boolean; href: string }) =>
  item.visible && !esEnlaceOculto(item.href);
