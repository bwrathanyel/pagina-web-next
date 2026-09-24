"use client";

import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Revelar } from "@/components/ui/Revelar";
import { clasesBoton } from "@/components/ui/Boton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { CLASE_TITULO_SECCION } from "@/components/ui/EncabezadoSeccion";

/** Banda dusk de confianza, la única oscura entre el hero y el footer: la
 * promesa del asesor con su WhatsApp a un toque. Los tres datos se leen como
 * los campos de un pase de abordar: separados por la perforación, alineados a
 * la izquierda. */
export function AcompanamientoSection() {
  const { content } = useSiteContent();
  return (
    <section className="sobre-dusk relative bg-dusk-2 px-5 py-[var(--ritmo-seccion)] text-dusk-text md:py-[var(--ritmo-seccion-md)]">
      <div className="mx-auto grid max-w-[var(--ancho-contenido)] gap-8 md:grid-cols-[1.2fr_1fr] md:items-center md:gap-12">
        <Revelar>
          <EditableText path="home.trust.headline" as="h2" className={CLASE_TITULO_SECCION + " text-white"} />
          <WhatsAppLeadButton
            mensajeBase="Hola! Vengo de su página web y quiero hablar con un asesor."
            triggerClassName={clasesBoton({ variante: "whatsapp", className: "mt-6 md:mt-8" })}
          >
            <WhatsAppIcon size={18} />
            Hablar con un asesor
          </WhatsAppLeadButton>
        </Revelar>
        <Revelar
          escalonar
          retraso={120}
          className="grid grid-cols-3 border-t-2 border-dashed border-dusk-text/25 pt-5 md:border-t-0 md:pt-0"
        >
          {content.home.trust.stats.map((_, index) => (
            <div key={index} className="min-w-0 border-l-2 border-dashed border-dusk-text/25 px-3 first:border-l-0 first:pl-0 md:px-5">
              <EditableText
                path={`home.trust.stats.${index}.title`}
                as="p"
                className="truncate font-display text-xl font-bold text-gold md:text-3xl"
              />
              <EditableText path={`home.trust.stats.${index}.detail`} as="p" className="mt-1 text-sm text-dusk-text-soft" />
            </div>
          ))}
        </Revelar>
      </div>
    </section>
  );
}
