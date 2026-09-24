/** Fila de filtros pegada bajo la barra del sitio (pestañas de categoría,
 * chips de destino). Sangra hasta el borde del <main> (-mx-5; la fila de
 * adentro pone su px-5) y tapa con el fondo lo que pasa por debajo. `top`
 * sigue a --offset-sticky con la misma duración con que la barra del móvil se
 * oculta, así no queda un hueco arriba. Tiene que ser hija de un bloque alto
 * (el <main> o la lista): sticky no sale de su padre. */
export const FILA_FIJA =
  "sticky top-(--offset-sticky) z-20 -mx-5 border-b border-linea bg-sand py-1 transition-[top] duration-500 ease-salida motion-reduce:transition-none";
