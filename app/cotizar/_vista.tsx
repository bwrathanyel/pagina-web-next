import { Suspense } from "react";
import { CotizadorViaje } from "@/components/cotizador/CotizadorViaje";
import { FondoDestino } from "@/components/cotizador/FondoDestino";
import { slugsDeHoteles } from "@/lib/checkout/datos";
import { DESTINOS, parsearEstado } from "@/lib/cotizador/estado";
import { ofertasHoteles } from "@/lib/cotizador/ofertas";
import { getHotelCotizador, hotSalesCotizar, promocionesCotizar, rutasAereasGuia, rutasVueloCotizar } from "@/lib/supabase/queries";
import type { MapaSlugs } from "@/lib/checkout/slugHotel";

export type Consulta = Record<string, string | string[] | undefined>;

/** /cotizar y /cotizar/<slug>: misma pantalla; la ruta con slug fija el hotel (manda sobre `?hotel=`). */
export async function VistaCotizar({ sp, hotelId = null, slugs: slugsDados = null }: { sp: Consulta; hotelId?: number | null; slugs?: MapaSlugs | null }) {
  let estado = parsearEstado(hotelId ? { ...sp, hotel: String(hotelId) } : sp);
  // Las ofertas de todos los destinos van juntas (una por hotel, ~100 filas
  // chicas): el destino se cambia en el cliente sin recargar. Si la consulta
  // falla, /cotizar sigue funcionando sin grilla y el asesor propone.
  // Sin rutas (consulta caída) el vuelo vuelve a ser solo solicitud: "a confirmar".
  const [hotel, ofertas, rutas, guia, mapa] = await Promise.all([
    estado.hotel ? getHotelCotizador(estado.hotel).catch(() => null) : null,
    // Las Hot Sales van delante: traen el regalo de niño gratis que
    // web_promociones no tiene (lo lee tarifa_nino_gratis() del PDF).
    Promise.all([hotSalesCotizar().catch(() => []), promocionesCotizar()])
      .then(([hot, promos]) => {
        const ids = new Set(hot.map((h) => h.id));
        return ofertasHoteles([...hot, ...promos.filter((p) => !ids.has(p.id))]);
      })
      .catch(() => []),
    rutasVueloCotizar().catch(() => []),
    rutasAereasGuia().catch(() => []),
    slugsDados ?? slugsDeHoteles().catch(() => null),
  ]);
  // Un hotel que no existe (o ya no está activo) se descarta; si el enlace no
  // traía destino, el del hotel manda.
  if (estado.hotel && !hotel) estado = { ...estado, hotel: null, tarifa: null };
  else if (hotel?.destino && !sp.destino && DESTINOS.includes(hotel.destino)) estado = { ...estado, destino: hotel.destino };
  // Una foto por destino para el fondo: la de la primera oferta (ya vienen por prioridad).
  const fotosDestino: Record<string, string> = {};
  for (const o of ofertas) if (o.foto && !fotosDestino[o.destino]) fotosDestino[o.destino] = o.foto;
  // Slugs solo de los hoteles que se pueden elegir aquí: la barra pasa a /cotizar/<slug>.
  const slugs: Record<number, string> = {};
  for (const id of [...ofertas.map((o) => o.hotelId), ...(hotel ? [hotel.id] : [])]) {
    const s = mapa?.porId.get(id);
    if (s) slugs[id] = s;
  }

  return (
    <main className="relative isolate mx-auto max-w-6xl px-4 py-5 pb-32 sm:px-5 md:py-6 lg:pb-10">
      <Suspense fallback={null}>
        <FondoDestino fotos={fotosDestino} inicial={estado.destino} />
      </Suspense>
      {/* Sin encabezado visible (pedido del dueño 2026-11-18: ocupaba pantalla);
          el h1 queda para lectores de pantalla y buscadores. */}
      <h1 className="sr-only">Arme su viaje</h1>
      {/* El key rearma el cotizador si llega otra URL con la página ya abierta
          (otra búsqueda desde el hero o un enlace nuevo). */}
      <CotizadorViaje key={JSON.stringify(estado)} inicial={estado} hotel={hotel} ofertas={ofertas} rutas={rutas} guia={guia} slugs={slugs} />
    </main>
  );
}
