"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from "react";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { EditableText } from "@/components/admin/EditableText";
import { useSiteContent } from "@/components/providers/SiteContentProvider";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { TableroSalidas } from "@/components/ui/TableroSalidas";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { CotizadorRapidoBarra, CotizadorRapidoMovil } from "@/components/home/CotizadorRapido";
import { PaseDestacado } from "@/components/home/PaseDestacado";
import { useHeroBajoBarra } from "@/lib/layout/barraSobreFoto";
import type { FondoHero, FotoHero } from "@/lib/promociones/fotosHero";

const MS_POR_FOTO = 6000;
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

// El tablero tiene tantas paletas como el destino más largo del pool (entre 8
// y 18): no cambia de ancho al rotar y, con destinos cortos, cada paleta crece.
// Tamaños medidos con Space Mono (~0,97em por paleta con su separación) para
// que 18 paletas quepan en 280px (teléfono de 320) y en la columna de lg.
function largoTablero(fotos: FotoHero[]): number {
  const largos = fotos.map((f) => (f.destino?.trim() || f.alt || "").length);
  return Math.min(18, Math.max(8, ...largos));
}

function claseTablero(largo: number): string {
  if (largo <= 10) return "text-2xl min-[380px]:text-3xl sm:text-4xl lg:text-5xl";
  if (largo <= 14) return "text-xl min-[380px]:text-2xl sm:text-3xl lg:text-5xl";
  return "text-base min-[380px]:text-lg sm:text-2xl lg:text-4xl";
}

const MQ_ESCRITORIO = "(min-width: 1024px)";
const suscribirEscritorio = (aviso: () => void) => {
  const mq = window.matchMedia(MQ_ESCRITORIO);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
};
const esEscritorio = () => window.matchMedia(MQ_ESCRITORIO).matches;

const retraso = (ms: number) => ({ "--retraso": `${ms}ms` }) as CSSProperties;

/** El fondo de una entrada en la vuelta `ciclo`: un destino con varias fotos
 * entra con la siguiente de su lista cada vez que la rotación da la vuelta. */
function fondoDe(foto: FotoHero, ciclo: number): FondoHero {
  return foto.fondos?.length ? foto.fondos[ciclo % foto.fondos.length] : foto;
}

export function Hero({ fotos }: { fotos: FotoHero[] }) {
  const fotoPrincipal = fotos[0];
  const { content } = useSiteContent();
  const hero = content.home.hero;
  const esWhatsapp = hero.secondaryHref === "whatsapp";
  const reducido = useReducedMotion();
  // En el teléfono el cruce es solo de opacidad (ver globals.css, "foto del
  // hero queda quieta"). El servidor pinta como teléfono; en escritorio
  // cambia al hidratar, antes de que haya ningún cruce.
  const escritorio = useSyncExternalStore(suscribirEscritorio, esEscritorio, () => false);

  // Rotación de fotos de Hot Sales (pedido del dueño, 2026-07-26). El orden se
  // baraja DESPUÉS de montar y el índice arranca en 0: un Math.random() en el
  // init de useState corre distinto en server y cliente, y React 19 lo marca
  // como mismatch de hidratación en cada carga. Si el admin fijó una imagen
  // fija en el contenido (hero.image), esa manda y no se rota nada.
  const [orden, setOrden] = useState(fotos);
  const [i, setI] = useState(0);
  // El cruce no puede ir hacia una foto que el navegador todavía no bajó: eso
  // es un hueco de degradado en pantalla completa. Solo se salta entre índices
  // confirmadas por onLoad (mismo patrón que CardPhotoGallery). Por URL y no
  // por índice: la misma entrada cambia de foto en cada ciclo.
  // Ref y no estado: que termine de bajar una foto no debe reiniciar el reloj
  // (el segmento seguiría corriendo y el salto llegaría tarde).
  const cargadas = useRef<Set<string>>(new Set(fotos[0] ? [fotos[0].url] : []));
  // Cuántas veces la rotación volvió a la primera entrada: elige la foto de
  // cada destino (fondoDe).
  const [ciclo, setCiclo] = useState(0);
  // Si al vencer el reloj la siguiente todavía no bajó, se da otra vuelta a
  // la misma foto en vez de quedarse parado.
  const [vuelta, setVuelta] = useState(0);
  // La rotación, el Ken Burns y el avance de los segmentos se paran con la
  // pestaña oculta y con el hero fuera de pantalla.
  const [pestanaVisible, setPestanaVisible] = useState(true);
  const [enPantalla, setEnPantalla] = useState(true);
  const seccion = useRef<HTMLElement>(null);
  useHeroBajoBarra(seccion);
  const activo = pestanaVisible && enPantalla;
  const largo = useMemo(() => largoTablero(fotos), [fotos]);

  // La primera queda fija y solo se baraja el resto: barajarlas todas cambiaba
  // la foto que el servidor ya pintó justo al hidratar, y el cruce iba hacia
  // una que nadie había bajado (fondo oscuro en el teléfono en cada carga,
  // 2026-09-25).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrden(fotos.length > 1 ? [fotos[0], ...barajar(fotos.slice(1))] : fotos);
    setI(0);
    setCiclo(0);
    cargadas.current = new Set(fotos[0] ? [fotos[0].url] : []);
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

  // `i` en las dependencias: un salto manual (clic en un segmento) reinicia el
  // reloj, así la foto elegida tiene su tiempo completo igual que su segmento.
  useEffect(() => {
    if (!rotando || !activo) return;
    const t = setTimeout(() => {
      for (let paso = 1; paso < orden.length; paso++) {
        const siguiente = (i + paso) % orden.length;
        // Pasar por detrás de la actual es empezar otro ciclo.
        const c = siguiente < i ? ciclo + 1 : ciclo;
        if (cargadas.current.has(fondoDe(orden[siguiente], c).url)) {
          setCiclo(c);
          return setI(siguiente);
        }
      }
      setVuelta((v) => v + 1);
    }, MS_POR_FOTO);
    return () => clearTimeout(t);
  }, [rotando, activo, orden, i, ciclo, vuelta]);

  // Una foto que no baja (red cortada, archivo borrado) sale de la rotación y
  // se salta ya a la próxima que sí bajó: si no, queda el texto alternativo
  // del <img> roto en pantalla completa hasta que venza el reloj.
  const alFallar = (url: string) => {
    cargadas.current.delete(url);
    for (let paso = 1; paso < orden.length; paso++) {
      const siguiente = (i + paso) % orden.length;
      const c = siguiente < i ? ciclo + 1 : ciclo;
      if (cargadas.current.has(fondoDe(orden[siguiente], c).url)) {
        setCiclo(c);
        return setI(siguiente);
      }
    }
  };

  const actual = hero.image ? null : orden[i] ?? fotoPrincipal;
  const fondo = actual ? fondoDe(actual, ciclo) : null;
  const heroAlt = fondo?.alt ?? fotoPrincipal?.alt ?? "Experiencia de viaje";
  // El tablero muestra el destino de la foto que está en pantalla; si el
  // alojamiento no tiene destino cargado, el nombre del hotel. Con imagen fija
  // del admin no hay destino que anunciar: queda la marca.
  const destino = actual?.destino?.trim();
  const tablero = destino || actual?.alt || "Lotus 360";
  const pase = actual?.pase;
  // Sin pase, el nombre del hotel va bajo el tablero; con pase ya lo dice él.
  const lugar = destino && !pase ? actual?.alt : null;

  // Solo se monta la foto actual (más la saliente mientras se desvanece) y un
  // prefetch invisible de la siguiente: montar el pool entero bajaría todas.
  const indiceSiguiente = orden.length > 1 ? (i + 1) % orden.length : -1;
  const fotoSiguiente =
    indiceSiguiente >= 0 ? fondoDe(orden[indiceSiguiente], indiceSiguiente < i ? ciclo + 1 : ciclo) : null;

  const marcarCargada = (url: string) => cargadas.current.add(url);

  const asesor = esWhatsapp ? (
    <WhatsAppLeadButton
      mensajeBase="Hola! Vengo de su página web y quiero planificar mi próximo viaje."
      triggerClassName="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-white underline decoration-white/40 underline-offset-4 transition-colors duration-150 ease-salida hover:decoration-white"
    >
      <WhatsAppIcon size={18} />
      {hero.secondaryLabel}
    </WhatsAppLeadButton>
  ) : (
    <Boton href={hero.secondaryHref} variante="sobre-foto" tamano="sm" iconoFin={<Icono nombre="externo" tamano={16} />}>
      {hero.secondaryLabel}
    </Boton>
  );

  return (
    // Un solo árbol responsive (dos árboles separados por breakpoint fue lo
    // que hizo que el pase móvil del 14-ago rompiera desktop sin que nadie lo
    // viera). Foto a sangre bajo la barra transparente; el contenido arriba y
    // el cotizador anclado al pie.
    <section
      ref={seccion}
      className={
        "sobre-dusk bajo-barra relative isolate flex min-h-[calc(100svh-5rem)] flex-col overflow-hidden bg-dusk lg:min-h-[80svh]" +
        (activo ? "" : " en-pausa")
      }
    >
      <div className="hero-parallax absolute inset-0 overflow-hidden">
        {hero.image ? (
          <Image src={hero.image} alt={heroAlt} fill sizes="100vw" className="hero-kenburns object-cover" priority />
        ) : fondo ? (
          // Tres nodos: este contenedor hace parallax; la capa de motion cruza
          // (opacidad + escala); el <Image> de adentro hace Ken Burns. Mezclar
          // el cruce y el Ken Burns en el mismo nodo anulaba los dos transform.
          // La entrante nace opaca DEBAJO y solo la saliente se desvanece encima:
          // con las dos a media opacidad asomaba el bg-dusk y en el teléfono la
          // foto nueva todavía decodificando dejaba un parpadeo gris (2026-09-24).
          // La key lleva el índice: dos entradas seguidas de Margarita pueden
          // caer en la misma foto al cambiar de ciclo, y sin cruce el Ken Burns
          // saltaba al cambiar de clase.
          <AnimatePresence initial={false}>
            <m.div
              key={`${i}-${fondo.url}`}
              className="absolute inset-0"
              initial={{ opacity: 1, scale: escritorio ? 1.06 : 1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: escritorio ? 1.02 : 1, zIndex: 1 }}
              transition={{ duration: SEG_CRUCE, ease: CURVA, zIndex: { duration: 0 } }}
            >
              <Image
                src={fondo.url}
                alt={heroAlt}
                fill
                sizes="100vw"
                className={"object-cover text-transparent " + (i % 2 ? "hero-kenburns-inv" : "hero-kenburns")}
                priority={i === 0 && ciclo === 0}
                onLoad={() => marcarCargada(fondo.url)}
                onError={() => alFallar(fondo.url)}
              />
            </m.div>
          </AnimatePresence>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-seafoam via-dusk-2 to-dusk" />
        )}
      </div>

      {/* Prefetch de la próxima foto, sin pintar: fill + sizes idénticos a la
          capa visible, porque el loader reescribe la URL según el ancho y una
          miniatura bajaría otro archivo. El onLoad la habilita en el salto. */}
      {rotando && fotoSiguiente ? (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-0">
          <Image
            src={fotoSiguiente.url}
            alt=""
            fill
            sizes="100vw"
            loading="eager"
            className="object-cover"
            // Bajada no es decodificada: con opacity-0 el navegador puede no
            // decodificarla nunca, y la capa nueva del cruce quedaría vacía los
            // primeros cuadros. decode() la deja lista antes de habilitar el salto.
            onLoad={(e) => {
              const url = fotoSiguiente.url;
              e.currentTarget.decode().then(() => marcarCargada(url), () => marcarCargada(url));
            }}
          />
        </div>
      ) : null}

      {/* Velos: solo a la izquierda (donde va el texto) y abajo (donde va el
          cotizador), no un velo plano sobre toda la foto. En el teléfono el
          texto ocupa todo el ancho: el de la izquierda no va (el texto tiene
          su propio velo, abajo) y el de abajo cubre solo el enlace y los
          segmentos, así el medio deja ver la foto (pedido del dueño,
          2026-09-25: se veía casi negro). */}
      <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-dusk/85 via-dusk/70 to-transparent lg:h-3/5 lg:from-dusk lg:via-dusk/40" />
      <div aria-hidden="true" className="absolute inset-y-0 left-0 hidden w-3/4 bg-gradient-to-r from-dusk/70 via-dusk/20 to-transparent lg:block" />
      {/* Bajo la barra transparente: sin esto, la tinta clara de la barra se
          pierde sobre un cielo o una arena clara. */}
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-dusk/70 to-transparent" />

      {/* max-lg:will-change-transform: el texto y el cotizador en su propia
          capa, fija. Sin esto, cada cruce reordena las capas de foto de abajo
          y el teléfono tenía que volver a rasterizar todo el bloque: se
          vaciaba de arriba abajo por unos cuadros (video 2026-09-25). */}
      <div className="relative mx-auto flex w-full max-w-[var(--ancho-contenido)] flex-1 flex-col px-5 pb-6 max-lg:will-change-transform pt-[calc(var(--alto-barra)+var(--alto-categorias)+2rem)] lg:pb-8 lg:pt-[calc(var(--alto-barra)+var(--alto-categorias)+3.5rem)]">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:items-start lg:gap-12">
          {/* Sin Revelar: el texto está en pantalla desde el primer pintado
              (candidato a LCP). El tablero es el único movimiento de carga del
              bloque de texto. */}
          <div className="relative min-w-0">
            {/* Teléfono y tablet: velo solo detrás del tablero y el título, a
                sangre y con bordes difusos (blur-xl y 3rem de margen: el texto
                queda donde el velo ya está entero). Medido sobre las 18 fotos
                recortadas a 390x764 (percentil 95 de luminancia en la zona del
                texto), en el peor caso: blanco 9,9:1, dusk-text-soft 5,1:1 y
                el coral 3,6:1, que es texto grande (pide 3:1). */}
            <div aria-hidden="true" className="absolute -inset-x-10 -inset-y-12 -z-10 bg-dusk/85 blur-xl lg:hidden" />
            <TableroSalidas texto={tablero} largo={largo} className={claseTablero(largo)} />
            {lugar ? <p className="mt-2.5 truncate text-sm font-medium text-dusk-text-soft">{lugar}</p> : null}

            <h1 className="mt-6 max-w-[13ch] text-balance font-display text-[clamp(2.75rem,6.4vw,5rem)] font-bold leading-[0.95] tracking-[-0.02em] text-white lg:mt-8">
              <EditableText path="home.hero.title" />{" "}
              <EditableText path="home.hero.accent" className="text-coral-bright" />
            </h1>

            <EditableText
              path="home.hero.description"
              as="p"
              multiline
              className="mt-5 hidden max-w-lg text-pretty text-lg leading-7 text-dusk-text sm:block"
            />
          </div>

          {pase ? (
            <div className="hero-sube relative mt-6 lg:mt-0" style={retraso(60)}>
              <AnimatePresence initial={false} mode="popLayout">
                <m.div
                  key={pase.promoId}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: reducido ? 0 : 0.42, ease: CURVA }}
                >
                  <PaseDestacado pase={pase} destino={destino} />
                </m.div>
              </AnimatePresence>
            </div>
          ) : null}
        </div>

        <div className="mt-auto pt-8 lg:pt-12">
          <div className="hero-sube hidden lg:block" style={retraso(120)}>
            <CotizadorRapidoBarra />
          </div>

          <div className="hero-sube lg:hidden" style={retraso(120)}>
            <CotizadorRapidoMovil />
          </div>

          <div className="mt-3 flex flex-col-reverse items-center gap-1 lg:mt-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-6">
            <span className="hidden lg:block" />
            {rotando ? (
              // Segmentos tipo historias: uno por foto, el activo se llena con
              // el reloj y los ya vistos quedan llenos. Un clic salta a esa foto.
              // En móvil van a la izquierda y con margen a la derecha: el botón
              // flotante de contacto (fixed, bottom-24) se les montaba encima.
              <div className="flex w-full max-w-xs items-center self-start pr-16 lg:self-auto lg:w-72 lg:pr-0">
                {orden.map((foto, idx) => (
                  <button
                    key={`${foto.url}-${foto.pase?.promoId ?? idx}`}
                    type="button"
                    onClick={() => setI(idx)}
                    aria-label={`Ver oferta ${idx + 1} de ${orden.length}: ${foto.pase?.hotel ?? foto.alt}`}
                    aria-current={idx === i}
                    className="group/seg flex h-11 min-w-0 flex-1 items-center px-1"
                  >
                    <span className="relative block h-1 w-full overflow-hidden rounded-pill bg-white/25 transition-colors duration-150 ease-salida group-hover/seg:bg-white/45">
                      {idx < i ? <span className="absolute inset-0 bg-white/80" /> : null}
                      {idx === i ? (
                        <m.span
                          key={`${i}-${vuelta}-${activo}`}
                          className="absolute inset-0 origin-left bg-white"
                          initial={{ scaleX: reducido ? 1 : 0 }}
                          animate={{ scaleX: activo || reducido ? 1 : 0 }}
                          transition={{ duration: reducido ? 0 : MS_POR_FOTO / 1000, ease: "linear" }}
                        />
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <span className="hidden lg:block" />
            )}
            <div className="lg:justify-self-end">{asesor}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
