import Link from "next/link";
import { CardPhotoGallery } from "@/components/catalogo/CardPhotoGallery";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";

export interface TicketCardProps {
  href: string | null;
  badge: string;
  nombre: string;
  destino: string | null;
  fotos: string[];
  // true cuando NINGUNA de estas fotos es real (todas generadas por IA
  // porque el producto/promoción no tenía ninguna) -- muestra un badge de
  // transparencia, nunca se oculta (ver esSoloReferencial en lib/supabase/fotos).
  fotosReferenciales?: boolean;
  cotizarHref: string;
  /** Descripción corta de largo parejo (promociones.resumen_ia). Se muestra en
   * un bloque de alto fijo para que todas las tarjetas de una grilla midan
   * igual y los botones queden a la misma altura. */
  resumen?: string | null;
  precioLabel: string;
  precioMuted: boolean;
  vigenciaLabel?: string | null;
  ninosGratis?: number | null;
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
  /** Chip clickeable al hotel dueño de la promoción. Solo se muestra cuando
   * hay href y nombre (una promo suelta o una card de producto no lo pasan). */
  hotel?: { nombre?: string | null; href: string | null } | null;
}

function HotelIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M10 21v-4a2 2 0 0 1 4 0v4" />
    </svg>
  );
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

export function TicketCard({
  href,
  badge,
  nombre,
  destino,
  fotos,
  fotosReferenciales = false,
  cotizarHref,
  resumen,
  precioLabel,
  precioMuted,
  vigenciaLabel,
  ninosGratis,
  enCarrito = false,
  onToggleCarrito,
  favorito = null,
  onToggleFavorito,
  pieAdmin,
  oculto = false,
  hotel,
}: TicketCardProps) {
  return (
    <div
      className={
        "group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-linea bg-card " +
        "shadow-card transition-[transform,scale,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] " +
        "hover:-translate-y-1.5 hover:border-coral/40 hover:shadow-lift active:scale-[0.985] " +
        (oculto ? "opacity-50" : "")
      }
    >
      <div className="group/foto relative aspect-[3/4] overflow-hidden bg-sand-2">
        <span className="absolute left-3 top-3 z-10 rounded-full border border-white/15 bg-dusk/90 px-3 py-1.5 font-mono text-[0.62rem] font-bold uppercase tracking-[0.1em] text-dusk-text shadow-sm backdrop-blur-sm">
          {badge}
        </span>
        {onToggleFavorito ? (
          <button
            type="button"
            onClick={onToggleFavorito}
            aria-label={favorito ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
            aria-pressed={favorito === true}
            className={
              "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-dusk/90 shadow-sm backdrop-blur-sm transition hover:scale-105 " +
              (favorito ? "text-coral-bright" : "text-dusk-text")
            }
          >
            <HeartIcon filled={favorito === true} />
          </button>
        ) : null}
        {fotos.length > 0 ? (
          <CardPhotoGallery fotos={fotos} alt={nombre} referencial={fotosReferenciales} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-seafoam-bg via-sand-2 to-card">
            <div className="relative rounded-2xl border border-linea bg-card/65 px-8 py-6 text-center text-ink-soft shadow-sm backdrop-blur-sm">
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

      <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5 sm:pb-4">
        {hotel?.href && hotel.nombre ? (
          <Link
            href={hotel.href}
            className="mb-1.5 inline-flex max-w-full items-center gap-1.5 self-start rounded-full border border-linea-fuerte bg-sand-2 px-2.5 py-1 text-[0.7rem] font-semibold text-ink transition hover:border-ink hover:bg-card"
          >
            <span className="flex-shrink-0"><HotelIcon /></span>
            <span className="truncate">{hotel.nombre}</span>
          </Link>
        ) : null}
        {destino ? (
          <p className="mb-1 font-mono text-[0.62rem] font-bold uppercase tracking-[0.12em] text-ink-soft">
            {destino}
          </p>
        ) : null}
        <h3 className="line-clamp-2 font-body text-[0.95rem] font-bold leading-snug text-ink sm:text-base">
          {href ? (
            <Link href={href} className="transition-colors hover:text-coral-bright">
              {nombre}
            </Link>
          ) : (
            nombre
          )}
        </h3>
        {resumen ? (
          <p className="mt-1.5 line-clamp-2 text-[0.8rem] leading-[1.3] text-ink-soft">
            {resumen}
          </p>
        ) : null}

        <p
          className={
            "mt-2 line-clamp-2 text-[0.82rem] font-bold leading-snug " +
            (precioMuted ? "text-ink-soft" : "text-ink")
          }
        >
          <PrecioMostrado texto={precioLabel} />
        </p>
        {/* Vigencia en UNA línea: es info comercial real (hasta cuándo se
            vende), pero el texto crudo puede traer dos fechas y romper la
            altura pareja. La ficha del producto la muestra completa. */}
        {vigenciaLabel ? (
          <p className="mt-1 line-clamp-1 text-[0.7rem] text-ink-soft">{vigenciaLabel}</p>
        ) : null}
        {ninosGratis && ninosGratis > 0 ? (
          <p className="mt-0.5 text-[0.7rem] text-ink-soft">
            {ninosGratis} {ninosGratis === 1 ? "niño gratis" : "niños gratis"}
          </p>
        ) : null}

        <div className="mt-auto flex gap-2 pt-3">
          <Link
            href={cotizarHref}
            aria-label={`Ver y cotizar ${nombre}`}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-coral px-3 text-sm font-bold text-white transition hover:brightness-95 sm:px-4"
          >
            {/* Solo ícono por debajo de sm: en la grilla de 2 columnas mobile
                el texto no cabe junto al botón de carrito (rediseño
                2026-08-14) -- el aria-label ya dice la acción completa. */}
            <span className="hidden sm:inline">Ver y cotizar</span>
            <span aria-hidden="true">↗</span>
          </Link>
          {onToggleCarrito ? (
            <button
              type="button"
              onClick={onToggleCarrito}
              aria-label={enCarrito ? `Quitar ${nombre} del carrito` : `Añadir ${nombre} al carrito`}
              aria-pressed={enCarrito}
              className={
                "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border transition " +
                (enCarrito
                  ? "border-coral bg-coral/10 text-coral"
                  : "border-linea-fuerte text-ink hover:border-ink hover:bg-sand-2")
              }
            >
              <CartIcon />
            </button>
          ) : null}
        </div>

        {pieAdmin}
      </div>
    </div>
  );
}
