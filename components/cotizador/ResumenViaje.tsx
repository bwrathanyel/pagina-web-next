import Image from "next/image";
import type { ReactNode } from "react";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { fechasVuelo, nochesDe, textoViajeros, type EstadoViaje } from "@/lib/cotizador/estado";
import type { Estimado } from "@/lib/cotizador/estimado";
import { textoBoletos, type VueloViaje } from "@/lib/cotizador/vuelo";
import { montoConMoneda } from "@/lib/tarifas";
import type { HotelCotizador } from "@/lib/supabase/queries";

const CORTA = new Intl.DateTimeFormat("es-VE", { day: "numeric", month: "short", timeZone: "UTC" });
const fechaCorta = (iso: string) => CORTA.format(new Date(`${iso}T00:00:00Z`));

/** "12 oct al 16 oct" / "12 oct" / "Fechas por definir". */
export function textoFechas(e: EstadoViaje): string {
  if (!e.desde) return "Fechas por definir";
  return e.hasta ? `${fechaCorta(e.desde)} al ${fechaCorta(e.hasta)}` : fechaCorta(e.desde);
}

function Linea({
  numero,
  foto,
  titulo,
  precio,
  children,
}: {
  numero: number;
  foto?: string | null;
  titulo: string;
  precio?: ReactNode;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3 px-5 py-3">
      <span aria-hidden="true" className="font-mono text-sm font-bold tabular-nums text-ink-soft">
        {numero}
      </span>
      {foto ? (
        <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-control bg-sand-2">
          <Image src={foto} alt="" fill sizes="64px" className="object-cover" />
        </span>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-snug text-ink">{titulo}</p>
        <div className="mt-0.5 flex flex-col text-sm leading-snug text-ink-soft">{children}</div>
        {precio === null ? null : (
          <p className="mt-1 text-sm font-medium text-ink-soft">{precio ?? "Precio a confirmar"}</p>
        )}
      </div>
    </li>
  );
}

/** "Su cotización" con forma de pase: los servicios pedidos arriba y, en el
 * talón, el estimado y el envío. Tienen número el hospedaje con tarifa aplicable
 * (estimarEstadia) y el vuelo con ruta de referencia (estimarVuelo, aproximado);
 * lo demás es "A confirmar": nunca un número inventado. */
export function ResumenViaje({
  estado,
  hotel,
  habitacion,
  estimado,
  formId,
  enviando,
  conTitulo = true,
  datos,
  desde,
  tours = [],
  vuelo = null,
}: {
  estado: EstadoViaje;
  hotel: Pick<HotelCotizador, "nombre" | "foto"> | null;
  habitacion?: string | null;
  estimado?: Estimado | null;
  formId: string;
  enviando: boolean;
  conTitulo?: boolean;
  /** Nombre y WhatsApp: van en el pase, justo encima del envío. */
  datos?: ReactNode;
  /** Precio anunciado por la oferta, para mostrar mientras faltan fechas. */
  desde?: { monto: string; unidad: string | null } | null;
  /** Nombres de los tours agregados. */
  tours?: string[];
  /** Ruta y aproximado del vuelo; sin él, el vuelo queda "a confirmar". */
  vuelo?: VueloViaje | null;
}) {
  const noches = nochesDe(estado);
  const fechas = textoFechas(estado);
  const detalleFechas = noches > 0 ? `${fechas} · ${noches} ${noches === 1 ? "noche" : "noches"}` : fechas;
  const viajeros = textoViajeros(estado);
  const hospedaje = estado.servicios.includes("hospedaje");
  const monto = hospedaje && estimado?.ok ? montoConMoneda(estimado.total, estimado.moneda) : null;
  const conVuelo = estado.servicios.includes("vuelo");
  const vueloTotal = conVuelo && vuelo?.total != null ? vuelo.total : null;
  const montoVuelo = vueloTotal !== null ? montoConMoneda(vueloTotal, "USD") : null;
  // El vuelo es en dólares: solo se suma a un hospedaje en dólares.
  const sumable = monto && montoVuelo && estimado?.ok && (estimado.moneda ?? "USD") === "USD";
  const montoTalon = sumable && estimado?.ok ? montoConMoneda(estimado.total + (vueloTotal as number), "USD") : monto ?? montoVuelo;
  const etiquetaTalon = sumable ? "Hospedaje + vuelo aprox." : !monto && montoVuelo ? "Vuelo aprox." : null;
  const pendientes = [conVuelo && !montoVuelo && "vuelo", estado.servicios.includes("tours") && "tours"].filter(Boolean) as string[];
  const destinoVuelo =
    vuelo?.destino === "otro" ? vuelo.destinoNombre || "otro destino" : vuelo?.destinoNombre || estado.destino;
  // Con un solo servicio el talón ya dice el precio: la línea no lo repite.
  const unico = estado.servicios.length === 1;
  // Sin fechas no hay estimado: se muestra el precio anunciado de la oferta, con su unidad.
  const referencia = !montoTalon && hospedaje && desde ? desde : null;
  const vueloFechas = fechasVuelo(estado);
  let n = 0;

  return (
    <Boleto
      orientacion="h"
      // El talón tiene alto fijo: solo caben el total y el envío. Los avisos van
      // arriba de la perforación, si no desbordan hacia la lista.
      tamanoTalon="7.5rem"
      talon={
        <div className="flex h-full flex-col justify-center gap-3 px-5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold text-ink-soft">{referencia ? "Desde" : (etiquetaTalon ?? "Estimado")}</span>
            <span className="font-mono text-2xl font-bold tabular-nums text-ink" aria-live="polite">
              {montoTalon ? <PrecioMostrado texto={montoTalon} /> : referencia ? <PrecioMostrado texto={referencia.monto} /> : "A confirmar"}
            </span>
          </div>
          <Boton type="submit" form={formId} tamano="lg" ancho cargando={enviando}>
            Enviar solicitud
          </Boton>
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
        </div>
      }
    >
      {conTitulo ? <h2 className="px-5 pt-4 font-display text-2xl font-bold leading-none text-ink">Su cotización</h2> : null}
      <ul className={(conTitulo ? "mt-2 " : "") + "divide-y divide-dashed divide-linea-fuerte"}>
        {estado.servicios.includes("hospedaje") ? (
          <Linea
            numero={++n}
            foto={hotel?.foto}
            titulo={hotel?.nombre ?? `Hospedaje en ${estado.destino}`}
            precio={
              unico ? null : monto ? (
                <>
                  Estimado <PrecioMostrado texto={monto} />
                </>
              ) : undefined
            }
          >
            {hotel ? null : <span>Un asesor propone hoteles</span>}
            {hotel && habitacion ? <span>{habitacion}</span> : null}
            <span>{detalleFechas}</span>
            <span>{viajeros}</span>
          </Linea>
        ) : null}
        {estado.servicios.includes("vuelo") ? (
          <Linea
            numero={++n}
            precio={
              unico ? null : montoVuelo ? (
                <>
                  Total aprox. <PrecioMostrado texto={montoVuelo} />
                </>
              ) : undefined
            }
            titulo={`Vuelo ${estado.origen} a ${destinoVuelo}`}
          >
            <span>{estado.vuelo === "ida" ? "Solo ida" : "Ida y vuelta"}</span>
            <span>
              {vueloFechas.propias || !estado.servicios.includes("hospedaje")
                ? `${textoFechas({ ...estado, desde: vueloFechas.ida, hasta: vueloFechas.vuelta })} · ${viajeros}`
                : viajeros}
            </span>
            {estado.flexible ? <span>Fechas flexibles</span> : null}
            {vueloTotal !== null && vuelo?.porPersona ? (
              <span>
                <PrecioMostrado texto={montoConMoneda(vuelo.porPersona, "USD")} /> por boleto ·{" "}
                {textoBoletos(vueloTotal / vuelo.porPersona)}
              </span>
            ) : null}
          </Linea>
        ) : null}
        {estado.servicios.includes("tours") ? (
          <Linea numero={++n} precio={unico ? null : undefined} titulo={`Full day y tours en ${estado.destino}`}>
            {tours.length ? tours.map((t) => <span key={t}>{t}</span>) : <span>Un asesor propone los disponibles</span>}
            <span>Grupo mínimo de 15 personas</span>
          </Linea>
        ) : null}
      </ul>
      {datos ? (
        <div className="border-t border-dashed border-linea-fuerte px-5 pb-4 pt-3">
          {datos}
        </div>
      ) : null}
      <p className="px-5 pb-4 pt-1 text-xs text-ink-soft">
        {referencia ? `${referencia.unidad ? `${referencia.unidad[0].toUpperCase()}${referencia.unidad.slice(1)}. ` : ""}Elija fechas para ver su total. ` : ""}
        {montoTalon && pendientes.length ? `${pendientes.join(" y ").replace(/^./, (c) => c.toUpperCase())} a confirmar. ` : ""}
        {montoVuelo ? "El vuelo es aproximado: la boletería cambia según la disponibilidad y puede salir menos. " : ""}
        Sujeto a disponibilidad. El asesor le escribe por WhatsApp con el precio final.
      </p>
    </Boleto>
  );
}
