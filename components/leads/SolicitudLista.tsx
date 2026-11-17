import type { ReactNode } from "react";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { EstadoIlustrado } from "@/components/ui/EstadoIlustrado";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { SelloDestino } from "@/components/ui/SelloDestino";
import { selloDestino } from "@/lib/arte";

/** Cierre de una solicitud (carrito, cotizador, opción de cotización): el
 * pase ya emitido, con el envío por WhatsApp en el talón. El lead ya entró al
 * CRM antes de mostrarse; el botón solo abre la conversación con el asesor. */
export function SolicitudLista({
  waHref,
  detalle,
  titulo = "Su solicitud está lista",
  nivel = "h2",
  boton = "Enviar a un asesor",
  destino,
  children,
}: {
  waHref: string;
  /** Línea en mono sobre el título: qué se pidió ("3 elementos", "Hospedaje"). */
  detalle?: ReactNode;
  titulo?: string;
  /** h1 cuando la confirmación reemplaza a toda la página (carrito). */
  nivel?: "h1" | "h2";
  /** Texto del botón de WhatsApp ("Enviar a Ambar" cuando se sabe el asesor). */
  boton?: string;
  /** Destino de la solicitud: su sello se estampa en el boleto. Sin él, va la ilustración. */
  destino?: string;
  children?: ReactNode;
}) {
  const Titulo = nivel;
  const conSello = !!destino && !!selloDestino(destino);
  return (
    <Boleto
      tamanoTalon="6rem"
      talon={
        <div className="flex h-full items-center px-5">
          <Boton href={waHref} variante="whatsapp" tamano="lg" ancho iconoInicio={<WhatsAppIcon size={20} />}>
            {boton}
          </Boton>
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      <div className={`relative flex flex-col gap-3 p-6 ${conSello ? "pr-24" : ""}`} role="status">
        {conSello && destino ? (
          <SelloDestino destino={destino} tamano={72} className="estampa absolute right-4 top-4 -rotate-8 text-acento opacity-80" />
        ) : null}
        {detalle ? (
          <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{detalle}</p>
        ) : null}
        <div className="flex items-center gap-4">
          {conSello ? null : <EstadoIlustrado estado="solicitud-enviada" tamano={5} />}
          <Titulo className="font-display text-3xl font-bold leading-tight text-ink">{titulo}</Titulo>
        </div>
        <div className="text-ink-soft">
          {children ?? "Envíela por WhatsApp y un asesor le responde con los detalles."}
        </div>
      </div>
    </Boleto>
  );
}
