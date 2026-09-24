"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { TableroSalidas } from "@/components/ui/TableroSalidas";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import type { FotoHero } from "@/lib/promociones/fotosHero";

const MS_POR_FOTO = 5000;
const SEG_CRUCE = 1.2;
/* La curva del cruce: sale rápido y frena largo al final. Es --ease-salida de
   globals.css, para que todo el sitio se mueva igual. */
const CURVA = [0.22, 1, 0.36, 1] as const;

function barajar<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

export function Hero({ fotos }: { fotos: FotoHero[] }) {
  const fotoPrincipal = fotos[0];
  const { content } = useSiteContent();
  const hero = content.home.hero;
  const esWhatsapp = hero.secondaryHref === "whatsapp";

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
  // La rotación, el Ken Burns y la barra de tiempo se paran con la pestaña
  // oculta (el navegador estrangula los timers y al volver se acumulan saltos)
  // y con el hero fuera de pantalla (nadie lo está mirando y cada salto baja
  // una foto a ancho completo).
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [enPantalla, setEnPantalla] = useState(true);
  const seccion = useRef<HTMLElement>(null);
  const activo = pestanaVisible && enPantalla;

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrden(barajar(fotos));
    setI(0);
    setCargadas(new Set([0]));
  }, [fotos]);

  useEffect(() => {
    const alCambiar = () => setPestanaVisible(document.visibilityState === "visible");
    alCambiar();
    document.addEventListener("visibilitychange", alCambiar);
    return () => document.removeEventListener("visibilitychange", alCambiar);
  }, []);

  useEffect(() => {
    const el = seccion.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([e]) => setEnPantalla(e.isIntersecting), { threshold: 0.05 });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const rotando = !hero.image && orden.length > 1;

  useEffect(() => {
    if (!rotando || !activo) return;
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
  }, [rotando, activo, orden.length, cargadas]);

  const actual = hero.image ? null : orden[i] ?? fotoPrincipal;
  const heroAlt = actual?.alt ?? fotoPrincipal?.alt ?? "Experiencia de viaje";
  // El tablero muestra el destino de la foto que está en pantalla; si el
  // alojamiento no tiene destino cargado, el nombre del hotel. Con imagen fija
  // del admin no hay destino que anunciar: queda la marca.
  const destino = actual?.destino?.trim();
  const tablero = destino || actual?.alt || "Lotus 360";
  const lugar = destino ? actual?.alt : null;

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
    // que el pase mobile del 14-ago rompiera desktop sin que nadie lo viera).
    // Foto a sangre con el contenido anclado abajo.
    <section
      ref={seccion}
      className={
        "sobre-dusk relative isolate flex min-h-[62svh] flex-col justify-end overflow-hidden bg-dusk sm:min-h-[68svh] lg:min-h-[70svh] lg:max-h-[720px]" +
        (activo ? "" : " en-pausa")
      }
    >
      <div className="hero-parallax absolute inset-0 overflow-hidden">
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

      {/* Sin Revelar: el texto del hero está en pantalla desde el primer pintado
          (es candidato a LCP y no debe esperar a hidratar). El único movimiento
          orquestado de la portada es el tablero. */}
      <div className="relative mx-auto w-full max-w-[var(--ancho-contenido)] px-5 pb-8 pt-24 sm:pb-12 sm:pt-28 lg:pb-16 lg:pt-32">
        <div className="mb-6">
          <TableroSalidas texto={tablero} className="text-lg sm:text-2xl lg:text-3xl" />
          {lugar ? (
            <p className="mt-2.5 truncate text-sm font-medium text-dusk-text-soft">{lugar}</p>
          ) : null}
        </div>

        <h1 className="max-w-[13ch] text-balance font-display text-[clamp(2.75rem,6.4vw,5rem)] font-bold leading-[0.95] tracking-[-0.02em] text-white">
          <EditableText path="home.hero.title" />{" "}
          <EditableText path="home.hero.accent" className="text-coral-bright" />
        </h1>

        <EditableText
          path="home.hero.description"
          as="p"
          multiline
          className="mt-5 max-w-lg text-pretty text-base leading-7 text-dusk-text md:text-lg"
        />

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Boton href={hero.primaryHref} variante="firma" tamano="lg" iconoFin={<Icono nombre="flecha-der" tamano={20} />}>
            {hero.primaryLabel}
          </Boton>
          {esWhatsapp ? (
            <WhatsAppLeadButton
              mensajeBase="Hola! Vengo de su página web y quiero planificar mi próximo viaje."
              triggerClassName={clasesBoton({ variante: "sobre-foto", tamano: "lg" })}
            >
              <WhatsAppIcon size={18} />
              {hero.secondaryLabel}
            </WhatsAppLeadButton>
          ) : (
            <Boton href={hero.secondaryHref} variante="sobre-foto" tamano="lg" iconoFin={<Icono nombre="externo" tamano={18} />}>
              {hero.secondaryLabel}
            </Boton>
          )}
        </div>

        {/* Fila de datos del pase: el eyebrow viejo bajó acá, al lado de los
            dos datos editables, en vez de ir como etiqueta encima del título. */}
        <div className="mt-10 flex max-w-xl flex-wrap items-end gap-x-8 gap-y-4 border-t border-dashed border-white/20 pt-5">
          <EditableText
            path="home.hero.eyebrow"
            as="p"
            className="basis-full font-mono text-xs font-bold uppercase tracking-[0.14em] text-dusk-text-soft sm:basis-auto"
          />
          <div>
            <EditableText path="home.hero.badgeTopLabel" as="p" className="font-mono text-xs uppercase tracking-wider text-dusk-text-soft" />
            <EditableText path="home.hero.badgeTopValue" as="p" className="mt-1 text-sm font-bold text-white" />
          </div>
          <div>
            <EditableText path="home.hero.badgeBottomLabel" as="p" className="font-mono text-xs uppercase tracking-wider text-dusk-text-soft" />
            <EditableText path="home.hero.badgeBottomValue" as="p" className="mt-1 text-sm font-bold text-white" />
          </div>
        </div>

        {rotando ? (
          <div className="mt-5 flex items-center">
            {orden.map((foto, idx) => (
              <button
                key={foto.url}
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Ver foto ${idx + 1} de ${orden.length}: ${foto.alt}`}
                aria-current={idx === i}
                className="group/punto flex h-11 items-center px-1"
              >
                <span
                  className={
                    "block h-1 rounded-full transition-[width,background-color] duration-500 ease-salida " +
                    (idx === i
                      ? "w-8 bg-coral-bright"
                      : "w-3 bg-white/40 group-hover/punto:w-5 group-hover/punto:bg-white/70")
                  }
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Barra de tiempo del slide: se reinicia sola en cada foto por el key.
          Se congela junto con el timer. */}
      {rotando ? (
        <div className="absolute inset-x-0 bottom-0 h-[3px] bg-white/10" aria-hidden="true">
          <motion.div
            key={i}
            className="h-full origin-left bg-coral-bright"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: activo ? 1 : 0 }}
            transition={{ duration: MS_POR_FOTO / 1000, ease: "linear" }}
          />
        </div>
      ) : null}
    </section>
  );
}
