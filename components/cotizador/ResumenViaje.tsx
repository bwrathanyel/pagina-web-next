import Image from "next/image";
import type { ReactNode } from "react";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { nochesDe, textoDuracion, textoViajeros, type EstadoViaje } from "@/lib/cotizador/estado";
import type { HotelCotizador } from "@/lib/supabase/queries";

const CORTA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" });
const fechaCorta = (iso: string) => CORTA.format(new Date(`${iso}T00:00:00Z`));

/** "12 oct al 16 oct" / "12 oct" / "Fechas por definir". */
export function textoFechas(e: EstadoViaje): string {
  if (!e.desde) return "Fechas por definir";
  return e.hasta ? `${fechaCorta(e.desde)} al ${fechaCorta(e.hasta)}` : fechaCorta(e.desde);
}

function Linea({ numero, foto, titulo, children }: { numero: number; foto?: string | null; titulo: string; children: ReactNode }) {
  return (
    <li className="flex gap-3 px-5 py-4">
      <span aria-hidden="true" className="font-mono text-sm font-bold tabular-nums text-ink-soft">
        {numero}
      </span>
      {foto ? (
        <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-control bg-sand-2">
          <Image src={foto} alt="" fill sizes="80px" className="object-cover" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-ink">{titulo}</p>
        <div className="mt-0.5 flex flex-col text-sm text-ink-soft">{children}</div>
        <p className="mt-1 text-sm font-medium text-ink-soft">Precio a confirmar</p>
      </div>
    </li>
  );
}

/** "Su cotización" con forma de pase: los servicios pedidos arriba y, en el
 * talón, el estimado y el envío. Hasta que haya tarifa aplicable el estimado
 * es "A confirmar": nunca un número inventado. */
export function ResumenViaje({
  estado,
  hotel,
  formId,
  enviando,
  conTitulo = true,
}: {
  estado: EstadoViaje;
  hotel: HotelCotizador | null;
  formId: string;
  enviando: boolean;
  conTitulo?: boolean;
}) {
  const noches = nochesDe(estado);
  const fechas = textoFechas(estado);
  const detalleFechas = noches > 0 ? `${fechas} · ${textoDuracion(noches)}` : fechas;
  const viajeros = textoViajeros(estado);
  let n = 0;

  return (
    <Boleto
      orientacion="h"
      tamanoTalon="12.5rem"
      talon={
        <div className="flex h-full flex-col justify-center gap-3 px-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-ink-soft">Estimado</span>
            <span className="font-mono text-2xl font-bold tabular-nums text-ink">A confirmar</span>
          </div>
          <p className="text-xs text-ink-soft">Sujeto a disponibilidad. El asesor confirma el precio final.</p>
          <Boton type="submit" form={formId} tamano="lg" ancho cargando={enviando}>
            Enviar solicitud
          </Boton>
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      {conTitulo ? <h2 className="px-5 pt-5 font-display text-3xl font-bold leading-none text-ink">Su cotización</h2> : null}
      <ul className={(conTitulo ? "mt-2 " : "") + "divide-y divide-dashed divide-linea-fuerte"}>
        {estado.servicios.includes("hospedaje") ? (
          <Linea numero={++n} foto={hotel?.foto} titulo={hotel?.nombre ?? `Hospedaje en ${estado.destino}`}>
            {hotel ? null : <span>Un asesor propone hoteles</span>}
            <span>{detalleFechas}</span>
            <span>{viajeros}</span>
          </Linea>
        ) : null}
        {estado.servicios.includes("vuelo") ? (
          <Linea numero={++n} titulo={`Vuelo ${estado.origen} a ${estado.destino}`}>
            <span>{estado.vuelo === "ida" ? "Solo ida" : "Ida y vuelta"}</span>
            <span>{estado.servicios.includes("hospedaje") ? viajeros : `${detalleFechas} · ${viajeros}`}</span>
          </Linea>
        ) : null}
        {estado.servicios.includes("tours") ? (
          <Linea numero={++n} titulo={`Full day y tours en ${estado.destino}`}>
            <span>Grupo mínimo de 15 personas</span>
          </Linea>
        ) : null}
      </ul>
    </Boleto>
  );
}
