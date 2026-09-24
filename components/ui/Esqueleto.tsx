/** Bloque de carga. Pulso suave, quieto con movimiento reducido. */
export function Esqueleto({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={"animate-pulse rounded-media bg-sand-2 motion-reduce:animate-none " + className} />;
}

/** Tarjeta de catálogo en carga: misma proporción que la real para que la
 * grilla no salte cuando llegan los datos. */
export function EsqueletoTarjeta() {
  return (
    <div aria-hidden="true" className="overflow-hidden rounded-card border border-linea bg-card">
      <Esqueleto className="aspect-[4/3] rounded-none" />
      <div className="space-y-3 p-4">
        <Esqueleto className="h-5 w-3/4" />
        <Esqueleto className="h-4 w-1/2" />
        <div className="flex items-end justify-between pt-2">
          <Esqueleto className="h-7 w-24" />
          <Esqueleto className="h-11 w-28 rounded-control" />
        </div>
      </div>
    </div>
  );
}
