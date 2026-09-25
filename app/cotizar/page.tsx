import type { Metadata } from "next";
import { CotizadorViaje } from "@/components/cotizador/CotizadorViaje";
import { DESTINOS, parsearEstado } from "@/lib/cotizador/estado";
import { getHotelCotizador } from "@/lib/supabase/queries";

const DESCRIPCION =
  "Arme su viaje en un solo lugar: hospedaje, vuelo, full day y tours. Indique destino, fechas y viajeros, y un asesor le responde por WhatsApp con el precio confirmado.";

export const metadata: Metadata = {
  title: "Arme su viaje: cotice hospedaje, vuelo y tours en Venezuela",
  description: DESCRIPCION,
  alternates: { canonical: "/cotizar" },
  openGraph: { title: "Arme su viaje", description: DESCRIPCION, url: "/cotizar" },
};

export default async function CotizarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  let estado = parsearEstado(sp);
  const hotel = estado.hotel ? await getHotelCotizador(estado.hotel).catch(() => null) : null;
  // Un hotel que no existe (o ya no está activo) se descarta; si el enlace no
  // traía destino, el del hotel manda.
  if (estado.hotel && !hotel) estado = { ...estado, hotel: null, tarifa: null };
  else if (hotel?.destino && !sp.destino && DESTINOS.includes(hotel.destino)) estado = { ...estado, destino: hotel.destino };

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 pb-44 md:py-10 lg:pb-10">
      <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-5xl">Arme su viaje</h1>
      <p className="mb-8 mt-3 max-w-2xl text-ink-soft">
        Elija qué necesita, cuándo y cuántos viajan. Un asesor le responde por WhatsApp con disponibilidad y precio
        confirmado.
      </p>
      {/* El key rearma el cotizador si llega otra URL con la página ya abierta
          (otra búsqueda desde el hero o un enlace nuevo). */}
      <CotizadorViaje key={JSON.stringify(estado)} inicial={estado} hotel={hotel} />
    </main>
  );
}
