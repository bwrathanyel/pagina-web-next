import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PaqueteAliadoCard } from "@/components/aliados/PaqueteAliadoCard";
import { SolicitudAliado } from "@/components/aliados/SolicitudAliado";
import { Boton } from "@/components/ui/Boton";
import { CLASE_ETIQUETA_SECCION, CLASE_TITULO_SECCION, EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { Seccion } from "@/components/ui/Seccion";
import { getAliado, getPaquetesAliado, marcaAliado } from "@/lib/aliados";

export const dynamicParams = true;

const SERVICIOS: [NombreIcono, string, string][] = [
  ["hotel", "Paquetes todo incluido", "Margarita, Los Roques, Mérida y más destinos nacionales."],
  ["sol", "Tours y full days", "Puerto Cabello, playas y excursiones de un día."],
  ["avion", "Boletos aéreos", "Vuelos nacionales e internacionales con la mejor tarifa disponible."],
  ["maletin", "Traslados", "Aeropuerto, hotel y traslados para grupos."],
  ["destello", "Actividades corporativas", "Viajes de incentivo, convenciones y eventos de equipo."],
];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const aliado = await getAliado((await params).slug);
  if (!aliado) return {};
  return {
    title: `Catálogo corporativo ${aliado.nombre}`,
    description: `Paquetes Hot Sale de Destino y Eventos Lotus 360 con ${aliado.descuento_pct}% adicional de descuento de aliado para ${aliado.nombre}.`,
    robots: { index: false, follow: false },
  };
}

export default async function AliadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const aliado = await getAliado((await params).slug);
  if (!aliado) notFound();
  const paquetes = await getPaquetesAliado(aliado);
  const marca = marcaAliado(aliado.slug);
  const descuento = aliado.descuento_pct;
  const pct = `${descuento.toLocaleString("es-VE")}%`;
  const cotizar = (texto: string) => `/aliados/${aliado.slug}?destino=${encodeURIComponent(texto)}#cotizar`;

  return (
    <main className="pb-16" data-aliado={aliado.slug}>
      <section className="bg-dusk px-5 py-10 text-dusk-text md:py-20">
        <div className="mx-auto grid max-w-[var(--ancho-contenido)] gap-8 md:grid-cols-[1.5fr_1fr] md:items-end">
          <div className="hero-sube">
            {marca ? (
              <h1 className="flex flex-wrap items-center gap-x-4 gap-y-3 md:gap-x-7">
                <Image
                  src={marca.logo.src}
                  alt={aliado.nombre}
                  width={marca.logo.ancho}
                  height={marca.logo.alto}
                  priority
                  className="h-12 w-auto md:h-24"
                />
                <span aria-hidden="true" className="font-display text-4xl font-bold leading-none text-aliado-dusk md:text-7xl">
                  ×
                </span>
                <span className="flex items-center gap-2 md:gap-3">
                  <Image src="/logo-lotus360-transparent.png" alt="" width={80} height={80} priority className="h-11 w-11 md:h-20 md:w-20" />
                  <span className="font-display text-3xl font-bold leading-none md:text-6xl">Lotus 360</span>
                </span>
              </h1>
            ) : (
              <h1 className="font-display text-4xl font-bold leading-none md:text-7xl">
                {aliado.nombre} <span className="text-aliado-dusk">×</span> Lotus 360
              </h1>
            )}
            <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.14em] text-aliado-dusk">
              {marca ? "Alianza corporativa · Catálogo exclusivo" : "Catálogo corporativo"}
            </p>
            <p className="mt-5 max-w-[52ch] text-lg text-dusk-text-soft">
              {marca ? `Para los ${marca.publico} de ${aliado.nombre}: paquetes` : "Paquetes"} armados con nuestras Hot
              Sales vigentes, con el precio total para dos adultos y{" "}
              <strong className="text-dusk-text">{pct} adicional de descuento de aliado</strong>. Elija el suyo y le
              enviamos la cotización por WhatsApp.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Boton href="#paquetes" variante="firma" tamano="md" iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
                Ver paquetes
              </Boton>
              <Boton href="#cotizar" variante="sobre-foto" tamano="md">
                Pedir otra cotización
              </Boton>
            </div>
          </div>
          <div className="rounded-card border border-aliado-dusk/30 bg-dusk-2 p-6 md:p-8">
            <p className="font-display text-7xl font-bold leading-none text-aliado-dusk md:text-8xl">−{pct}</p>
            <p className="mt-2 text-dusk-text">de descuento de aliado, encima del precio Hot Sale</p>
            <p className="mt-5 border-t border-dusk-text/20 pt-4 font-mono text-xs uppercase tracking-widest text-dusk-text-soft">
              {paquetes.length} {paquetes.length === 1 ? "paquete listo" : "paquetes listos"} para cotizar
            </p>
          </div>
        </div>
      </section>

      {marca && (
        <Seccion ritmo="densa">
          <EncabezadoSeccion
            titulo={<h2 className={CLASE_TITULO_SECCION}>{marca.lema}</h2>}
            etiqueta={<p className={`${CLASE_ETIQUETA_SECCION} text-aliado`}>Alianza {aliado.nombre} × Lotus 360</p>}
          />
          <ul className="grid gap-6 md:grid-cols-3">
            {(
              [
                ["etiqueta", `${pct} de aliado`, "Sobre la tarifa Hot Sale vigente y en todos los servicios de la agencia."],
                ["hotel", `Para ${aliado.nombre}`, marca.valor],
                ["cotizar", "Cotización por WhatsApp", "Elija un paquete o pida otro servicio, y un asesor le envía la cotización con el descuento aplicado."],
              ] as [NombreIcono, string, string][]
            ).map(([icono, titulo, texto]) => (
              <li key={titulo} className="flex gap-4 border-t-2 border-aliado pt-5">
                <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-aliado-suave text-aliado">
                  <Icono nombre={icono} tamano={22} />
                </span>
                <div>
                  <h3 className="font-body text-base font-bold text-ink">{titulo}</h3>
                  <p className="mt-1.5 text-sm text-ink-soft">{texto}</p>
                </div>
              </li>
            ))}
          </ul>
        </Seccion>
      )}

      <Seccion ritmo="densa">
        <div id="paquetes" className="scroll-mt-28">
          <EncabezadoSeccion
            titulo={<h2 className={CLASE_TITULO_SECCION}>Paquetes Hot Sale</h2>}
            etiqueta={<p className={`${CLASE_ETIQUETA_SECCION} text-ink-soft`}>Precio total para 2 adultos, con {pct} de aliado</p>}
          />
          {paquetes.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {paquetes.map((p, i) => (
                <PaqueteAliadoCard
                  key={p.id}
                  paquete={p}
                  descuento={descuento}
                  prioridad={i < 3}
                  cotizarHref={cotizar(`${p.hotel} · ${p.adultos} adultos, ${p.noches} noches`)}
                />
              ))}
            </div>
          ) : (
            <p className="rounded-card bg-seafoam-bg p-6 text-seafoam-text">
              En este momento no hay Hot Sales vigentes. Pídanos la cotización y le armamos el paquete con su descuento de aliado.
            </p>
          )}
        </div>
      </Seccion>

      <Seccion ritmo="densa">
        <EncabezadoSeccion
          titulo={<h2 className={CLASE_TITULO_SECCION}>Todo lo que puede cotizar</h2>}
          etiqueta={<p className={`${CLASE_ETIQUETA_SECCION} text-ink-soft`}>{pct} de aliado en cada servicio</p>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {SERVICIOS.map(([icono, titulo, texto]) => (
            <li key={titulo}>
              <Link
                href={cotizar(titulo)}
                className="flex h-full flex-col rounded-card border border-linea bg-card p-5 transition-colors duration-[var(--dur-rapida)] hover:border-aliado/60"
              >
                <span aria-hidden="true" className="flex h-11 w-11 items-center justify-center rounded-control bg-aliado-suave text-aliado">
                  <Icono nombre={icono} tamano={22} />
                </span>
                <h3 className="mt-4 font-body text-base font-bold text-ink">{titulo}</h3>
                <p className="mt-1.5 text-sm text-ink-soft">{texto}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Seccion>

      <Seccion ritmo="densa">
        <div id="cotizar" className="scroll-mt-28 rounded-card bg-seafoam-bg p-6 md:p-10">
          <h2 className="font-display text-3xl font-bold leading-none text-ink md:text-4xl">
            ¿Otra fecha, más personas u otro servicio?
          </h2>
          <p className="mt-3 max-w-[60ch] text-seafoam-text">
            Le armamos la cotización a la medida con su {pct} de aliado ya aplicado.
          </p>
          <div className="mt-6">
            <Suspense fallback={null}>
              <SolicitudAliado slug={aliado.slug} nombre={aliado.nombre} descuento={descuento} />
            </Suspense>
          </div>
        </div>
      </Seccion>

      <Seccion ritmo="densa" ancho="medio">
        <p className="text-sm text-ink-soft">
          Precios totales de referencia para 2 adultos en habitación doble, calculados con la tarifa Hot Sale vigente y con el{" "}
          {pct} de aliado ya aplicado. El monto final depende de la fecha, la ocupación y la disponibilidad al momento de
          reservar; su asesor lo confirma al enviarle la cotización.
          {marca && ` El nombre y el logo de ${aliado.nombre} pertenecen a su titular y se muestran como parte de la alianza con Destino y Eventos Lotus 360.`}
        </p>
      </Seccion>
    </main>
  );
}
