import Link from "next/link";
import { CardPhotoGallery } from "@/components/catalogo/CardPhotoGallery";
import { Boleto, TalonPrecio } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { BotonFavorito } from "@/components/ui/BotonFavorito";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";

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
  /** Portada con prioridad alta: solo las primeras tarjetas de una lista. */
  prioridad?: boolean;
}

// Tarjeta de catálogo como pase de abordar: foto y datos arriba; el talón de
// abajo (tras la perforación) lleva el destino como código y el precio en mono.
// Se eleva con borde, no con sombra: la máscara de las muescas recortaría una.
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
  prioridad = false,
}: TicketCardProps) {
  return (
    <Boleto
      tamanoTalon="5.25rem"
      className={
        "h-full transition-[transform,border-color] duration-[var(--dur-media)] ease-salida " +
        "hover:-translate-y-1 hover:border-linea-fuerte motion-reduce:transition-none " +
        (oculto ? "opacity-50" : "")
      }
      talon={
        <TalonPrecio
          codigo={destino}
          precio={precioLabel}
          nota={vigenciaLabel}
          apagado={precioMuted}
        />
      }
    >
      <div className="flex h-full flex-col">
        <div className="group/foto relative aspect-[3/4] overflow-hidden bg-sand-2">
          <Etiqueta tono="dusk" className="absolute left-3 top-3 z-10 backdrop-blur-sm">
            {badge}
          </Etiqueta>
          {onToggleFavorito ? (
            <BotonFavorito
              activo={favorito}
              nombre={nombre}
              onToggle={onToggleFavorito}
              className="absolute right-2 top-2 z-10"
            />
          ) : null}
          {fotos.length > 0 ? (
            <CardPhotoGallery fotos={fotos} alt={nombre} referencial={fotosReferenciales} prioridad={prioridad} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-seafoam-bg via-sand-2 to-card">
              <div className="rounded-card border border-linea bg-card/65 px-8 py-6 text-center text-ink-soft backdrop-blur-sm">
                <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mx-auto mb-3" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="m4 17 4.5-4 3.5 3 2.5-2 5.5 3" />
                </svg>
                <p className="font-mono text-xs font-bold uppercase tracking-widest">Imagen por confirmar</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5 sm:px-5">
          {hotel?.href && hotel.nombre ? (
            <Link
              href={hotel.href}
              className="mb-1.5 inline-flex max-w-full items-center gap-1.5 self-start rounded-pill border border-linea-fuerte bg-sand-2 px-2.5 py-1 text-xs font-semibold text-ink transition-colors hover:border-ink hover:bg-card"
            >
              <Icono nombre="hotel" tamano={14} />
              <span className="truncate">{hotel.nombre}</span>
            </Link>
          ) : null}
          <h3 className="line-clamp-2 font-body text-base font-bold leading-snug text-ink">
            {href ? (
              <Link href={href} className="transition-colors hover:text-acento">
                {nombre}
              </Link>
            ) : (
              nombre
            )}
          </h3>
          {resumen ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-snug text-ink-soft">{resumen}</p>
          ) : null}
          {ninosGratis && ninosGratis > 0 ? (
            <p className="mt-2">
              <Etiqueta tono="seafoam">
                {ninosGratis} {ninosGratis === 1 ? "niño gratis" : "niños gratis"}
              </Etiqueta>
            </p>
          ) : null}

          <div className="mt-auto flex gap-2 pt-3">
            {/* Solo ícono por debajo de sm: en la grilla de 2 columnas mobile
                el texto no cabe junto al botón de carrito -- el aria-label ya
                dice la acción completa. */}
            <Boton
              href={cotizarHref}
              aria-label={`Ver y cotizar ${nombre}`}
              tamano="sm"
              className="flex-1 max-sm:gap-0 max-sm:px-3"
              iconoFin={<Icono nombre="flecha-der" tamano={16} />}
            >
              <span className="hidden sm:inline">Ver y cotizar</span>
            </Boton>
            {onToggleCarrito ? (
              <button
                type="button"
                onClick={onToggleCarrito}
                // Botón de alternar: el nombre no cambia, el estado lo dice aria-pressed.
                aria-label={`${nombre} en el carrito`}
                aria-pressed={enCarrito}
                className={
                  "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-control border transition-colors duration-150 " +
                  (enCarrito
                    ? "border-acento bg-acento-suave text-acento"
                    : "border-linea-fuerte text-ink hover:border-ink hover:bg-sand-2")
                }
              >
                <Icono nombre={enCarrito ? "check" : "carrito"} tamano={18} />
              </button>
            ) : null}
          </div>

          {pieAdmin}
        </div>
      </div>
    </Boleto>
  );
}
