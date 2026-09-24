import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CotizadorWizard } from "@/components/cotizador/CotizadorWizard";
import type { TipoCotizacion } from "@/components/cotizador/types";
import { TITULOS_COTIZADOR } from "@/components/cotizador/wizardConfig";
import { getProductoPorId } from "@/lib/supabase/queries";

const TIPOS: TipoCotizacion[] = ["fullday", "hospedaje", "boleteria", "paquete"];

// Title/description por tipo, alineados a lo que la gente busca de verdad
// ("boletos aéreos nacionales Venezuela", "full day Morrocoy", "posadas Los
// Roques"). El title es sin marca — el template del layout la agrega.
const SEO_POR_TIPO: Record<TipoCotizacion, { title: string; description: string }> = {
  fullday: {
    title: "Cotizar Full Day en Venezuela",
    description:
      "Cotice su full day de playa o montaña: Los Roques, Morrocoy, Chichiriviche y más. Indíquenos la fecha y cuántos van, y un asesor le responde por WhatsApp.",
  },
  hospedaje: {
    title: "Cotizar Hospedaje — Hoteles y Posadas en Venezuela",
    description:
      "Cotice hoteles y posadas en Margarita, Los Roques, Morrocoy y Mérida. Indique fechas y personas, y reciba disponibilidad y precio real por WhatsApp.",
  },
  boleteria: {
    title: "Cotizar Boletos Aéreos Nacionales en Venezuela",
    description:
      "Cotice boletos aéreos dentro de Venezuela: Caracas, Porlamar, Los Roques y más rutas nacionales. También si compra desde el exterior para un familiar.",
  },
  paquete: {
    title: "Cotizar Paquete Todo Incluido en Venezuela",
    description:
      "Cotice su paquete todo incluido: Los Roques, Canaima, Margarita o Mérida. Vuelo, hospedaje y excursiones coordinados por un asesor en un solo lugar.",
  },
  personalizado: {
    title: "Cotizador Personalizado",
    description:
      "Cuéntenos destino, fechas, presupuesto y cantidad de personas, y un asesor arma una propuesta de viaje a su medida en Venezuela.",
  },
};

function isTipo(value: string): value is TipoCotizacion {
  return (TIPOS as string[]).includes(value);
}

export function generateStaticParams() {
  return TIPOS.map((tipo) => ({ tipo }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tipo: string }>;
}): Promise<Metadata> {
  const { tipo } = await params;
  if (!isTipo(tipo)) return {};
  const { title, description } = SEO_POR_TIPO[tipo];
  return {
    title,
    description,
    alternates: { canonical: `/cotizar/${tipo}` },
    openGraph: { title, description, url: `/cotizar/${tipo}` },
  };
}

export default async function CotizarPage({
  params,
  searchParams,
}: {
  params: Promise<{ tipo: string }>;
  searchParams: Promise<{ producto?: string }>;
}) {
  const { tipo } = await params;
  if (!isTipo(tipo)) notFound();

  const { producto: productoId } = await searchParams;
  const producto = productoId ? await getProductoPorId(Number(productoId)) : null;

  return (
    <main className="mx-auto max-w-xl px-5 py-6 pb-28 md:py-10 lg:pb-10">
      <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-5xl">{TITULOS_COTIZADOR[tipo]}</h1>
      <p className="mb-6 mt-3 text-ink-soft">
        {producto ? (
          <>
            Para <strong className="font-semibold text-ink">{producto.nombre}</strong>. Un asesor le responde por WhatsApp.
          </>
        ) : (
          "Complete unos pasos y un asesor le responde por WhatsApp."
        )}
      </p>
      <CotizadorWizard tipo={tipo} productoNombre={producto?.nombre} />
    </main>
  );
}
