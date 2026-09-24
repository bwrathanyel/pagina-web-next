"use client";

import Image from "next/image";
import { REDES } from "@/lib/social";
import { whatsappHref } from "@/lib/whatsapp";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Seccion } from "@/components/ui/Seccion";
import { Carrusel } from "@/components/ui/Carrusel";
import { Revelar } from "@/components/ui/Revelar";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { CLASE_ETIQUETA_SECCION, CLASE_TITULO_SECCION, EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";

const ROLES = [
  "Asesor de Ventas",
  "Asistente Administrativo",
  "Community Manager / Diseñador",
  "Asesor de Boletería",
  "Asesor de Ventas Freelance",
];

const CLASE_TITULO_TARJETA =
  "max-w-[16ch] text-balance font-display text-2xl font-bold leading-[1.05] tracking-[-0.01em] text-white lg:text-4xl";

/** Fusiona lo que antes eran tres piezas separadas -- carrusel móvil
 * (MasDeLotus) + TrabajaConNosotrosBanner + PlanesCorporativos, mostradas en
 * árboles paralelos `lg:hidden` / `hidden lg:block` (page.tsx). Ese patrón
 * fue justo lo que hizo que el pase mobile del 14-ago rompiera desktop sin
 * que nadie lo notara: se editaba una rama y la otra quedaba vieja. Ahora es
 * un solo árbol que gana contenido extra solo a partir de `lg` (descripción
 * larga, lista completa de roles) en vez de duplicar la sección entera. */
export function MasDeLotus() {
  const { content } = useSiteContent();
  const corporate = content.home.corporate;
  const primaryHref = corporate.primaryHref === "whatsapp"
    ? whatsappHref("Hola! Vengo de su página web y quiero información sobre planes corporativos.")
    : corporate.primaryHref;
  const secondaryHref = corporate.secondaryHref === "email" ? `mailto:${REDES.email}` : corporate.secondaryHref;

  return (
    <Seccion ritmo="densa">
      <EncabezadoSeccion titulo={<h2 className={CLASE_TITULO_SECCION + " text-ink"}>Más de Lotus 360</h2>} />

      {/* Sin `desktop`: horizontal en todos los tamaños, igual que
          HotSalesSection (2026-08-22). */}
      <Carrusel
        anchoItem="86%"
        maxItem="620px"
        flechas
        items={[
          <Revelar key="trabaja" className="h-full">
            <div className="sobre-dusk flex h-full flex-col justify-between rounded-card bg-dusk p-6 text-dusk-text lg:p-10">
              <div>
                <h3 className={CLASE_TITULO_TARJETA}>¿Y si su próximo destino es trabajar con nosotros?</h3>
                <p className={CLASE_ETIQUETA_SECCION + " text-gold"}>Estamos contratando</p>
                <p className="mt-4 hidden max-w-md leading-7 text-dusk-text-soft lg:block">
                  Buscamos gente para sumarse al equipo, en la oficina de Naguanagua y también en
                  modalidad freelance desde casa.
                </p>

                <ul className="mt-4 flex flex-wrap gap-1.5 lg:mt-6 lg:flex-col lg:gap-0">
                  {ROLES.map((rol) => (
                    <li
                      key={rol}
                      className="rounded-pill border border-dusk-text/15 px-2.5 py-1 text-xs text-dusk-text-soft lg:flex lg:items-center lg:gap-3 lg:rounded-none lg:border-0 lg:border-t lg:border-dashed lg:border-dusk-text/15 lg:px-0 lg:py-3 lg:text-sm lg:text-dusk-text"
                    >
                      <span aria-hidden="true" className="hidden h-1.5 w-1.5 shrink-0 rounded-full bg-gold lg:block" />
                      {rol}
                    </li>
                  ))}
                </ul>
              </div>
              <Boton
                href="/trabaja-con-nosotros"
                variante="firma"
                tamano="sm"
                className="mt-6 w-fit"
                iconoFin={<Icono nombre="flecha-der" tamano={16} />}
              >
                Ver vacantes
              </Boton>
            </div>
          </Revelar>,
          <Revelar key="corporativos" retraso={90} className="h-full">
            <div className="sobre-dusk flex h-full flex-col overflow-hidden rounded-card bg-dusk text-dusk-text">
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
                  <EditableText path="home.corporate.title" as="h3" className={CLASE_TITULO_TARJETA} />
                  <EditableText path="home.corporate.eyebrow" as="p" className={CLASE_ETIQUETA_SECCION + " text-coral-bright"} />
                  <EditableText path="home.corporate.description" as="p" multiline className="mt-4 hidden max-w-md leading-7 text-dusk-text-soft lg:block" />
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Boton href={primaryHref} variante="firma" tamano="sm" iconoFin={<Icono nombre="externo" tamano={16} />}>
                    {corporate.primaryLabel}
                  </Boton>
                  <span className="hidden lg:inline-flex">
                    <Boton href={secondaryHref} variante="sobre-foto" tamano="sm">
                      {corporate.secondaryLabel}
                    </Boton>
                  </span>
                </div>
              </div>
            </div>
          </Revelar>,
        ]}
      />
    </Seccion>
  );
}
