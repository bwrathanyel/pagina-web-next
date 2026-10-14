"use client";

import { useSearchParams } from "next/navigation";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { clasesBoton } from "@/components/ui/Boton";

/** CTA del catálogo corporativo: crea el lead con origen "aliado:<slug>" y abre
 * el WhatsApp del asesor asignado. "Cotizar" en una tarjeta llega con
 * ?destino=<producto> y lo deja escrito en el formulario. */
export function SolicitudAliado({ slug, nombre, descuento }: { slug: string; nombre: string; descuento: number }) {
  const destino = (useSearchParams().get("destino") ?? "").slice(0, 120);
  return (
    <div className="flex flex-col gap-3">
      {destino ? (
        <p className="text-ink-soft">
          Servicio elegido: <strong className="text-ink">{destino}</strong>
        </p>
      ) : null}
      <WhatsAppLeadButton
        key={destino}
        origen={`aliado:${slug}`}
        destinoInicial={destino}
        mensajeBase={`Hola, vengo del catálogo corporativo de ${nombre} (descuento de aliado ${descuento}%).`}
        triggerClassName={clasesBoton({ variante: "whatsapp", tamano: "lg", className: "w-full sm:w-auto" })}
      >
        <WhatsAppIcon size={20} />
        Solicitar cotización corporativa
      </WhatsAppLeadButton>
    </div>
  );
}
