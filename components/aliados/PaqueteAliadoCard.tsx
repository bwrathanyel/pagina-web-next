import { CardPhotoGallery } from "@/components/catalogo/CardPhotoGallery";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import type { PaqueteAliado } from "@/lib/aliados";
import { fechaCorta, montoConMoneda } from "@/lib/tarifas";

// "TODO INCLUIDO" -> "Todo incluido": el plan llega en mayúsculas del PDF.
const planLegible = (plan: string | null) => {
  const p = plan?.trim().toLocaleLowerCase("es");
  return p ? p[0].toLocaleUpperCase("es") + p.slice(1) : null;
};

/** Hot Sale armada como paquete: total para 2 adultos con el descuento del
 * aliado, y el total Hot Sale tachado al lado para que se vea el ahorro. */
export function PaqueteAliadoCard({
  paquete: p,
  descuento,
  cotizarHref,
  prioridad = false,
}: {
  paquete: PaqueteAliado;
  descuento: number;
  cotizarHref: string;
  prioridad?: boolean;
}) {
  const plan = planLegible(p.plan);
  const ahorro = Math.round((p.total - p.totalAliado) * 100) / 100;

  return (
    <Boleto
      tamanoTalon="4.5rem"
      className="h-full transition-[transform,border-color] duration-[var(--dur-media)] ease-salida hover:-translate-y-1 hover:border-acento/60 motion-reduce:transition-none"
      talon={
        <div className="flex h-full items-center gap-2 px-4">
          <p className="min-w-0 flex-1 truncate font-mono text-xs font-bold uppercase tracking-widest text-ink">
            {p.destino || " "}
          </p>
          <Boton
            href={cotizarHref}
            aria-label={`Cotizar ${p.hotel}`}
            tamano="sm"
            className="flex-shrink-0"
            iconoFin={<Icono nombre="flecha-der" tamano={16} />}
          >
            Cotizar
          </Boton>
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-sand-2">
          <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
            <Etiqueta tono="acento" icono={<Icono nombre="destello" tamano={12} />}>
              Hot Sale
            </Etiqueta>
            {p.ninosGratis > 0 ? (
              <Etiqueta tono="seafoam">{p.ninosGratis === 1 ? "Niño gratis" : `${p.ninosGratis} niños gratis`}</Etiqueta>
            ) : null}
          </div>
          <Etiqueta tono="ambar" className="absolute right-3 top-3 z-10">
            −{descuento}% aliado
          </Etiqueta>
          {p.fotos.length > 0 ? (
            <CardPhotoGallery fotos={p.fotos} alt={p.hotel} referencial={p.fotosReferenciales} prioridad={prioridad} />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-seafoam-bg via-sand-2 to-card" />
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-4 pt-3.5">
          <h3 className="line-clamp-2 font-body text-lg font-bold leading-snug text-ink">{p.hotel}</h3>
          {p.titulo ? <p className="mt-0.5 truncate text-sm text-ink-soft">{p.titulo}</p> : null}

          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm font-semibold text-ink">
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-acento"><Icono nombre="usuario" tamano={16} /></span>
              {p.adultos} adultos
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-acento"><Icono nombre="calendario" tamano={16} /></span>
              {p.noches} {p.noches === 1 ? "noche" : "noches"}
            </li>
            {plan ? (
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-seafoam"><Icono nombre="check" tamano={16} /></span>
                {plan}
              </li>
            ) : null}
          </ul>

          <div className="mt-auto pt-4">
            <p className="font-mono text-xs text-ink-soft">
              Hot Sale{" "}
              <s>
                <PrecioMostrado texto={montoConMoneda(p.total, p.moneda)} />
              </s>
            </p>
            <p className="font-mono text-3xl font-bold leading-tight tabular-nums text-acento">
              <PrecioMostrado texto={montoConMoneda(p.totalAliado, p.moneda)} />
            </p>
            <p className="text-xs text-ink-soft">
              Total del paquete · ahorra <PrecioMostrado texto={montoConMoneda(ahorro, p.moneda)} />
            </p>
            {p.viajeHasta || p.ventaHasta ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-soft">
                <span aria-hidden="true" className="text-acento"><Icono nombre="calendario" tamano={12} /></span>
                {p.viajeHasta ? `Para viajar hasta el ${fechaCorta(p.viajeHasta)}` : `Reserve hasta el ${fechaCorta(p.ventaHasta!)}`}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Boleto>
  );
}
