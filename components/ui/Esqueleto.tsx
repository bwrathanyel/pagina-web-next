/** Bloque de carga. Pulso suave, quieto con movimiento reducido. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={"animate-pulse rounded-media bg-sand-2 motion-reduce:animate-none " + className} />;
}

/** Tarjeta de catálogo en carga: misma proporción que TicketCard (foto 3:4,
 * datos, botón y talón de 5,25 rem) para que la fila no salte al llegar. */
export function EsqueletoTarjeta() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-card border border-linea bg-card">
      <Esqueleto className="aspect-[3/4] rounded-none" />
      <div className="space-y-2.5 px-4 pb-4 pt-3.5">
        <Esqueleto className="h-5 w-3/4" />
        <Esqueleto className="h-4 w-1/2" />
        <Esqueleto className="h-11 w-full rounded-control" />
      </div>
      <div className="h-[5.25rem] space-y-2 border-t border-dashed border-linea-fuerte px-4 py-3.5">
        <Esqueleto className="h-3 w-1/3" />
        <Esqueleto className="h-5 w-1/2" />
      </div>
    </div>
  );
}
