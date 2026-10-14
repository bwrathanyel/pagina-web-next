import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { SolicitudAliado } from "@/components/aliados/SolicitudAliado";
import { TicketCard } from "@/components/catalogo/TicketCard";
import { CLASE_ETIQUETA_SECCION, CLASE_TITULO_SECCION, EncabezadoSeccion } from "@/components/ui/EncabezadoSeccion";
import { Seccion } from "@/components/ui/Seccion";
import { getAliado, getGruposAliado, precioAliado } from "@/lib/aliados";
import { esSoloReferencial, fotosDe } from "@/lib/supabase/fotos";
import { tarifaDestacada } from "@/lib/tarifas";
import type { Producto } from "@/types/supabase";

export const dynamicParams = true;

const BADGE: Record<Producto["tipo"], string> = { hotel: "Hotel", paquete: "Paquete", destino: "Guía / Tour", info: "Info" };

const SERVICIOS = [
  ["Paquetes todo incluido", "Margarita, Los Roques, Mérida y más destinos nacionales."],
  ["Tours y full days", "Puerto Cabello, playas y excursiones de un día."],
  ["Boletos aéreos", "Vuelos nacionales e internacionales con la mejor tarifa disponible."],
  ["Traslados", "Aeropuerto, hotel y traslados para grupos."],
  ["Actividades corporativas", "Viajes de incentivo, convenciones y eventos de equipo."],
] as const;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const aliado = await getAliado((await params).slug);
  if (!aliado) return {};
  return {
    title: `Catálogo corporativo ${aliado.nombre}`,
    description: `Servicios de viaje de Destino y Eventos Lotus 360 con ${aliado.descuento_pct}% de descuento de aliado para ${aliado.nombre}.`,
    robots: { index: false, follow: false },
  };
}

export default async function AliadoPage({ params }: { params: Promise<{ slug: string }> }) {
  const aliado = await getAliado((await params).slug);
  if (!aliado) notFound();
  const grupos = await getGruposAliado(aliado);
  const descuento = aliado.descuento_pct;
  const pct = `${descuento.toLocaleString("es-VE")}%`;

  return (
    <main className="pb-16">
      <Seccion ritmo="intro">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-acento">Catálogo corporativo</p>
        <h1 className={`${CLASE_TITULO_SECCION} mt-3 md:text-6xl`}>{aliado.nombre} × Lotus 360</h1>
        <p className="mt-5 max-w-[60ch] text-lg text-ink-soft">
          Como aliado de Lotus 360, {aliado.nombre} tiene <strong className="text-ink">{pct} de descuento de agencia</strong>{" "}
          sobre la tarifa vigente en todos nuestros servicios. Elija lo que necesita y le enviamos la cotización por WhatsApp.
        </p>
        <div id="cotizar" className="mt-7 scroll-mt-24">
          <Suspense fallback={null}>
            <SolicitudAliado slug={aliado.slug} nombre={aliado.nombre} descuento={descuento} />
          </Suspense>
        </div>
      </Seccion>

      <Seccion ritmo="densa">
        <EncabezadoSeccion
          titulo={<h2 className={CLASE_TITULO_SECCION}>Qué puede cotizar</h2>}
          etiqueta={<p className={`${CLASE_ETIQUETA_SECCION} text-ink-soft`}>{pct} de aliado en cada servicio</p>}
        />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICIOS.map(([titulo, texto]) => (
            <li key={titulo} className="rounded-card border border-linea bg-card p-5">
              <h3 className="font-body text-base font-bold text-ink">{titulo}</h3>
              <p className="mt-1.5 text-sm text-ink-soft">{texto}</p>
            </li>
          ))}
        </ul>
      </Seccion>

      {grupos.map((grupo) => (
        <Seccion key={grupo.titulo} ritmo="densa">
          <EncabezadoSeccion
            titulo={<h2 className={CLASE_TITULO_SECCION}>{grupo.titulo}</h2>}
            etiqueta={<p className={`${CLASE_ETIQUETA_SECCION} text-ink-soft`}>Precio de aliado desde, por persona</p>}
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {grupo.productos.map((p, i) => (
              <TicketCard
                key={p.id}
                href={`/producto/${p.id}`}
                prioridad={i < 3}
                badge={BADGE[p.tipo]}
                nombre={p.nombre}
                destino={p.destino}
                fotos={fotosDe(p.producto_fotos)}
                fotosReferenciales={esSoloReferencial(p.producto_fotos)}
                cotizarHref={`/aliados/${aliado.slug}?destino=${encodeURIComponent(p.nombre)}#cotizar`}
                precio={precioAliado(tarifaDestacada(p), descuento)}
              />
            ))}
          </div>
        </Seccion>
      ))}

      <Seccion ritmo="densa" ancho="medio">
        <p className="text-sm text-ink-soft">
          Precios de referencia por persona tomados del tarifario vigente, con el {pct} de aliado ya aplicado. La tarifa final
          depende de la fecha, la ocupación y la disponibilidad al momento de reservar. El descuento de aliado no se acumula
          con otras promociones.
        </p>
      </Seccion>
    </main>
  );
}
