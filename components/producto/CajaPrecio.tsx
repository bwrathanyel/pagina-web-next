import { Boleto } from "@/components/ui/Boleto";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import {
  fechaCorta,
  precioDeTarifa,
  rangoFechas,
  separarMonto,
  tarifaDestacada,
  ventaHasta,
  ventanasDe,
} from "@/lib/tarifas";
import type { Producto } from "@/types/supabase";

/** Caja de precio de la ficha: el boleto de la tarjeta, con la tarifa destacada
 * arriba y el talón con las dos salidas (Cotizar y WhatsApp). En escritorio la
 * fija la página junto a la columna de texto; en el teléfono es un bloque más
 * y el CTA que sigue a la vista es el pie de `ProductoFooterMobile`. */
export function CajaPrecio({ producto, className = "" }: { producto: Producto; className?: string }) {
  // La destacada la elige la base; el detalle de las demás vive en la carpeta.
  const destacada = tarifaDestacada(producto);
  const precio = precioDeTarifa(destacada);
  const { monto, unidad, grande } = separarMonto(precio);
  const ventana = destacada ? ventanasDe(destacada)[0] : undefined;
  const vigencia = ventana ? rangoFechas(ventana) : (destacada?.vigencia_texto ?? null);
  const hasta = ventaHasta(destacada);
  const mensaje = `Hola! Quiero información sobre ${producto.nombre}${producto.destino ? ` en ${producto.destino}` : ""}.`;

  return (
    <aside aria-label="Precio y contacto" className={className}>
      <Boleto
        tamanoTalon="5rem"
        talon={
          <div className="flex h-full items-center gap-2 px-4">
            <Boton
              href={`/cotizar/producto/${producto.id}`}
              tamano="sm"
              className="min-w-0 flex-1"
              iconoFin={<Icono nombre="flecha-der" tamano={16} />}
            >
              Cotizar
            </Boton>
            <WhatsAppLeadButton
              mensajeBase={mensaje}
              destinoInicial={producto.destino ?? ""}
              triggerClassName={clasesBoton({ variante: "whatsapp", tamano: "sm", className: "min-w-0 flex-1" })}
            >
              <WhatsAppIcon size={18} />
              WhatsApp
            </WhatsAppLeadButton>
            <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
          </div>
        }
      >
        <div className="px-5 pb-4 pt-5">
          <p className="truncate font-mono text-xs font-bold uppercase tracking-widest text-ink-soft">
            {producto.destino || producto.nombre}
          </p>
          <p className="mt-2 flex items-baseline gap-1.5 font-mono tabular-nums">
            {precio?.desde ? <span className="text-xs font-semibold text-ink-soft">desde</span> : null}
            <span
              className={
                "font-bold " +
                (!precio
                  ? "text-base text-ink-soft"
                  : grande
                    ? "text-3xl leading-none text-acento"
                    : "text-base text-ink")
              }
            >
              {precio ? <PrecioMostrado texto={monto} /> : "Consultar disponibilidad"}
            </span>
          </p>
          {unidad ? <p className="mt-1 text-sm text-ink-soft">{unidad}</p> : null}

          {vigencia ? (
            <div className="mt-4 border-t border-dashed border-linea-fuerte pt-3">
              <p className="flex items-center gap-2 font-mono text-sm text-ink">
                <Icono nombre="calendario" tamano={16} className="text-ink-soft" />
                {vigencia}
              </p>
              {hasta ? <p className="mt-1 pl-6 text-xs text-ink-soft">Venta hasta {fechaCorta(hasta)}</p> : null}
            </div>
          ) : null}
          {destacada && producto.tarifas && producto.tarifas.length > 1 ? (
            <a
              href="#tarifas"
              className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-acento hover:underline"
            >
              Ver las {producto.tarifas.length} promociones
              <Icono nombre="chevron-abajo" tamano={16} />
            </a>
          ) : null}
        </div>
      </Boleto>
    </aside>
  );
}
