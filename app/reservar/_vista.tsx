import { notFound } from "next/navigation";
import { FondoPaisaje } from "@/components/layout/FondoPaisaje";
import { LimpiarUrl } from "@/components/reserva/LimpiarUrl";
import { ReservarCliente } from "@/components/reserva/ReservarCliente";
import type { Pasajeros } from "@/components/reserva/PaseFechas";
import { MAX_BEBES, MAX_PAX } from "@/lib/checkout/calculo";
import { Boton } from "@/components/ui/Boton";
import { hotelParaCobrar, slugsDeHoteles, vitrinaDeHabitaciones, type HotelCobrable } from "@/lib/checkout/datos";
import { esDestinoCompraDirecta } from "@/lib/checkout/destinos";
import type { HotelAlternativo } from "@/components/reserva/OtrosHoteles";
import { leerVueloPedido } from "@/lib/cotizador/estado";
import { ofertasHoteles } from "@/lib/cotizador/ofertas";
import { getHotelCotizador, hotSalesCotizar, promocionesCotizar, rutasAereasGuia, rutasVueloCotizar } from "@/lib/supabase/queries";
import { POLITICA_CANCELACION } from "@/lib/checkout/politica";
import { vendibleHoy } from "@/lib/tarifas";
import { whatsappHref } from "@/lib/whatsapp";

export type Consulta = Record<string, string | string[] | undefined>;

export const entero = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d{1,9}$/.test(s) ? Number(s) : null;
};
const fecha = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};
// Viajeros que trae el cotizador. Fuera de lo que vende el checkout (calculo.ts) se ignoran todos
// y el cliente los elige aquí.
function pasajeros(q: Consulta): Pasajeros | null {
  const adultos = entero(q.adultos);
  if (adultos === null) return null;
  const crudo = Array.isArray(q.edades) ? q.edades[0] : q.edades;
  const edades = crudo ? crudo.split(",").map((e) => entero(e.trim())) : [];
  const bebes = entero(q.bebes) ?? 0;
  const validos =
    adultos >= 1 && bebes <= MAX_BEBES && edades.every((e) => e !== null && e >= 2 && e <= 11) &&
    adultos + edades.length + bebes <= MAX_PAX;
  return validos ? { adultos, edades, bebes } : null;
}

/** Pantalla de /reservar para un hotel. La leen /reservar?hotel=<id>… (enlaces de la ficha y del cotizador)
 * y /reservar/<slug>; en ambas la barra de direcciones termina en /reservar/<slug>. `q` trae lo que el
 * enlace pidió (tarifa, fechas, viajeros, vuelo): sin query, el borrador de sessionStorage manda. */
export async function VistaReservar({ productoId, q }: { productoId: number; q: Consulta }) {
  // La foto y el destino público van en una consulta aparte: `hotelParaCobrar` es la que usa el POST
  // de /api/checkout y no debe cargar nada que no se cobre.
  // Otros hoteles del destino: las mismas ofertas de /cotizar (Hot Sales delante). Si falla, no se muestran.
  const [hotel, vitrina, fichas, ofertas, rutasVuelo, guiaRutas, slugs] = await Promise.all([
    hotelParaCobrar(productoId).catch((): HotelCobrable | null => null),
    getHotelCotizador(productoId).catch(() => null),
    vitrinaDeHabitaciones(productoId).catch(() => ({ habitaciones: [], fotosHotel: [] })),
    Promise.all([hotSalesCotizar().catch(() => []), promocionesCotizar()])
      .then(([hot, promos]) => {
        const ids = new Set(hot.map((h) => h.id));
        return ofertasHoteles([...hot, ...promos.filter((p) => !ids.has(p.id))]);
      })
      .catch(() => []),
    // Boleto aparte (BoletoAereo): sin rutas el vuelo queda «a confirmar» y sin guía no se muestra.
    rutasVueloCotizar().catch(() => []),
    rutasAereasGuia().catch(() => []),
    // Solo adorno de la barra de direcciones: si falla, la URL queda como llegó.
    slugsDeHoteles().catch(() => null),
  ]);
  if (!hotel) notFound();
  const slug = slugs?.porId.get(hotel.id);
  const propio = ofertas.find((o) => o.hotelId === hotel.id)?.destino;
  const otrosHoteles: HotelAlternativo[] = ofertas
    .filter((o) => o.hotelId !== hotel.id && esDestinoCompraDirecta(o.destino) && (!propio || o.destino === propio))
    .map(({ hotelId, nombre, foto, precio }) => ({ hotelId, nombre, foto, precio }));

  // Sin la política de cancelación redactada el cliente no puede aceptarla antes de pagar: no se vende.
  // Fuera de los destinos con compra directa tampoco (el POST lo rechaza igual).
  const vendibles = hotel.tarifas.filter(vendibleHoy);
  if (!POLITICA_CANCELACION || !vendibles.length || !esDestinoCompraDirecta(hotel.destino)) {
    return (
      <main className="mx-auto max-w-lg px-5 py-10">
        <h1 className="font-display text-3xl font-bold text-ink">Reserva directa próximamente</h1>
        <p className="mt-3 text-ink-soft">Por ahora un asesor le arma la reserva de {hotel.nombre} y le indica cómo pagar.</p>
        <div className="mt-6">
          <Boton href={whatsappHref(`Hola, quiero reservar en ${hotel.nombre}.`)} tamano="lg" ancho>Escribirnos por WhatsApp</Boton>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[var(--ancho-contenido)] px-4 py-4 sm:px-5 md:py-6 lg:pt-4 lg:pb-12">
      <FondoPaisaje destino={vitrina?.destino ?? hotel.destino} />
      {slug ? <LimpiarUrl ruta={`/reservar/${slug}`} /> : null}
      {/* El key rearma el formulario al pasar a otro hotel desde «Otros hoteles en {destino}». */}
      <ReservarCliente
        key={hotel.id}
        otrosHoteles={otrosHoteles}
        rutasVuelo={rutasVuelo}
        guiaRutas={guiaRutas}
        hotel={{ id: hotel.id, nombre: hotel.nombre, tarifas: vendibles }}
        destino={vitrina?.destino ?? hotel.destino}
        foto={vitrina?.foto ?? null}
        habitaciones={fichas.habitaciones}
        fotosHotel={fichas.fotosHotel}
        inicial={{ tarifaId: entero(q.tarifa), desde: fecha(q.desde), hasta: fecha(q.hasta), pasajeros: pasajeros(q) }}
        vueloPedido={leerVueloPedido(q)}
        politica={POLITICA_CANCELACION}
      />
    </main>
  );
}
