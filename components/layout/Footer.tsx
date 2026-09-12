"use client";

import Link from "next/link";
import { REDES } from "@/lib/social";
import { EstadoAtencion } from "@/components/layout/EstadoAtencion";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { BrandMark } from "@/components/layout/BrandMark";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { SocialIcon, ICONS } from "@/components/layout/SocialIcon";

function CaretIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 transition-transform group-open:rotate-180 md:hidden"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

/** Enlaces/contacto de cada columna, factorizados para no repetir el mismo
 * `map`/markup en la versión acordeón (móvil) y la estática (md+) --
 * auditoría redesign desktop 2026-08-22. */
function EnlacesCatalogo({ navItems }: { navItems: { id: string; href: string; label: string }[] }) {
  return (
    <nav aria-label="Catálogo" className="flex flex-col gap-2">
      {navItems.map(({ id, href, label }) => (
        <Link key={id} href={href} className="text-sm text-dusk-text-soft hover:text-dusk-text">
          {label}
        </Link>
      ))}
    </nav>
  );
}

function InfoContacto() {
  return (
    <div className="flex flex-col gap-2">
      <a href={`mailto:${REDES.email}`} className="text-sm text-dusk-text-soft hover:text-dusk-text">
        {REDES.email}
      </a>
      <div className="mt-1 flex gap-3">
        {(["facebook", "instagram", "tiktok"] as const).map((red) => (
          <a
            key={red}
            href={REDES[red]}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={red === "facebook" ? "Facebook" : red === "instagram" ? "Instagram" : "TikTok"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-dusk-2 text-dusk-text"
          >
            <SocialIcon path={ICONS[red]} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function Footer() {
  const { content } = useSiteContent();
  const navItems = content.navigation.items.filter((item) => item.visible);
  return (
    <footer className="grano relative bg-dusk">
      <div className="mx-auto max-w-[var(--ancho-contenido)] px-5 py-9 md:py-16">
        <div className="mb-8 grid gap-7 border-b border-dusk-text/12 pb-8 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <EditableText path="footer.eyebrow" as="p" className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral-bright" />
            <EditableText path="footer.headline" as="p" multiline className="max-w-[15ch] text-balance font-display text-3xl font-semibold leading-tight text-dusk-text md:text-5xl" />
          </div>
          <WhatsAppLeadButton
            mensajeBase="Hola! Vengo de su página web y quiero comenzar a planificar un viaje."
            triggerClassName="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white"
          >
            {content.footer.ctaLabel}
          </WhatsAppLeadButton>
        </div>

        <div className="mb-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_1fr]">
          <div className="max-w-xs">
            <div className="mb-3 flex items-center gap-2.5">
              <BrandMark dark size="sm" />
              <span className="max-w-[13rem] font-display text-lg font-bold leading-tight text-dusk-text">
                {content.brand.name}
              </span>
            </div>
            <EditableText path="footer.description" as="p" multiline className="mb-3 text-sm text-dusk-text-soft" />
            <EstadoAtencion />
          </div>

          {/* Columnas de links como acordeón en móvil (ahorra ~150px de
              scroll en cada página). En md+ NO se fuerza abierto el mismo
              <details> (hack [&>*]:!block, retirado en el rediseño desktop
              2026-08-22) -- se renderiza una columna nativa aparte, más
              simple y sin pisar el display nativo de <details>. */}
          <details className="group md:hidden">
            <summary className="mb-1 flex list-none items-center justify-between font-mono text-xs uppercase tracking-wide text-dusk-text-soft [&::-webkit-details-marker]:hidden">
              Catálogo
              <CaretIcon />
            </summary>
            <div className="pt-2">
              <EnlacesCatalogo navItems={navItems} />
            </div>
          </details>
          <div className="hidden md:block">
            <p className="mb-3 font-mono text-xs uppercase tracking-wide text-dusk-text-soft">Catálogo</p>
            <EnlacesCatalogo navItems={navItems} />
          </div>

          <details className="group md:hidden">
            <summary className="mb-1 flex list-none items-center justify-between font-mono text-xs uppercase tracking-wide text-dusk-text-soft [&::-webkit-details-marker]:hidden">
              Contacto
              <CaretIcon />
            </summary>
            <div className="pt-2">
              <InfoContacto />
            </div>
          </details>
          <div className="hidden md:block">
            <p className="mb-3 font-mono text-xs uppercase tracking-wide text-dusk-text-soft">Contacto</p>
            <InfoContacto />
          </div>
        </div>

        <p className="border-t border-dusk-text/10 pt-6 text-xs text-dusk-text-soft">
          © {new Date().getFullYear()} {content.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
