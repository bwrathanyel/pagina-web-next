import Image from "next/image";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { Revelar } from "@/components/ui/Revelar";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { NumeralPrecio } from "@/components/home/NumeralPrecio";
import { NinosGratisRotacion } from "@/components/home/NinosGratisRotacion";
import type { BloqueNinosGratis } from "@/lib/promociones/ninosGratis";

// Cotizador ya armado para la promo: hospedaje en Margarita, dos adultos y un
// niño (parsearEstado ignora lo que no reconozca).
const COTIZAR_HREF = "/cotizar?servicios=hospedaje&destino=Isla%20de%20Margarita&adultos=2&ninos=1";

/** Banda "Niños gratis en Margarita" (comp C aprobado, 2026-09-24): dusk a
 * sangre en los dos temas, con la foto del lugar. A la izquierda el precio
 * real como firma ("desde $X", el piso por adulto y noche en doble) y la
 * píldora del regalo; a la derecha un hotel en grande, con su cuenta
 * regresiva, y hasta dos más en horizontal, rotando (NinosGratisRotacion).
 * Sin bloque, no se monta. */
export function NinosGratisBanda({ bloque }: { bloque: BloqueNinosGratis | null }) {
  if (!bloque) return null;
  const { cantidad, edades } = bloque;

  return (
    <section aria-labelledby="ninos-gratis-titulo" className="relative overflow-hidden bg-dusk pb-10 text-dusk-text lg:py-14">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-72 lg:inset-y-0 lg:right-auto lg:h-auto lg:w-[62%]">
        <Image src="/destinos/margarita.jpg" alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-dusk from-5% via-dusk/35 via-70% to-dusk/55 lg:bg-gradient-to-r lg:from-dusk/55 lg:from-0% lg:via-dusk/35 lg:via-55% lg:to-dusk" />
        {/* Fundido con el pie del hero (que termina en dusk liso): sin esto la
            foto arrancaba con un corte recto (pedido del dueño, 2026-10-26). */}
        <span className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-dusk to-transparent lg:h-40" />
      </div>

      <div className="relative mx-auto grid max-w-[var(--ancho-contenido)] gap-8 px-5 pt-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12 lg:pt-0">
        <Revelar>
          <h2
            id="ninos-gratis-titulo"
            className="max-w-[11ch] text-balance font-display text-[clamp(2.2rem,4vw,3.4rem)] font-bold leading-[0.95] tracking-[-0.01em] text-white"
          >
            1 niño gratis <span className="text-coral-bright">en Margarita</span>
          </h2>
          {bloque.desde ? (
            <>
              <p className="mt-5">
                <span className="mb-2 block text-base font-semibold text-dusk-text">desde</span>
                <NumeralPrecio texto={bloque.desde} />
              </p>
              <p className="mt-3 max-w-[30ch] text-base leading-snug text-dusk-text">por adulto, por noche, en habitación doble.</p>
            </>
          ) : null}
          <p className="mt-4 inline-flex rounded-pill bg-gold px-3.5 py-2 text-base font-bold leading-tight text-btn-ink">
            Y {cantidad} {cantidad === 1 ? "niño" : "niños"}
            {edades ? ` de ${edades} años` : ""} gratis
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Boton href={COTIZAR_HREF} variante="firma" iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
              Cotizar con niño gratis
            </Boton>
            <WhatsAppLeadButton
              mensajeBase="Hola! Vengo de su página web y quiero la promo de 1 niño gratis en Margarita."
              triggerClassName={clasesBoton({ variante: "whatsapp" })}
            >
              <WhatsAppIcon size={18} />
              WhatsApp
            </WhatsAppLeadButton>
          </div>
          <p className="mt-3 max-w-[40ch] text-xs text-dusk-text-soft">
            Precios por adulto en habitación doble, sujetos a disponibilidad.
          </p>
        </Revelar>

        <Revelar retraso={120}>
          <NinosGratisRotacion hoteles={bloque.hoteles} cantidad={cantidad} />
        </Revelar>
      </div>
    </section>
  );
}
