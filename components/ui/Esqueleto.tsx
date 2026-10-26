/** Bloque de carga. Pulso suave, quieto con movimiento reducido. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={"animate-pulse rounded-media bg-sand-2 motion-reduce:animate-none " + className} />;
}

/** Tarjeta de catálogo en carga: mismas filas que TicketCard (foto 4:3,
 * precio, unidad, título de 2 líneas, hotel, resumen y talón de 4,5 rem) para
 * que la fila no salte al llegar. */
export function EsqueletoTarjeta() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-card border border-linea bg-card">
      <Esqueleto className="aspect-[3/2] rounded-none" />
      <div className="px-4 pb-3.5 pt-3">
        <Esqueleto className="h-9 w-2/5" />
        <Esqueleto className="h-8 w-3/5 sm:h-4" />
        <Esqueleto className="mt-2 h-11 w-full" />
        <Esqueleto className="mt-1 h-5 w-1/2" />
        <Esqueleto className="mt-2 h-8 w-full max-sm:hidden" />
      </div>
      <div className="flex h-16 items-center gap-2 border-t border-dashed border-linea-fuerte px-4">
        <div className="flex-1 space-y-1.5">
          <Esqueleto className="h-3 w-1/2" />
          <Esqueleto className="h-3 w-2/3" />
        </div>
        <Esqueleto className="h-11 w-11 rounded-control" />
        <Esqueleto className="h-11 w-24 rounded-control" />
      </div>
    </div>
  );
}
