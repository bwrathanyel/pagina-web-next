import { Esqueleto } from "@/components/ui/Esqueleto";

// "Arme su viaje": título, barra del viaje (solo escritorio; en el teléfono es
// un renglón), panel a la izquierda, resumen a la derecha. Contenedor, paddings
// y alturas copiados de app/cotizar/page.tsx y del return de CotizadorViaje:
// si no coinciden, al llegar la página todo baja o sube unos píxeles.
export default function CargandoCotizar() {
  return (
    <div role="status" className="mx-auto max-w-6xl px-4 py-5 pb-32 sm:px-5 md:py-6 lg:pb-10">
      <span className="sr-only">Cargando el cotizador…</span>
      <Esqueleto className="mb-4 h-[30px] w-56 sm:h-9" />
      <Esqueleto className="mb-4 hidden h-[72px] rounded-card lg:block" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
        <div className="flex min-w-0 flex-col gap-6 md:gap-8">
          <Esqueleto className="h-[4.5rem] rounded-card lg:hidden" />
          <Esqueleto className="h-96 rounded-card" />
        </div>
        <Esqueleto className="hidden h-[28rem] rounded-card lg:block" />
      </div>
    </div>
  );
}
