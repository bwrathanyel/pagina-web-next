"use client";

import Link from "next/link";
import { REDES } from "@/lib/social";
import { EstadoAtencion } from "@/components/layout/EstadoAtencion";
import { whatsappHref } from "@/lib/whatsapp";
import { BrandMark } from "@/components/layout/BrandMark";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";

function SocialIcon({ path }: { path: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  facebook: "M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z",
  instagram:
    "M12 2c2.7 0 3.1 0 4.1.1 1.1 0 1.8.2 2.5.4a5 5 0 0 1 2.9 2.9c.2.7.4 1.4.4 2.5.1 1 .1 1.4.1 4.1s0 3.1-.1 4.1c0 1.1-.2 1.8-.4 2.5a5 5 0 0 1-2.9 2.9c-.7.2-1.4.4-2.5.4-1 .1-1.4.1-4.1.1s-3.1 0-4.1-.1c-1.1 0-1.8-.2-2.5-.4a5 5 0 0 1-2.9-2.9c-.2-.7-.4-1.4-.4-2.5C2 15.1 2 14.7 2 12s0-3.1.1-4.1c0-1.1.2-1.8.4-2.5a5 5 0 0 1 2.9-2.9c.7-.2 1.4-.4 2.5-.4C8.9 2 9.3 2 12 2zm0 1.8c-2.6 0-3 0-4 .1-.9 0-1.4.2-1.7.3-.4.2-.7.3-1 .6-.3.3-.5.6-.6 1-.1.3-.3.8-.3 1.7-.1 1-.1 1.4-.1 4s0 3 .1 4c0 .9.2 1.4.3 1.7.2.4.3.7.6 1 .3.3.6.5 1 .6.3.1.8.3 1.7.3 1 .1 1.4.1 4 .1s3 0 4-.1c.9 0 1.4-.2 1.7-.3.4-.2.7-.3 1-.6.3-.3.5-.6.6-1 .1-.3.3-.8.3-1.7.1-1 .1-1.4.1-4s0-3-.1-4c0-.9-.2-1.4-.3-1.7-.2-.4-.3-.7-.6-1a2.7 2.7 0 0 0-1-.6c-.3-.1-.8-.3-1.7-.3-1-.1-1.4-.1-4-.1zm0 3.5a4.7 4.7 0 1 1 0 9.4 4.7 4.7 0 0 1 0-9.4zm0 1.8a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8zm4.9-2a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2z",
  tiktok:
    "M16.6 2h-3.2v13.7a3 3 0 1 1-2.1-2.9V9.5a6.2 6.2 0 1 0 5.3 6.1V8.4a8 8 0 0 0 4.9 1.7V6.9a4.8 4.8 0 0 1-4.9-4.9z",
};

export function Footer() {
  const { content } = useSiteContent();
  const navItems = content.navigation.items.filter((item) => item.visible);
  return (
    <footer className="bg-dusk">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-16">
        <div className="mb-12 grid gap-7 border-b border-dusk-text/12 pb-12 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <EditableText path="footer.eyebrow" as="p" className="mb-3 font-mono text-xs font-bold uppercase tracking-[0.18em] text-coral" />
            <EditableText path="footer.headline" as="p" multiline className="max-w-[15ch] text-balance font-display text-3xl font-semibold leading-tight text-dusk-text md:text-5xl" />
          </div>
          <a
            href={whatsappHref("Hola! Vengo de su página web y quiero comenzar a planificar un viaje.")}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white"
          >
            {content.footer.ctaLabel}
          </a>
        </div>

        <div className="mb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_1fr]">
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

          <nav aria-label="Catálogo" className="flex flex-col gap-2">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-dusk-text-soft">
              Catálogo
            </p>
            {navItems.map(({ id, href, label }) => (
              <Link
                key={id}
                href={href}
                className="text-sm text-dusk-text-soft hover:text-dusk-text"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-2">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-dusk-text-soft">
              Contacto
            </p>
            <a
              href={`mailto:${REDES.email}`}
              className="text-sm text-dusk-text-soft hover:text-dusk-text"
            >
              {REDES.email}
            </a>
            <div className="mt-1 flex gap-3">
              <a
                href={REDES.facebook}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-dusk-2 text-dusk-text"
              >
                <SocialIcon path={ICONS.facebook} />
              </a>
              <a
                href={REDES.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-dusk-2 text-dusk-text"
              >
                <SocialIcon path={ICONS.instagram} />
              </a>
              <a
                href={REDES.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-dusk-2 text-dusk-text"
              >
                <SocialIcon path={ICONS.tiktok} />
              </a>
            </div>
          </div>
        </div>

        <p className="border-t border-dusk-text/10 pt-6 text-xs text-dusk-text-soft">
          © {new Date().getFullYear()} {content.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
