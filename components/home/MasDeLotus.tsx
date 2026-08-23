"use client";

import Image from "next/image";
import Link from "next/link";
import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Seccion } from "@/components/ui/Seccion";
import { Carrusel } from "@/components/ui/Carrusel";
import { Revelar } from "@/components/ui/Revelar";

const ROLES = [
  "Asesor de Ventas",
  "Asistente Administrativo",
  "Community Manager / Diseñador",
  "Asesor de Boletería",
  "Asesor de Ventas Freelance",
];

/** Fusiona lo que antes eran tres piezas separadas -- carrusel móvil
 * (MasDeLotus) + TrabajaConNosotrosBanner + PlanesCorporativos, mostradas en
 * árboles paralelos `lg:hidden` / `hidden lg:block` (page.tsx). Ese patrón
 * fue justo lo que hizo que el pase mobile del 14-ago rompiera desktop sin
 * que nadie lo notara: se editaba una rama y la otra quedaba vieja. Ahora es
 * un solo árbol -- las dos tarjetas del `Carrusel` pasan a grilla en `sm:`
 * (como hace HotSalesSection) y ganan contenido extra solo a partir de `lg`
 * (descripción larga, lista completa de roles) en vez de duplicar la
 * sección entera (redesign desktop 2026-08-22). */
export function MasDeLotus() {
  const { content } = useSiteContent();
  const corporate = content.home.corporate;
  const primaryHref = corporate.primaryHref === "whatsapp"
    ? whatsappHref("Hola! Vengo de su página web y quiero información sobre planes corporativos.")
    : corporate.primaryHref;
  const secondaryHref = corporate.secondaryHref === "email" ? `mailto:${REDES.email}` : corporate.secondaryHref;

  return (
    <Seccion ritmo="densa">
      <p className="mb-4 font-mono text-xs font-bold uppercase tracking-[0.16em] text-ink-soft">
        Más de Lotus 360
      </p>

      {/* Sin `desktop`: horizontal en todos los tamaños, igual que
          HotSalesSection (2026-08-22). */}
      <Carrusel
        anchoItem="86%"
        maxItem="620px"
        flechas
        items={[
          <Revelar key="trabaja" className="h-full">
          <div className="flex h-full flex-col justify-between rounded-[28px] bg-dusk p-6 text-dusk-text lg:p-10">
            <div>
              <p className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-gold">
                Estamos contratando
              </p>
              <h3 className="max-w-[16ch] text-balance font-display text-2xl font-semibold leading-tight lg:max-w-[15ch] lg:text-3xl">
                ¿Y si tu próximo destino es trabajar con nosotros?
              </h3>
              <p className="mt-4 hidden max-w-md leading-7 text-dusk-text-soft lg:block">
                Buscamos gente para sumarse al equipo, en la oficina de Naguanagua y también en
                modalidad freelance desde casa.
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
                {ROLES.map((rol) => (
                  <span key={rol} className="rounded-full border border-dusk-text/15 bg-dusk-2 px-2.5 py-1 text-[11px] text-dusk-text-soft">
                    {rol}
                  </span>
                ))}
              </div>
              <ul className="mt-5 hidden flex-col gap-2 lg:flex">
                {ROLES.map((rol) => (
                  <li key={rol} className="flex items-center gap-3 rounded-2xl border border-dusk-text/12 bg-dusk-2 px-4 py-2.5 text-sm text-dusk-text">
                    <span aria-hidden="true" className="text-gold">✦</span>
                    {rol}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/trabaja-con-nosotros"
              className="mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-dusk"
            >
              Ver vacantes
              <span aria-hidden="true">↗</span>
            </Link>
          </div>
          </Revelar>,
          <Revelar key="corporativos" retraso={90} className="h-full">
          <div className="flex h-full flex-col overflow-hidden rounded-[28px] bg-dusk text-dusk-text">
            <div className="relative h-32 w-full lg:h-48">
              <Image
                src={corporate.image}
                alt="Equipo planificando una experiencia corporativa"
                fill
                sizes="(min-width: 1024px) 42vw, 330px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-dusk via-dusk/10 to-transparent" />
            </div>
            <div className="flex flex-1 flex-col justify-between p-6 pt-4 lg:p-10 lg:pt-6">
              <div>
                <EditableText path="home.corporate.eyebrow" as="p" className="mb-2 font-mono text-xs font-bold uppercase tracking-[0.16em] text-coral-bright" />
                <EditableText path="home.corporate.title" as="h3" className="max-w-[16ch] text-balance font-display text-2xl font-semibold leading-tight lg:text-3xl" />
                <EditableText path="home.corporate.description" as="p" multiline className="mt-3 hidden max-w-md leading-7 text-dusk-text-soft lg:block" />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a
                  href={primaryHref}
                  target={primaryHref.startsWith("http") ? "_blank" : undefined}
                  rel={primaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-coral px-5 text-sm font-semibold text-white"
                >
                  {corporate.primaryLabel}
                  <span aria-hidden="true">↗</span>
                </a>
                <a
                  href={secondaryHref}
                  className="hidden min-h-11 items-center rounded-full border border-dusk-text/20 px-5 text-sm font-semibold text-dusk-text lg:inline-flex"
                >
                  {corporate.secondaryLabel}
                </a>
              </div>
            </div>
          </div>
          </Revelar>,
        ]}
      />
    </Seccion>
  );
}
