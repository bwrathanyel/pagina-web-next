import { Esqueleto } from "@/components/ui/Esqueleto";

// Misma forma que /reservar mientras el servidor lee el hotel y el tarifario: sin saltos al llegar.
// Contenedor de `page.tsx` y grilla de `ReservarCliente` copiados tal cual (B-24): si cambian allá, cambian acá.
export default function CargandoReservar() {
  return (
    <main aria-busy="true" className="mx-auto max-w-[var(--ancho-contenido)] px-4 py-5 sm:px-5 md:py-8 lg:pb-12">
      <span className="sr-only">Cargando la reserva…</span>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_30rem] xl:gap-10">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Banda de la foto del hotel (16:9 en el teléfono, 21:9 desde lg) y tramos numerados. */}
          <Esqueleto className="aspect-video rounded-card lg:aspect-[21/9]" />
          <div className="flex flex-col gap-3 lg:pl-6">
            <Esqueleto className="h-8 w-1/2" />
            <Esqueleto className="h-36 rounded-card lg:h-48" />
          </div>
          <div className="flex flex-col gap-3 lg:pl-6">
            <Esqueleto className="h-8 w-1/3" />
            <div className="grid gap-3 lg:grid-cols-2">
              <Esqueleto className="h-16 rounded-card" />
              <Esqueleto className="h-16 rounded-card" />
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:pl-6">
            <Esqueleto className="h-8 w-1/3" />
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Esqueleto className="h-20 rounded-card" />
              <Esqueleto className="h-20 rounded-card" />
              <Esqueleto className="h-20 rounded-card" />
            </div>
          </div>
        </div>
        <Esqueleto className="hidden h-128 rounded-card lg:block" />
      </div>
    </main>
  );
}
