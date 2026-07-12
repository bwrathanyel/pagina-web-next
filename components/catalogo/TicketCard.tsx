import Image from "next/image";
import Link from "next/link";
import { whatsappHref } from "@/lib/whatsapp";

export interface TicketCardProps {
  href: string | null;
  badge: string;
  nombre: string;
  destino: string | null;
  fotoUrl: string | null;
  precioLabel: string;
  precioMuted: boolean;
}

function WhatsappIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8 8 0 1 1 12 20zm4.4-5.9c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1s-.7.8-.8.9-.3.2-.5.1a6.6 6.6 0 0 1-1.9-1.2 7 7 0 0 1-1.3-1.6c-.1-.2 0-.4.1-.5l.4-.4.2-.4v-.4c-.1-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2c0 1.3.9 2.6 1.1 2.8s1.7 2.7 4.1 3.7a5.6 5.6 0 0 0 2.4.6c.9 0 1.5-.4 1.7-.7a1.4 1.4 0 0 0 .1-.9c-.1-.1-.2-.2-.5-.3z" />
    </svg>
  );
}

export function TicketCard({
  href,
  badge,
  nombre,
  destino,
  fotoUrl,
  precioLabel,
  precioMuted,
}: TicketCardProps) {
  return (
    <div className="relative rounded-2xl bg-[#FFFDF8] shadow-[0_10px_28px_-14px_rgba(36,31,26,0.28)]">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-2xl bg-sand-2">
        <span className="absolute left-3 top-3 z-10 rounded-full bg-dusk/85 px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-wide text-dusk-text">
          {badge}
        </span>
        {fotoUrl ? (
          <Image
            src={fotoUrl}
            alt={nombre}
            fill
            sizes="(min-width: 700px) 33vw, 100vw"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="relative mx-4 border-t-2 border-dashed border-ink/20">
        <span className="absolute -left-6 -top-2 h-4 w-4 rounded-full bg-sand" aria-hidden="true" />
        <span className="absolute -right-6 -top-2 h-4 w-4 rounded-full bg-sand" aria-hidden="true" />
      </div>

      <div className="px-5 pb-5 pt-4">
        <p className="font-body text-base font-bold text-ink">{nombre}</p>
        {destino ? <p className="mb-3 text-sm text-ink-soft">{destino}</p> : <div className="mb-3" />}

        <span
          className={
            "mb-3 inline-block rounded-full px-2.5 py-1 font-mono text-[0.82rem] " +
            (precioMuted
              ? "bg-seafoam-bg text-seafoam-text"
              : "bg-gradient-to-br from-coral to-gold text-btn-ink")
          }
        >
          {precioLabel}
        </span>

        <div className="flex gap-2">
          {href ? (
            <Link
              href={href}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-ink px-4 text-sm font-semibold text-ink"
            >
              Ver detalle
            </Link>
          ) : null}
          <a
            href={whatsappHref(`Hola! Quiero info de ${nombre}`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cotizar ${nombre} por WhatsApp`}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-whatsapp text-white"
          >
            <WhatsappIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
