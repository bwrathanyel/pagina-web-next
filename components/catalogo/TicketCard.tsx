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
  enCarrito?: boolean;
  onToggleCarrito?: () => void;
  /** null = sesión no iniciada (el corazón igual se ve, pero al tocarlo
   * manda a /cuenta/login en vez de guardar). */
  favorito?: boolean | null;
  onToggleFavorito?: () => void;
  /** Slot para la barra de controles de admin (Modo Edición) — se renderiza
   * abajo de todo, la card no sabe nada de roles ni de qué hay adentro. */
  pieAdmin?: React.ReactNode;
  oculto?: boolean;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.7 1.8 4 5.5 4c2.1 0 3.6 1.1 4.5 2.3C10.9 5.1 12.4 4 14.5 4 18.2 4 19.7 7.7 18 11.2c-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 3h2l2.6 12.6a2 2 0 0 0 2 1.4h8.8a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
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
  enCarrito = false,
  onToggleCarrito,
  favorito = null,
  onToggleFavorito,
  pieAdmin,
  oculto = false,
}: TicketCardProps) {
  return (
    <div
      className={
        "group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-ink/10 bg-card " +
        "shadow-[0_18px_50px_-30px_rgba(36,31,26,0.5)] transition duration-300 " +
        "hover:-translate-y-1 hover:border-ink/15 hover:shadow-[0_24px_58px_-28px_rgba(36,31,26,0.45)] " +
        (oculto ? "opacity-50" : "")
      }
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-2">
        <span className="absolute left-4 top-4 z-10 rounded-lg border border-white/15 bg-dusk/90 px-3 py-1.5 font-mono text-[0.66rem] font-bold uppercase tracking-[0.12em] text-dusk-text shadow-sm backdrop-blur-sm">
          {badge}
        </span>
        {onToggleFavorito ? (
          <button
            type="button"
            onClick={onToggleFavorito}
            aria-label={favorito ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
            aria-pressed={favorito === true}
            className={
              "absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-dusk/90 shadow-sm backdrop-blur-sm transition hover:scale-105 " +
              (favorito ? "text-coral" : "text-dusk-text")
            }
          >
            <HeartIcon filled={favorito === true} />
          </button>
        ) : null}
        {fotoUrl ? (
          <Image
            src={fotoUrl}
            alt={nombre}
            fill
            sizes="(min-width: 700px) 33vw, 100vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-seafoam-bg via-sand-2 to-card">
            <div className="relative rounded-2xl border border-ink/10 bg-card/65 px-8 py-6 text-center text-ink-soft shadow-sm backdrop-blur-sm">
              <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mx-auto mb-3" aria-hidden="true">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <circle cx="8.5" cy="10" r="1.5" />
                <path d="m4 17 4.5-4 3.5 3 2.5-2 5.5 3" />
              </svg>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em]">Imagen por confirmar</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-5 sm:px-6 sm:pb-6">
        {destino ? (
          <p className="mb-2 font-mono text-[0.68rem] font-bold uppercase tracking-[0.13em] text-coral">
            {destino}
          </p>
        ) : null}
        <h3 className="font-body text-lg font-bold leading-snug text-ink">{nombre}</h3>

        <div
          className={
            "mb-5 mt-4 rounded-xl border px-4 py-3 " +
            (precioMuted
              ? "border-seafoam/20 bg-seafoam-bg text-seafoam-text"
              : "border-coral/20 bg-coral/10 text-ink")
          }
        >
          <p className="mb-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] opacity-70">
            {precioMuted ? "Disponibilidad" : "Tarifa referencial"}
          </p>
          <p className="text-sm font-bold leading-snug">{precioLabel}</p>
        </div>

        <div className="mt-auto flex gap-2">
          {href ? (
            <Link
              href={href}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-ink/20 px-3 text-sm font-bold text-ink transition hover:border-ink hover:bg-ink hover:text-card"
            >
              Ver detalles
            </Link>
          ) : null}
          {onToggleCarrito ? (
            <button
              type="button"
              onClick={onToggleCarrito}
              aria-label={enCarrito ? `Quitar ${nombre} del carrito` : `Añadir ${nombre} al carrito`}
              aria-pressed={enCarrito}
              className={
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border transition " +
                (enCarrito
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-ink/20 text-ink hover:border-ink hover:bg-sand-2")
              }
            >
              <CartIcon />
            </button>
          ) : null}
          <a
            href={whatsappHref(`Hola! Quiero info de ${nombre}`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Cotizar ${nombre} por WhatsApp`}
            className="flex h-11 flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-whatsapp px-3.5 text-sm font-bold text-white transition hover:brightness-95"
          >
            <WhatsappIcon />
            <span>Cotizar</span>
          </a>
        </div>

        {pieAdmin}
      </div>
    </div>
  );
}
