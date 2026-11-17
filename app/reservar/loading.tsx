import { Esqueleto } from "@/components/ui/Esqueleto";

// Misma forma que /reservar mientras el servidor lee el hotel y el tarifario: sin saltos al llegar.
// Contenedor de `page.tsx` y grilla de `ReservarCliente` copiados tal cual (B-24): si cambian allá, cambian acá.
export default function CargandoReservar() {
  return (
    <main aria-busy="true" className="mx-auto max-w-[var(--ancho-contenido)] px-4 py-4 sm:px-5 md:py-6 lg:pt-4 lg:pb-12">
      <span className="sr-only">Cargando la reserva…</span>
      <div className="flex flex-col gap-5 lg:gap-4">
        {/* Cabecera: franja con foto en el teléfono, tarjeta con miniatura y total desde lg. */}
        <Esqueleto className="h-24 rounded-card sm:h-28 lg:h-18" />
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start lg:gap-8 xl:grid-cols-3">
          <div className="flex min-w-0 flex-col gap-6 lg:gap-5">
            <div className="flex flex-col gap-3 lg:gap-2.5 lg:pl-6 xl:pl-5">
              <Esqueleto className="h-8 w-1/2 lg:h-7" />
              <Esqueleto className="h-32 rounded-card lg:h-20" />
            </div>
            <div className="flex flex-col gap-3 lg:gap-2.5 lg:pl-6 xl:pl-5">
              <Esqueleto className="h-8 w-1/3 lg:h-7" />
              <Esqueleto className="h-16 rounded-card" />
              <Esqueleto className="h-16 rounded-card" />
              <Esqueleto className="h-16 rounded-card" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-6 lg:gap-5 xl:contents">
            <div className="flex flex-col gap-3 lg:gap-2.5 lg:pl-6 xl:pl-5">
              <Esqueleto className="h-8 w-1/3 lg:h-7" />
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Esqueleto className="h-16 rounded-card" />
                <Esqueleto className="h-16 rounded-card" />
              </div>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <Esqueleto className="h-16 rounded-card" />
                <Esqueleto className="h-16 rounded-card" />
                <Esqueleto className="h-16 rounded-card" />
              </div>
            </div>
            <div className="hidden flex-col gap-3 lg:flex lg:gap-2.5 lg:pl-6 xl:pl-5">
              <Esqueleto className="h-7 w-1/3" />
              <Esqueleto className="h-36 rounded-card xl:h-64" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
