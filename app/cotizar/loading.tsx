import { Esqueleto } from "@/components/ui/Esqueleto";

// "Arme su viaje": título, barra del viaje (solo escritorio; en el teléfono es
// un renglón), pestañas y panel a la izquierda, resumen a la derecha. Mismas
// medidas que app/cotizar/page.tsx y CotizadorViaje para que nada salte.
export default function CargandoCotizar() {
  return (
    <div role="status" className="mx-auto max-w-6xl px-5 py-6 md:py-10">
      <span className="sr-only">Cargando el cotizador…</span>
      <Esqueleto className="h-9 w-56 md:h-11" />
      <Esqueleto className="mt-5 h-14 rounded-card lg:h-20" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] xl:gap-12">
        <div>
          <div className="flex gap-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Esqueleto key={i} className="h-11 w-32 rounded-control" />
            ))}
          </div>
          <Esqueleto className="mt-4 h-96 rounded-card" />
        </div>
        <Esqueleto className="hidden h-[28rem] rounded-card lg:block" />
      </div>
    </div>
  );
}
