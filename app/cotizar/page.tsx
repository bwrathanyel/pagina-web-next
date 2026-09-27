import type { Metadata } from "next";
import { CotizadorViaje } from "@/components/cotizador/CotizadorViaje";
import { DESTINOS, parsearEstado } from "@/lib/cotizador/estado";
import { ofertasHoteles } from "@/lib/cotizador/ofertas";
import { getHotSales, getHotelCotizador, getPromociones, rutasVuelo } from "@/lib/supabase/queries";

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
  // Las ofertas de todos los destinos van juntas (una por hotel, ~100 filas
  // chicas): el destino se cambia en el cliente sin recargar. Si la consulta
  // falla, /cotizar sigue funcionando sin grilla y el asesor propone.
  // Sin rutas (consulta caída) el vuelo vuelve a ser solo solicitud: "a confirmar".
  const [hotel, ofertas, rutas] = await Promise.all([
    estado.hotel ? getHotelCotizador(estado.hotel).catch(() => null) : null,
    // Las Hot Sales van delante: traen el regalo de niño gratis que
    // web_promociones no tiene (lo lee tarifa_nino_gratis() del PDF).
    Promise.all([getHotSales().catch(() => []), getPromociones()])
      .then(([hot, promos]) => {
        const ids = new Set(hot.map((h) => h.id));
        return ofertasHoteles([...hot, ...promos.filter((p) => !ids.has(p.id))]);
      })
      .catch(() => []),
    rutasVuelo().catch(() => []),
  ]);
  // Un hotel que no existe (o ya no está activo) se descarta; si el enlace no
  // traía destino, el del hotel manda.
  if (estado.hotel && !hotel) estado = { ...estado, hotel: null, tarifa: null };
  else if (hotel?.destino && !sp.destino && DESTINOS.includes(hotel.destino)) estado = { ...estado, destino: hotel.destino };

  return (
    <main className="mx-auto max-w-6xl px-4 py-5 pb-32 sm:px-5 md:py-10 lg:pb-10">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-5 gap-y-2 lg:mb-6">
        <h1 className="font-display text-3xl font-bold leading-none text-ink sm:text-4xl">Arme su viaje</h1>
        <p className="max-w-2xl text-ink-soft max-lg:hidden">
          Elija qué necesita, cuándo y cuántos viajan. Un asesor le responde por WhatsApp.
        </p>
      </div>
      {/* El key rearma el cotizador si llega otra URL con la página ya abierta
          (otra búsqueda desde el hero o un enlace nuevo). */}
      <CotizadorViaje key={JSON.stringify(estado)} inicial={estado} hotel={hotel} ofertas={ofertas} rutas={rutas} />
    </main>
  );
}
