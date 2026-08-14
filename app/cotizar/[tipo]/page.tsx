import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CotizadorWizard } from "@/components/cotizador/CotizadorWizard";
import type { TipoCotizacion } from "@/components/cotizador/types";
import { getProductoPorId } from "@/lib/supabase/queries";

const TIPOS: TipoCotizacion[] = ["fullday", "hospedaje", "boleteria", "paquete"];

// Title/description por tipo, alineados a lo que la gente busca de verdad
// ("boletos aéreos nacionales Venezuela", "full day Morrocoy", "posadas Los
// Roques"). El title es sin marca — el template del layout la agrega.
const SEO_POR_TIPO: Record<TipoCotizacion, { title: string; description: string }> = {
  fullday: {
    title: "Cotizar Full Day en Venezuela",
    description:
      "Cotiza tu full day de playa o montaña: Los Roques, Morrocoy, Chichiriviche y más. Dinos fecha y cuántos van, y un asesor te responde por WhatsApp.",
  },
  hospedaje: {
    title: "Cotizar Hospedaje — Hoteles y Posadas en Venezuela",
    description:
      "Cotiza hoteles y posadas en Margarita, Los Roques, Morrocoy y Mérida. Indica fechas y personas, y recibe disponibilidad y precio real por WhatsApp.",
  },
  boleteria: {
    title: "Cotizar Boletos Aéreos Nacionales en Venezuela",
    description:
      "Cotiza boletos aéreos dentro de Venezuela: Caracas, Porlamar, Los Roques y más rutas nacionales. También si compras desde el exterior para un familiar.",
  },
  paquete: {
    title: "Cotizar Paquete Todo Incluido en Venezuela",
    description:
      "Cotiza tu paquete todo incluido: Los Roques, Canaima, Margarita o Mérida. Vuelo, hospedaje y excursiones coordinados por un asesor en un solo lugar.",
  },
  personalizado: {
    title: "Cotizador Personalizado",
    description:
      "Cuéntanos destino, fechas, presupuesto y cantidad de personas — un asesor arma una propuesta de viaje a tu medida en Venezuela.",
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
      {producto ? (
        <p className="mb-4 rounded-xl bg-seafoam-bg px-4 py-2.5 text-sm text-seafoam-text">
          Cotizando para <strong>{producto.nombre}</strong>
        </p>
      ) : null}
      <CotizadorWizard tipo={tipo} productoNombre={producto?.nombre} />
    </main>
  );
}
