import type { ReactNode } from "react";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";

/** Cierre de una solicitud (carrito, cotizador, opción de cotización): el
 * pase ya emitido, con el envío por WhatsApp en el talón. El lead ya entró al
 * CRM antes de mostrarse; el botón solo abre la conversación con el asesor. */
export function SolicitudLista({
  waHref,
  detalle,
  titulo = "Su solicitud está lista",
  nivel = "h2",
  children,
}: {
  waHref: string;
  /** Línea en mono sobre el título: qué se pidió ("3 elementos", "Hospedaje"). */
  detalle?: ReactNode;
  titulo?: string;
  /** h1 cuando la confirmación reemplaza a toda la página (carrito). */
  nivel?: "h1" | "h2";
  children?: ReactNode;
}) {
  const Titulo = nivel;
  return (
    <Boleto
      tamanoTalon="6rem"
      talon={
        <div className="flex h-full items-center px-5">
          <Boton href={waHref} variante="whatsapp" tamano="lg" ancho iconoInicio={<WhatsAppIcon size={20} />}>
            Enviar a un asesor
          </Boton>
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-6" role="status">
        {detalle ? (
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{detalle}</p>
        ) : null}
        <Titulo className="font-display text-3xl font-bold leading-tight text-ink">{titulo}</Titulo>
        <div className="text-ink-soft">
          {children ?? "Envíela por WhatsApp y un asesor le responde con los detalles."}
        </div>
      </div>
    </Boleto>
  );
}
