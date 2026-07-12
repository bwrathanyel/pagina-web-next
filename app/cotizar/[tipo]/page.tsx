import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CotizadorWizard } from "@/components/cotizador/CotizadorWizard";
import type { TipoCotizacion } from "@/components/cotizador/types";
import { getProductoPorId } from "@/lib/supabase/queries";

const TIPOS: TipoCotizacion[] = ["fullday", "hospedaje", "boleteria", "paquete"];

function isTipo(value: string): value is TipoCotizacion {
  return (TIPOS as string[]).includes(value);
}

export function generateStaticParams() {
  return TIPOS.map((tipo) => ({ tipo }));
}

export const metadata: Metadata = {
  title: "Cotizar | Lotus 360",
  description: "Cotiza tu hospedaje, vuelo, tour o paquete con Lotus 360 en unos pasos.",
};

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
    <main className="mx-auto max-w-xl px-5 py-10">
      {producto ? (
        <p className="mb-4 rounded-xl bg-seafoam-bg px-4 py-2.5 text-sm text-seafoam-text">
          Cotizando para <strong>{producto.nombre}</strong>
        </p>
      ) : null}
      <CotizadorWizard tipo={tipo} productoNombre={producto?.nombre} />
    </main>
  );
}
