import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { Revelar } from "@/components/ui/Revelar";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { SocialIcon, ICONS } from "@/components/layout/SocialIcon";
import { FondoRotativoBio } from "@/components/bio/FondoRotativoBio";
import { ModalWhatsAppBio } from "@/components/bio/ModalWhatsAppBio";
import { REDES } from "@/lib/social";
import { getPromociones } from "@/lib/supabase/queries";
import { promosHotSales } from "@/lib/promociones/hotSales";
import { fotosHeroDeHotSales } from "@/lib/promociones/fotosHero";

type Red = "instagram" | "facebook" | "tiktok";

const RUTAS_WHATSAPP: Record<Red, string> = {
  instagram: "/ig/whatsapp",
  facebook: "/fb/whatsapp",
  tiktok: "/tiktok/whatsapp",
};

// Segunda puerta del enlace de bio: en vez de mandar a WhatsApp, crea el lead
// y abre el cotizador IA de la web con la sesión ya atada a ese lead (ver
// lib/bio-cotizador.ts). Convive con el de WhatsApp a propósito -- son dos
// formas distintas de entrar, no un reemplazo.
const RUTAS_COTIZADOR: Record<Red, string> = {
  instagram: "/ig/cotizador",
  facebook: "/fb/cotizador",
  tiktok: "/tiktok/cotizador",
};

const NOMBRE_RED: Record<Red, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.6 2.7 21 11.1a2 2 0 0 1 0 2.8L14 21a2 2 0 0 1-2.8 0l-8.5-8.5A2 2 0 0 1 2 11V4a2 2 0 0 1 2-2h7a2 2 0 0 1 1.6.7Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function FuegoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22c4 0 6.5-2.5 6.5-6.2 0-2.4-1.2-3.8-2-5-.2 1.3-.9 2.1-1.7 2.1-.9 0-1-1-1-2.3 0-2-1-4-3-5.6-.3 2.3-1.2 3.7-2.6 5.2C6.6 11.8 5.5 13.6 5.5 15.8 5.5 19.5 8 22 12 22Z" />
    </svg>
  );
}

function CalculadoraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" />
    </svg>
  );
}

function GloboIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.2 2.4 3.5 5.6 3.5 9s-1.3 6.6-3.5 9c-2.2-2.4-3.5-5.6-3.5-9s1.3-6.6 3.5-9Z" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9 9 0 0 1-3.5-.7L3 21l1.8-5A8.2 8.2 0 0 1 4 11.5 8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5Z" />
    </svg>
  );
}

function MaletinIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2.5" y="7" width="19" height="13" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7M2.5 13h19" />
    </svg>
  );
}

const ENLACES_SECUNDARIOS = [
  { href: "/catalogo", label: "Catálogo y promociones", Icono: TagIcon },
  { href: "/catalogo/hot-sales", label: "Hot Sales", Icono: FuegoIcon },
  { href: "/cotizador-personalizado", label: "Cotizador personalizado", Icono: CalculadoraIcon },
  { href: "/", label: "Ir a la página web", Icono: GloboIcon },
  { href: "/trabaja-con-nosotros", label: "Trabaja con nosotros", Icono: MaletinIcon },
];

/** Página puente única para la bio de cada red (TikTok deja un solo enlace
 * clickeable). Misma estética en las tres, cada una sabe de qué red viene
 * para que el botón de WhatsApp rote asesor con el canal correcto y para
 * ocultar el ícono de su propia red en la fila social. */
export async function PaginaEnlaces({ red }: { red: Red }) {
  const redesRestantes = (["instagram", "facebook", "tiktok"] as const).filter((r) => r !== red);

  // Mismas fotos de Hot Sales vigentes que usa el Hero de la home (lib/promociones/fotosHero.ts),
  // acá como fondo desenfocado y oscurecido en vez de protagonista.
  const promociones = await getPromociones().catch(() => []);
  const fotosFondo = fotosHeroDeHotSales(promosHotSales(promociones), 6);

  return (
    <div className="relative -mb-20 flex min-h-[100svh] flex-col items-center overflow-hidden bg-gradient-to-b from-dusk to-dusk-2 px-5 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-14 lg:mb-0">
      {fotosFondo.length > 0 ? <FondoRotativoBio fotos={fotosFondo} /> : null}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-coral-bright/20 blur-[90px]"
      />
      <div className="relative flex w-full max-w-sm flex-col items-center">
        <Revelar className="flex flex-col items-center text-center">
          <BrandMark dark size="md" priority />
          <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.18em] text-gold">
            Destino y Eventos
          </p>
          <p className="font-display text-3xl font-semibold text-dusk-text">Lotus 360</p>
          <span className="mt-3 h-[3px] w-8 rounded-full bg-coral-bright" />
          <p className="mt-3 text-sm text-dusk-text/70">Tu próximo viaje empieza acá</p>
        </Revelar>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Revelar retraso={80}>
            <ModalWhatsAppBio
              canal={red}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-whatsapp font-semibold text-white shadow-lift transition hover:brightness-110 active:scale-[0.98]"
            />
            {/* Sin JS el modal no puede abrirse -- este link plano sigue
                rotando asesor y creando el lead como siempre (route.ts GET),
                solo sin nombre/destino reales. */}
            <noscript>
              <a
                href={RUTAS_WHATSAPP[red]}
                className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-whatsapp font-semibold text-white shadow-lift transition hover:brightness-110 active:scale-[0.98]"
              >
                <WhatsAppIcon size={20} />
                Escríbenos por WhatsApp
              </a>
            </noscript>
          </Revelar>
          <Revelar retraso={160}>
            {/* Un <a> plano, no un <Link>: es una ruta de servidor que crea el
                lead y redirige. Prefetcharla la ejecutaría sin que nadie la
                toque. */}
            <a
              href={RUTAS_COTIZADOR[red]}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-coral font-semibold text-white shadow-lift transition hover:brightness-110 active:scale-[0.98]"
            >
              <ChatIcon />
              Cotiza con Lotus IA
            </a>
          </Revelar>
          {ENLACES_SECUNDARIOS.map(({ href, label, Icono }, i) => (
            <Revelar key={href} retraso={80 * (i + 3)}>
              <Link
                href={href}
                className="flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-card)] border border-white/10 bg-white/5 px-4 text-sm font-medium text-dusk-text transition hover:bg-white/10"
              >
                <span className="text-gold">
                  <Icono />
                </span>
                {label}
              </Link>
            </Revelar>
          ))}
        </div>

        <Revelar retraso={80 * (ENLACES_SECUNDARIOS.length + 3)} className="mt-8 flex gap-3">
          {redesRestantes.map((r) => (
            <a
              key={r}
              href={REDES[r]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={NOMBRE_RED[r]}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-dusk-text transition hover:border-gold/40 hover:bg-white/10 hover:text-gold"
            >
              <SocialIcon path={ICONS[r]} />
            </a>
          ))}
        </Revelar>
      </div>
    </div>
  );
}
