"use client";

import Image from "next/image";
import Link from "next/link";
import { whatsappHref } from "@/lib/whatsapp";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Seccion } from "@/components/ui/Seccion";
import { Carrusel } from "@/components/ui/Carrusel";

const ROLES = [
  "Asesor de Ventas",
  "Asistente Administrativo",
  "Community Manager / Diseñador",
  "Asesor de Boletería",
  "Asesor de Ventas Freelance",
];

/** Versión móvil compacta de TrabajaConNosotrosBanner + PlanesCorporativos:
 * en 360px esas dos secciones sumaban ~1100px de scroll que casi nadie
 * llegaba a ver -- acá van como 2 tarjetas en un carrusel (rediseño
 * 2026-08-14). Desktop sigue mostrando las dos secciones completas por
 * separado (ver app/page.tsx), esto NO las reemplaza ahí. */
export function MasDeLotus() {
  const { content } = useSiteContent();
  const corporate = content.home.corporate;
  const primaryHref = corporate.primaryHref === "whatsapp"
    ? whatsappHref("Hola! Vengo de su página web y quiero información sobre planes corporativos.")
    : corporate.primaryHref;

  return (
    <Seccion ritmo="densa" className="lg:hidden">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">
        Más de Lotus 360
      </p>

      <Carrusel
        anchoItem="86%"
        maxItem="330px"
        items={[
          <div key="trabaja" className="flex h-full flex-col justify-between rounded-[28px] bg-dusk p-6 text-dusk-text">
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-gold">
                Estamos contratando
              </p>
              <h3 className="max-w-[16ch] text-balance font-display text-2xl font-semibold leading-tight">
                ¿Y si tu próximo destino es trabajar con nosotros?
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ROLES.map((rol) => (
                  <span key={rol} className="rounded-full border border-dusk-text/15 bg-dusk-2 px-2.5 py-1 text-[11px] text-dusk-text-soft">
                    {rol}
                  </span>
                ))}
              </div>
            </div>
            <Link
              href="/trabaja-con-nosotros"
              className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-dusk"
            >
              Ver vacantes
              <span aria-hidden="true">↗</span>
            </Link>
          </div>,
          <div key="corporativos" className="flex h-full flex-col overflow-hidden rounded-[28px] bg-dusk text-dusk-text">
            <div className="relative h-32 w-full">
              <Image src={corporate.image} alt="Equipo planificando una experiencia corporativa" fill sizes="330px" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-dusk via-dusk/10 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col justify-between p-6 pt-4">
              <div>
                <EditableText path="home.corporate.eyebrow" as="p" className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral-bright" />
                <EditableText path="home.corporate.title" as="h3" className="max-w-[16ch] text-balance font-display text-2xl font-semibold leading-tight" />
              </div>
              <a
                href={primaryHref}
                target={primaryHref.startsWith("http") ? "_blank" : undefined}
                rel={primaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
                className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-coral px-5 text-sm font-semibold text-white"
              >
                {corporate.primaryLabel}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>,
        ]}
      />
    </Seccion>
  );
}
