import type { Metadata } from "next";
import { CotizadorWizard } from "@/components/cotizador/CotizadorWizard";

export const metadata: Metadata = {
  title: "Cotizador Personalizado",
  description:
    "Cuéntanos qué tienes en mente — destino, presupuesto, fechas y cantidad de personas — y un asesor te prepara una propuesta a medida.",
  alternates: { canonical: "/cotizador-personalizado" },
};

export default function CotizadorPersonalizadoPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-10 pb-28 lg:pb-10">
      <div className="mb-6 text-center">
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-coral">A tu medida</p>
        <h1 className="font-display text-3xl font-semibold text-ink">Cotizador Personalizado</h1>
        <p className="mt-2 text-ink-soft">
          Nada elegido todavía — cuéntanos qué buscas y armamos una propuesta pensada para ti.
        </p>
      </div>
      <CotizadorWizard tipo="personalizado" />
    </main>
  );
}
