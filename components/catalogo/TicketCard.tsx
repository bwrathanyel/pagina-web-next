import Link from "next/link";
import { CardPhotoGallery } from "@/components/catalogo/CardPhotoGallery";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { BotonFavorito } from "@/components/ui/BotonFavorito";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { MontoAjustado, PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { SelloNinoGratis } from "@/components/catalogo/SelloNinoGratis";
import { separarMonto, type PrecioTarjeta } from "@/lib/tarifas";

export interface TicketCardProps {
  href: string | null;
  /** Etiqueta sobre la foto (tipo de producto). Las promociones no la llevan. */
  badge?: string;
  /** Nombre completo: alt de la foto y aria-labels. */
  nombre: string;
  /** Título visible si difiere de `nombre` (promo sin el prefijo del hotel). */
  titulo?: string;
  destino: string | null;
  fotos: string[];
  // true cuando NINGUNA de estas fotos es real (todas generadas por IA
  // porque el producto/promoción no tenía ninguna) -- muestra un badge de
  // transparencia, nunca se oculta (ver esSoloReferencial en lib/supabase/fotos).
  fotosReferenciales?: boolean;
  cotizarHref: string;
  /** Descripción corta de largo parejo (promociones.resumen_ia). `undefined` =
   * la tarjeta no tiene resumen; `null` = reserva igual las 2 líneas para que
   * todas las tarjetas de una grilla midan lo mismo. */
  resumen?: string | null;
  /** null = "Consultar disponibilidad" en tono secundario. */
  precio: PrecioTarjeta | null;
  vigenciaLabel?: string | null;
  ninosGratis?: number | null;
  /** Regalo de niño gratis vigente (Hot Sales): el sello dorado ocupa el
   * lugar de la etiqueta y reemplaza a la de `ninosGratis`. */
  selloNinoGratis?: number | null;
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
  /** Línea bajo el título (en promos: el nombre de la oferta, con el hotel
   * como título). `undefined` = sin fila; `null` = fila reservada vacía. */
  subtitulo?: string | null;
  /** Portada con prioridad alta: solo las primeras tarjetas de una lista. */
  prioridad?: boolean;
  /** Aviso de cierre de venta ("Últimos 3 días"), calculado por quien pinta la
   * tarjeta con una fecha real; sin fecha, sin aviso. */
  urgencia?: string | null;
  /** Promo fijada a mano por el equipo (HotSale.manual). */
  destacada?: boolean;
  /** "3 días · 2 noches", leído del texto de la promo. */
  duracion?: string | null;
}

// Tarjeta de catálogo como pase de abordar: foto 4:3 (la mayoría de las fotos
// del tarifario son horizontales; en 3:4 se ampliaban y se veían borrosas),
// precio arriba y filas de alto fijo para que una grilla quede alineada. El
// talón lleva destino, vigencia y las acciones.
// Se eleva con borde, no con sombra: la máscara de las muescas recortaría una.
export function TicketCard({
  href,
  badge,
  nombre,
  titulo,
  destino,
  fotos,
  fotosReferenciales = false,
  cotizarHref,
  resumen,
  precio,
  vigenciaLabel,
  ninosGratis,
  selloNinoGratis,
  enCarrito = false,
  onToggleCarrito,
  favorito = null,
  onToggleFavorito,
  pieAdmin,
  oculto = false,
  subtitulo,
  prioridad = false,
  urgencia = null,
  destacada = false,
  duracion = null,
}: TicketCardProps) {
  const { monto, unidad, grande: montoGrande } = separarMonto(precio);

  return (
    <Boleto
      tamanoTalon="4.5rem"
      className={
        "h-full transition-[transform,border-color] duration-[var(--dur-media)] ease-salida " +
        "hover:-translate-y-1 hover:border-acento/60 motion-reduce:transition-none " +
        (oculto ? "opacity-50" : "")
      }
      talon={
        <div className="flex h-full items-center gap-2 px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-mono text-xs font-bold uppercase tracking-widest text-ink">
              {destino || " "}
            </p>
            {urgencia ? (
              <p className="animate-entra-card flex items-center gap-1.5 truncate text-xs font-bold text-ambar">
                <span aria-hidden="true" className="punto-vivo h-1.5 w-1.5 shrink-0 rounded-pill bg-current" />
                {urgencia}
              </p>
            ) : null}
            <p className={"truncate text-xs text-ink-soft" + (urgencia ? " hidden" : "")}>{vigenciaLabel ||" "}</p>
          </div>
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
          {/* Solo ícono por debajo de sm: en la grilla de 2 columnas mobile
              el texto no cabe junto al carrito -- el aria-label ya dice la
              acción completa. */}
          <Boton
            href={cotizarHref}
            aria-label={`Cotizar ${nombre}`}
            tamano="sm"
            className="flex-shrink-0 max-sm:gap-0 max-sm:px-3"
            iconoFin={<Icono nombre="flecha-der" tamano={16} />}
          >
            <span className="hidden sm:inline">Cotizar</span>
          </Boton>
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="group/foto relative aspect-[4/3] overflow-hidden bg-sand-2">
          {/* Máximo dos sellos apilados: el principal (niño gratis / tipo /
              destacada) y la duración. Abajo no caben: ahí van los puntos. */}
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            {selloNinoGratis ? (
              <SelloNinoGratis cantidad={selloNinoGratis} />
            ) : ninosGratis && ninosGratis > 0 ? (
              <Etiqueta tono="seafoam">
                {ninosGratis} {ninosGratis === 1 ? "niño gratis" : "niños gratis"}
              </Etiqueta>
            ) : badge ? (
              <Etiqueta tono="dusk" className="lg:backdrop-blur-sm">
                {badge}
              </Etiqueta>
            ) : destacada ? (
              <Etiqueta tono="acento" icono={<Icono nombre="check" tamano={12} />}>
                Destacada
              </Etiqueta>
            ) : null}
            {duracion ? (
              <Etiqueta tono="dusk" className="lg:backdrop-blur-sm">
                {duracion}
              </Etiqueta>
            ) : null}
          </div>
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
              <div className="rounded-card border border-linea bg-card/65 px-6 py-4 text-center text-ink-soft lg:backdrop-blur-sm">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className="mx-auto mb-2" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="m4 17 4.5-4 3.5 3 2.5-2 5.5 3" />
                </svg>
                <p className="font-mono text-xs font-bold uppercase tracking-widest">Imagen por confirmar</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
          <p className="flex h-9 min-w-0 items-baseline gap-1.5 whitespace-nowrap font-mono tabular-nums">
            {precio?.desde ? <span className="text-xs font-semibold text-ink-soft">desde</span> : null}
            {precio && montoGrande ? (
              <MontoAjustado
                texto={monto}
                tope="1.875rem"
                unaLinea
                className="min-w-0 flex-1"
                claseMonto="truncate leading-9 text-acento"
              />
            ) : (
              <span className={"truncate text-base font-bold leading-8 " + (precio ? "text-ink" : "text-ink-soft")}>
                {precio ? <PrecioMostrado texto={monto} /> : "Consultar disponibilidad"}
              </span>
            )}
          </p>
          <p className="line-clamp-2 h-8 text-xs leading-4 text-ink-soft" title={unidad ?? undefined}>{unidad || " "}</p>

          <h3 className="mt-2.5 line-clamp-2 h-11 font-body text-base font-bold leading-snug text-ink">
            {href ? (
              <Link href={href} className="transition-colors hover:text-acento">
                {titulo ?? nombre}
              </Link>
            ) : (
              titulo ?? nombre
            )}
          </h3>

          {subtitulo !== undefined ? (
            <p className="mt-1 h-5 truncate text-sm font-semibold leading-5 text-ink-soft">{subtitulo || " "}</p>
          ) : null}

          {resumen !== undefined ? (
            <p className="mt-2 line-clamp-3 h-12 text-xs leading-4 text-ink-soft">{resumen}</p>
          ) : null}

          {pieAdmin}
        </div>
      </div>
    </Boleto>
  );
}
