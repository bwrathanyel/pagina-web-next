import type { ItemCarrito } from "@/lib/carrito/store";
import { armarMensajes, type ResultadoCotizacion } from "@/lib/leads/buildCotizacion";

/** Checkout del carrito: cada item ya es un producto o promoción concreto
 * (el usuario ya eligió destino/tipo al agregarlo), así que a diferencia
 * del wizard completo esto solo pide nombre/teléfono — nunca vuelve a
 * preguntar destino, presupuesto o tipo de alojamiento. */
export function armarCarrito(
  items: ItemCarrito[],
  nombre: string,
  telefono: string,
  nota: string,
): ResultadoCotizacion {
  const destinos = [...new Set(items.map((i) => i.destino).filter((d): d is string => Boolean(d)))];
  const destino = destinos.join(" · ") || "Varios";

  const { emoji: mensajeEmoji, texto: mensajeTexto } = armarMensajes(
    "🛒 *SOLICITUD DESDE EL CARRITO - DESTINO Y EVENTOS LOTUS 360*",
    [
      ["👤", `*Nombre:* ${nombre}`],
      ...items.map(
        (i): [string, string] => [
          i.tipo === "promocion" ? "🔥" : "📍",
          `*${i.tipo === "promocion" ? "Promoción" : "Producto"}:* ${i.nombre}${i.destino ? ` (${i.destino})` : ""} — ${i.precioLabel}`,
        ],
      ),
      nota ? ["📝", `*Notas:* ${nota}`] : null,
    ],
    "✅ *Confirmar disponibilidad y precio final. ¡Gracias!*",
  );

  return {
    destino,
    servicio: items.map((i) => i.nombre).join(" + "),
    personas: "No especificado",
    consulta: `Carrito: ${items.map((i) => i.nombre).join(", ")}${nota ? ` · ${nota}` : ""}`,
    mensajeEmoji,
    mensajeTexto,
  };
}
