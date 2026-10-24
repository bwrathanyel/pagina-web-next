import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ReservarCliente } from "@/components/reserva/ReservarCliente";
import type { Pasajeros } from "@/components/reserva/PaseFechas";
import { MAX_BEBES, MAX_PAX } from "@/lib/checkout/calculo";
import { Boton } from "@/components/ui/Boton";
import { hotelParaCobrar, vitrinaDeHabitaciones, type HotelCobrable } from "@/lib/checkout/datos";
import { getHotelCotizador } from "@/lib/supabase/queries";
import { POLITICA_CANCELACION } from "@/lib/checkout/politica";
import { vendibleHoy } from "@/lib/tarifas";
import { whatsappHref } from "@/lib/whatsapp";

// Compra directa de hospedaje (Plan 1), fuera de buscadores. Se entra desde la ficha o el cotizador:
// /reservar?hotel=<id>&tarifa=<id>&desde=AAAA-MM-DD&hasta=AAAA-MM-DD&adultos=2&edades=5,8&bebes=1.
export const metadata: Metadata = {
  title: "Reservar y pagar",
  robots: { index: false, follow: false },
};

// El hotel y el tarifario cambian a diario: nada de caché de página.
export const dynamic = "force-dynamic";

const entero = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d{1,9}$/.test(s) ? Number(s) : null;
};
const fecha = (v: string | string[] | undefined) => {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : "";
};
// Viajeros que trae el cotizador. Fuera de lo que vende el checkout (calculo.ts) se ignoran todos
// y el cliente los elige aquí.
function pasajeros(q: Record<string, string | string[] | undefined>): Pasajeros | null {
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

export default async function ReservarPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await searchParams;
  const productoId = entero(q.hotel);
  if (!productoId) notFound();

  // La foto y el destino público van en una consulta aparte: `hotelParaCobrar` es la que usa el POST
  // de /api/checkout y no debe cargar nada que no se cobre.
  const [hotel, vitrina, fichas] = await Promise.all([
    hotelParaCobrar(productoId).catch((): HotelCobrable | null => null),
    getHotelCotizador(productoId).catch(() => null),
    vitrinaDeHabitaciones(productoId).catch(() => ({ habitaciones: [], fotosHotel: [] })),
  ]);
  if (!hotel) notFound();

  // Sin la política de cancelación redactada el cliente no puede aceptarla antes de pagar: no se vende.
  const vendibles = hotel.tarifas.filter(vendibleHoy);
  if (!POLITICA_CANCELACION || !vendibles.length) {
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
    <main className="mx-auto max-w-[var(--ancho-medio)] px-4 py-5 sm:px-5 md:py-8 lg:pb-12">
      <ReservarCliente
        hotel={{ id: hotel.id, nombre: hotel.nombre, tarifas: vendibles }}
        destino={vitrina?.destino ?? hotel.destino}
        foto={vitrina?.foto ?? null}
        habitaciones={fichas.habitaciones}
        fotosHotel={fichas.fotosHotel}
        inicial={{ tarifaId: entero(q.tarifa), desde: fecha(q.desde), hasta: fecha(q.hasta), pasajeros: pasajeros(q) }}
        politica={POLITICA_CANCELACION}
      />
    </main>
  );
}
