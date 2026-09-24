import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export type VarianteBoton = "primario" | "firma" | "secundario" | "fantasma" | "whatsapp" | "sobre-foto";
export type TamanoBoton = "sm" | "md" | "lg";

// Una sola fuente para los botones del sitio (antes la misma cadena de clases
// estaba copiada en Hero, MasDeLotus, TicketCard, ProductoAccionesMobile...).
//
// - primario: acento que gira con el tema (texto encima = sobre-acento).
// - firma: naranja vivo del logo con texto oscuro; para superficies dusk y
//   foto, donde el coral oscuro se hunde. #3a1505 sobre #FC7300 = 5.9:1.
// - sobre-foto: contorno claro para el CTA secundario encima de una foto.
const VARIANTES: Record<VarianteBoton, string> = {
  primario: "bg-acento text-sobre-acento hover:brightness-110",
  firma: "bg-coral-bright text-btn-ink hover:brightness-105",
  secundario: "border border-linea-fuerte bg-card text-ink hover:border-ink/40 hover:bg-sand-2",
  fantasma: "text-ink hover:bg-sand-2",
  whatsapp: "bg-whatsapp text-white hover:brightness-110",
  "sobre-foto": "border border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/15",
};

const TAMANOS: Record<TamanoBoton, string> = {
  sm: "min-h-11 gap-1.5 px-4 text-sm",
  md: "min-h-12 gap-2 px-6 text-base",
  lg: "min-h-14 gap-2.5 px-8 text-lg",
};

export function clasesBoton({
  variante = "primario",
  tamano = "md",
  ancho = false,
  className = "",
}: {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  ancho?: boolean;
  className?: string;
} = {}) {
  return [
    "inline-flex select-none items-center justify-center rounded-control font-semibold leading-none",
    "transition-[transform,filter,background-color,border-color] duration-150 ease-salida active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50",
    VARIANTES[variante],
    TAMANOS[tamano],
    ancho ? "w-full" : "",
    className,
  ].join(" ");
}

function Girador() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none"
    />
  );
}

type Comunes = {
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  ancho?: boolean;
  iconoInicio?: ReactNode;
  iconoFin?: ReactNode;
  children: ReactNode;
};

/** Botón de acción. Con `href` rinde un Link (navegación interna) o un <a>
 * (externo, se detecta por el protocolo); sin `href`, un <button>. */
export function Boton(
  props: Comunes &
    (
      | ({ href: string } & Omit<ComponentProps<"a">, "children">)
      | ({ href?: undefined; cargando?: boolean } & Omit<ComponentProps<"button">, "children">)
    ),
) {
  const { variante, tamano, ancho, iconoInicio, iconoFin, children, className, ...resto } = props;
  const clases = clasesBoton({ variante, tamano, ancho, className });

  if ("href" in resto && resto.href !== undefined) {
    const { href, ...a } = resto;
    const externo = /^(https?:|mailto:|tel:)/.test(href);
    const contenido = (
      <>
        {iconoInicio}
        <span>{children}</span>
        {iconoFin}
      </>
    );
    return externo ? (
      <a href={href} target="_blank" rel="noopener noreferrer" className={clases} {...a}>
        {contenido}
      </a>
    ) : (
      <Link href={href} className={clases} {...a}>
        {contenido}
      </Link>
    );
  }

  const { cargando, disabled, type, ...b } = resto as { cargando?: boolean } & ComponentProps<"button">;
  return (
    <button type={type ?? "button"} className={clases} disabled={disabled || cargando} aria-busy={cargando || undefined} {...b}>
      {cargando ? <Girador /> : iconoInicio}
      <span>{children}</span>
      {cargando ? null : iconoFin}
    </button>
  );
}
