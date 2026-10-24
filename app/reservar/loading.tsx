import { Esqueleto } from "@/components/ui/Esqueleto";

// Misma forma que /reservar mientras el servidor lee el hotel y el tarifario: sin saltos al llegar.
export default function CargandoReservar() {
  return (
    <main aria-busy="true" className="mx-auto max-w-[var(--ancho-medio)] px-4 py-5 sm:px-5 md:py-8">
      <span className="sr-only">Cargando la reserva…</span>
      <div className="flex items-center gap-3">
        <Esqueleto className="h-12 w-12 rounded-control lg:hidden" />
        <div className="flex flex-1 flex-col gap-2">
          <Esqueleto className="h-6 w-2/3 lg:h-10" />
          <Esqueleto className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
        <div className="flex flex-col gap-8">
          <Esqueleto className="h-36 rounded-card lg:h-48" />
          <div className="grid gap-3 lg:grid-cols-2">
            <Esqueleto className="h-16 rounded-card" />
            <Esqueleto className="h-16 rounded-card" />
          </div>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <Esqueleto className="h-14 rounded-card" />
            <Esqueleto className="h-14 rounded-card" />
            <Esqueleto className="h-14 rounded-card" />
          </div>
        </div>
        <Esqueleto className="hidden h-128 rounded-card lg:block" />
      </div>
    </main>
  );
}
