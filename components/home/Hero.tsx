"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Revelar } from "@/components/ui/Revelar";

const MS_POR_FOTO = 5000;
const SEG_CRUCE = 1.2;
/* La curva del cruce: sale rápido y frena largo al final. Es la misma que usa
   `revelar-entrada` en globals.css, para que todo el sitio se mueva igual. */
const CURVA = [0.22, 1, 0.36, 1] as const;

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

export function Hero({ fotos }: { fotos: { url: string; alt: string }[] }) {
  const fotoPrincipal = fotos[0];
  const { content } = useSiteContent();
  const hero = content.home.hero;
  const esWhatsapp = hero.secondaryHref === "whatsapp";
  const secondaryHref = hero.secondaryHref;

  // Rotación de fotos de Hot Sales (pedido del dueño, 2026-07-26). El orden se
  // baraja DESPUÉS de montar y el índice arranca en 0: un Math.random() en el
  // init de useState corre distinto en server y cliente, y React 19 lo marca
  // como mismatch de hidratación en cada carga (mismo motivo documentado en
  // HotSalesSection). Si el admin fijó una imagen fija en el contenido
  // (hero.image), esa manda y no se rota nada.
  const [orden, setOrden] = useState(fotos);
  const [i, setI] = useState(0);
  // El cruce no puede ir hacia una foto que el navegador todavía no bajó: eso
  // es un hueco de degradado en pantalla completa. Mismo patrón ya probado en
  // CardPhotoGallery -- solo se salta entre índices confirmados por onLoad.
  const [cargadas, setCargadas] = useState<Set<number>>(() => new Set([0]));
  // Con la pestaña oculta el navegador estrangula los timers y al volver se
  // acumulan saltos de golpe. Se para y se retoma.
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrden(barajar(fotos));
    setI(0);
    setCargadas(new Set([0]));
  }, [fotos]);

  useEffect(() => {
    const alCambiar = () => setVisible(document.visibilityState === "visible");
    alCambiar();
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  const rotando = !hero.image && orden.length > 1;

  useEffect(() => {
    if (!rotando || !visible) return;
    const t = setInterval(() => {
      setI((v) => {
        for (let paso = 1; paso < orden.length; paso++) {
          const siguiente = (v + paso) % orden.length;
          if (cargadas.has(siguiente)) return siguiente;
        }
        return v;
      });
    }, MS_POR_FOTO);
    return () => clearInterval(t);
  }, [rotando, visible, orden.length, cargadas]);

  const actual = hero.image ? null : orden[i] ?? fotoPrincipal;
  const heroAlt = actual?.alt ?? fotoPrincipal?.alt ?? "Experiencia de viaje";

  // Solo se monta la foto actual (más la saliente mientras se desvanece) y un
  // prefetch invisible de la siguiente -- son fotos de Hot Sales a ancho
  // completo, montar el pool entero dispararía la descarga de todas.
  const indiceSiguiente = orden.length > 1 ? (i + 1) % orden.length : -1;
  const fotoSiguiente = indiceSiguiente >= 0 ? orden[indiceSiguiente] : null;

  const marcarCargada = (idx: number) =>
    setCargadas((prev) => (prev.has(idx) ? prev : new Set(prev).add(idx)));

  return (
    // Un solo árbol responsive (antes había una tarjeta móvil y una grilla
    // desktop separadas por lg:hidden/hidden lg:grid -- eso fue lo que hizo
    // que el pase mobile del 14-ago rompiera desktop sin que nadie lo viera.
    // Ahora es una sola foto a sangre con el contenido anclado abajo,
    // reescritura editorial redesign desktop 2026-08-22).
    <section className="relative isolate flex min-h-[62svh] flex-col justify-end overflow-hidden sm:min-h-[68svh] lg:min-h-[70svh] lg:max-h-[720px]">
      <div className="grano hero-parallax absolute inset-0 overflow-hidden">
        {hero.image ? (
          <Image src={hero.image} alt={heroAlt} fill sizes="100vw" className="hero-kenburns object-cover" priority />
        ) : actual ? (
          // Tres nodos, no uno: este contenedor solo hace parallax (arriba);
          // la capa de motion es la que cruza (opacidad + escala); el <Image>
          // de adentro solo hace Ken Burns. Mezclar el cruce y el Ken Burns en
          // el mismo nodo hacía que las dos animaciones de transform se
          // anularan (hallazgo pasada 3). Y el cruce va con motion, no con
          // clases: en Tailwind v4 `scale-105` escribe la propiedad `scale:`,
          // que `transition-[opacity,transform]` NO cubre -- la escala saltaba
          // de golpe y solo se interpolaba la opacidad.
          <AnimatePresence initial={false}>
            <motion.div
              key={actual.url}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.06 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: SEG_CRUCE, ease: CURVA }}
            >
              <Image
                src={actual.url}
                alt={heroAlt}
                fill
                sizes="100vw"
                className={"object-cover " + (i % 2 ? "hero-kenburns-inv" : "hero-kenburns")}
                priority={i === 0}
                onLoad={() => marcarCargada(i)}
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-seafoam via-dusk-2 to-dusk" />
        )}
      </div>

      {/* Prefetch de la próxima foto: fuera del AnimatePresence y sin pintar,
          para que cuando le toque entrar ya esté en cache y el cruce no muestre
          un hueco. El onLoad es lo que la habilita en el salto del timer. */}
      {rotando && fotoSiguiente ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-0">
          {/* fill + sizes idénticos a los de la capa visible: el loader de
              Supabase/R2 reescribe la URL según el ancho pedido, así que un
              prefetch en miniatura bajaría un archivo distinto del que después
              se necesita y no serviría de nada. */}
          <Image
            src={fotoSiguiente.url}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="object-cover"
            onLoad={() => marcarCargada(indiceSiguiente)}
          />
        </div>
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-dusk via-dusk/70 to-dusk/20" />
      <div className="absolute inset-0 bg-gradient-to-r from-dusk/60 via-dusk/10 to-transparent" />

      {rotando && actual?.alt ? (
        <AnimatePresence mode="wait">
          <motion.p
            key={actual.alt}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.5, ease: CURVA }}
            className="absolute right-5 top-5 max-w-[55%] truncate rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[11px] font-medium text-white/90 backdrop-blur-md sm:right-8 sm:top-8"
          >
            {actual.alt}
          </motion.p>
        </AnimatePresence>
      ) : null}

      <Revelar retraso={120} className="relative mx-auto w-full max-w-[var(--ancho-contenido)] px-5 pb-8 pt-24 sm:pb-12 sm:pt-28 lg:pb-16 lg:pt-32">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-white/90 backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-coral-bright" aria-hidden="true" />
          <EditableText path="home.hero.eyebrow" />
        </p>

        <h1 className="max-w-[14ch] text-balance font-display text-[clamp(2.5rem,5.2vw,4.25rem)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
          <EditableText path="home.hero.title" />{" "}
          <EditableText path="home.hero.accent" className="text-coral-bright" />
        </h1>

        <EditableText
          path="home.hero.description"
          as="p"
          multiline
          className="mt-5 max-w-lg text-balance text-base leading-7 text-white/80 md:text-lg"
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link href={hero.primaryHref} className="inline-flex min-h-12 items-center justify-center rounded-full bg-coral px-7 font-semibold text-white shadow-[0_12px_28px_rgba(0,0,0,.25)] transition-transform hover:-translate-y-0.5">
            {hero.primaryLabel}
          </Link>
          {esWhatsapp ? (
            <WhatsAppLeadButton
              mensajeBase="Hola! Vengo de su página web y quiero planificar mi próximo viaje."
              triggerClassName="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              {hero.secondaryLabel}
              <span aria-hidden="true">↗</span>
            </WhatsAppLeadButton>
          ) : (
            <a
              href={secondaryHref}
              target={secondaryHref.startsWith("http") ? "_blank" : undefined}
              rel={secondaryHref.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-7 font-semibold text-white backdrop-blur-md transition-colors hover:bg-white/20"
            >
              {hero.secondaryLabel}
              <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>

        <div className="mt-10 flex max-w-md flex-wrap gap-x-8 gap-y-4 border-t border-white/15 pt-6">
          <div>
            <EditableText path="home.hero.badgeTopLabel" as="p" className="font-mono text-[10px] uppercase tracking-wider text-white/60" />
            <EditableText path="home.hero.badgeTopValue" as="p" className="mt-1 text-sm font-bold text-white" />
          </div>
          <div>
            <EditableText path="home.hero.badgeBottomLabel" as="p" className="font-mono text-[10px] uppercase tracking-wider text-white/60" />
            <EditableText path="home.hero.badgeBottomValue" as="p" className="mt-1 text-sm font-bold text-white" />
          </div>
        </div>

        {rotando ? (
          <div className="mt-8 flex items-center gap-2">
            {orden.map((foto, idx) => (
              <button
                key={foto.url}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ver foto ${idx + 1} de ${orden.length}: ${foto.alt}`}
                aria-current={idx === i}
                className="group/punto h-6 py-2.5"
              >
                <span
                  className={
                    "block h-1 rounded-full transition-all duration-500 ease-out " +
                    (idx === i
                      ? "w-8 bg-coral-bright"
                      : "w-3 bg-white/40 group-hover/punto:w-5 group-hover/punto:bg-white/70")
                  }
                />
              </button>
            ))}
          </div>
        ) : null}
      </Revelar>

      {/* Barra de tiempo del slide: se reinicia sola en cada foto por el key.
          Se congela con la pestaña oculta, igual que el timer. */}
      {rotando ? (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10" aria-hidden="true">
          <motion.div
            key={i}
            className="h-full origin-left bg-coral-bright"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: visible ? 1 : 0 }}
            transition={{ duration: MS_POR_FOTO / 1000, ease: "linear" }}
          />
        </div>
      ) : null}
    </section>
  );
}
