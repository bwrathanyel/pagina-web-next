import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CotizacionOpcionForm } from "@/components/cotizador/CotizacionOpcionForm";
import { fotosDe } from "@/lib/supabase/fotos";
import { getPromocionPorId } from "@/lib/supabase/queries";
import { formatearPrecioCliente } from "@/lib/utils/formatoPrecio";
import { nombrePromo, precioDobleHero } from "@/lib/tarifas";
import type { Tarifa } from "@/types/supabase";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const promocion = await getPromocionPorId(Number(id));
  if (!promocion) return {};
  const destino = promocion.producto?.destino;
  const nombre = nombrePromo(promocion);
  return {
    title: `Cotizar ${nombre}${destino ? ` en ${destino}` : ""}`,
    description: `Solicita disponibilidad y tarifa real para la promoción ${nombre}${destino ? ` en ${destino}` : ""}. Respuesta por WhatsApp.`,
    alternates: { canonical: `/cotizar/promocion/${promocion.id}` },
  };
}

export default async function CotizarPromocionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promocion = await getPromocionPorId(Number(id));
  if (!promocion) notFound();
  const fotosPropias = fotosDe(promocion.promocion_fotos);
  const fotos = fotosPropias.length > 0 ? fotosPropias : fotosDe(promocion.producto?.producto_fotos);
  const nombre = nombrePromo(promocion);
  // DBL en grande también en la cotización: si la fila trae grilla con `dbl` el
  // precio titular es el doble por persona/noche (así se promociona en redes).
  const hero = precioDobleHero({ precios: promocion.precios, moneda: promocion.moneda } as Tarifa);

  return (
    <main className="mx-auto max-w-6xl px-5 py-6 md:py-14">
      <CotizacionOpcionForm
        opcion={{
          clase: "promocion",
          id: promocion.id,
          nombre,
          destino: promocion.producto?.destino ?? null,
          precio: hero
            ? `${hero.monto} ${hero.nota}`
            : (formatearPrecioCliente(promocion.precio_texto) ?? "Consultar disponibilidad"),
          precioUnitarioUsd: promocion.precio_desde_usd,
          calculoPrecio:
            (promocion.precio_desde_usd != null &&
              /por persona por noche/i.test(promocion.precio_texto ?? "")) ||
            hero != null
              ? "persona_noche"
              : null,
          ninosGratis: promocion.ninos_gratis_cantidad ?? 0,
          vigenciaTexto: promocion.vigencia_texto,
          vigenciaFin: promocion.fecha_fin_estimada,
          foto: fotos[0] ?? null,
          esHotel: promocion.producto?.tipo === "hotel",
          volverHref: promocion.producto ? `/producto/${promocion.producto.id}` : "/catalogo/promociones",
        }}
      />
    </main>
  );
}
