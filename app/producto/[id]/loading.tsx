import { Esqueleto } from "@/components/ui/Esqueleto";

// Ficha de producto: galería a la izquierda, datos y CTA a la derecha, y la
// carpeta de tarifas debajo.
export default function CargandoProducto() {
  return (
    <div role="status" className="mx-auto max-w-5xl px-5 py-6 md:py-10">
      <span className="sr-only">Cargando la ficha…</span>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <Esqueleto className="aspect-[4/3] rounded-card" />
        <div className="space-y-4">
          <Esqueleto className="h-9 w-3/4" />
          <Esqueleto className="h-5 w-1/3" />
          <Esqueleto className="h-24 w-full" />
          <Esqueleto className="h-12 w-full rounded-control" />
        </div>
      </div>
      <Esqueleto className="mt-8 h-64 rounded-card" />
    </div>
  );
}
