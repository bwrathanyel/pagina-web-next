"use client";

import Image from "next/image";
import Link from "next/link";
import { Boton } from "@/components/ui/Boton";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { useCarritoStore } from "@/lib/carrito/store";
import { usePaneles } from "@/lib/layout/paneles";

/** Carrito en hoja: se ve y se ajusta desde cualquier página sin perder el
 * lugar. La solicitud (nombre, WhatsApp, envío al asesor) sigue en /carrito.
 * Los precios son texto de cada tarifa, por eso no hay total. */
export function CarritoHoja() {
  const abierta = usePaneles((s) => s.carritoAbierto);
  const cerrar = usePaneles((s) => s.cerrarCarrito);
  const items = useCarritoStore((s) => s.items);
  const quitar = useCarritoStore((s) => s.quitar);
  const cantidad = items.length;

  return (
    <Hoja
      abierta={abierta}
      onCerrar={cerrar}
      titulo="Su carrito"
      escritorio="lateral"
      pie={
        cantidad > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-soft">
              {cantidad} {cantidad === 1 ? "elemento" : "elementos"}. Solo faltan sus datos para que un asesor lo contacte.
            </p>
            <Boton href="/carrito" onClick={cerrar} variante="primario" tamano="lg" ancho iconoFin={<Icono nombre="flecha-der" />}>
              Continuar con mi solicitud
            </Boton>
          </div>
        ) : null
      }
    >
      {cantidad === 0 ? (
        <div className="flex flex-col items-start gap-4 py-6">
          <p className="text-ink-soft">
            Todavía no ha agregado nada. Guarde hoteles, tours o promociones para cotizarlos juntos.
          </p>
          <Boton href="/catalogo/promociones" onClick={cerrar} variante="secundario" tamano="md">
            Ver promociones
          </Boton>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.key} className="flex items-center gap-3 rounded-card bg-sand-2 p-3">
              <Link
                href={item.href}
                onClick={cerrar}
                className="relative h-16 w-16 shrink-0 overflow-hidden rounded-media bg-sand"
                aria-label={`Ver ${item.nombre}`}
                tabIndex={-1}
              >
                {item.fotoUrl ? <Image src={item.fotoUrl} alt="" fill sizes="64px" className="object-cover" /> : null}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={item.href} onClick={cerrar} className="block truncate font-semibold text-ink">
                  {item.nombre}
                </Link>
                {item.destino ? <p className="truncate text-sm text-ink-soft">{item.destino}</p> : null}
                <p className="font-mono text-sm text-ink">{item.precioLabel}</p>
              </div>
              <button
                type="button"
                onClick={() => quitar(item.key)}
                aria-label={`Quitar ${item.nombre} del carrito`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-ink-soft transition-colors duration-150 hover:bg-card hover:text-peligro"
              >
                <Icono nombre="basura" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Hoja>
  );
}
