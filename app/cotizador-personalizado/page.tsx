import type { Metadata } from "next";
import { CotizadorWizard } from "@/components/cotizador/CotizadorWizard";
import { inicialDesdeParams } from "@/lib/cotizador/cotizacionRapida";

export const metadata: Metadata = {
  title: "Cotizador Personalizado",
  description:
    "Cuéntenos qué tiene en mente (destino, presupuesto, fechas y cantidad de personas) y un asesor le prepara una propuesta a medida.",
  alternates: { canonical: "/cotizador-personalizado" },
};

export default async function CotizadorPersonalizadoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const inicial = inicialDesdeParams(await searchParams);
  const conInicial = Object.keys(inicial).length > 0;
  return (
    <main className="mx-auto max-w-xl px-5 py-6 pb-28 md:py-10 lg:pb-10">
      <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-5xl">Cotizador personalizado</h1>
      <p className="mb-6 mt-3 text-ink-soft">Cuéntenos qué busca y armamos una propuesta a su medida.</p>
      {/* El key rearma el wizard si cambia la URL sin desmontar la página
          (otra búsqueda desde la barra estando ya acá). */}
      <CotizadorWizard
        key={conInicial ? JSON.stringify(inicial) : "vacio"}
        tipo="personalizado"
        inicial={conInicial ? inicial : undefined}
      />
    </main>
  );
}
