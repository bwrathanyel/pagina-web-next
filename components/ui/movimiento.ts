import type { CSSProperties } from "react";

/* Clases de movimiento compartidas (DESIGN.md › Motion). Una sola fuente para
   que tocar, pasar el puntero y elegir se sientan igual en todo el sitio.
   Todas usan los tokens --dur-* y ease-salida; con reducir movimiento el
   desplazamiento y la escala se quitan y queda el cambio de color o sombra. */

/** Tarjeta o tira que es un enlace o un botón: se hunde un poco al tocar. */
export const PRESION_TARJETA =
  "transition-transform duration-[var(--dur-rapida)] ease-salida active:scale-[0.985] motion-reduce:active:scale-100";

/** Foto dentro de una tarjeta con `group`: acercamiento corto al pasar el puntero. */
export const FOTO_HOVER =
  "transition-transform duration-[var(--dur-media)] ease-salida motion-safe:group-hover:scale-[1.04]";

/** Tarjeta elevada por sombra (sin borde): sube 4px y pasa a la sombra lift. */
export const ELEVA_HOVER =
  "transition-[translate,box-shadow] duration-[var(--dur-media)] ease-salida motion-safe:hover:-translate-y-1 hover:shadow-lift";

/** Tarjeta de opción elegida: borde acento y fondo acento-suave (con check aparte). */
export const ELEGIDO = "border-acento bg-acento-suave";
/** Tarjeta de opción en reposo: borde línea, hover a línea fuerte. */
export const ELEGIBLE =
  "border-linea transition-[border-color,background-color,box-shadow] duration-[var(--dur-rapida)] ease-salida hover:border-linea-fuerte";

/** Entrada escalonada de una lista (`entra-card` en globals.css, `surge`). */
export const ENTRA_ESCALONADO = "entra-card";
/** Posición en la lista para `ENTRA_ESCALONADO`; el CSS la topa en 6. */
export const escalon = (n: number): CSSProperties => ({ "--n": n }) as CSSProperties;

/** Nombre de view transition de la foto de un producto. Mismo nombre en
 *  tarjeta, ficha y /cotizar para que la foto viaje entre páginas: el hotel de
 *  /cotizar (`hotel=`, `OfertaHotel.hotelId`) es el id del producto. */
export const nombreFoto = (productoId: number) => `foto-producto-${productoId}`;
