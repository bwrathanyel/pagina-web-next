import Image from "next/image";
import Link from "next/link";
import { Boleto } from "@/components/ui/Boleto";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { Revelar } from "@/components/ui/Revelar";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { WhatsAppLeadButton } from "@/components/leads/WhatsAppLeadButton";
import { SelloNinoGratis } from "@/components/catalogo/SelloNinoGratis";
import { NumeralPrecio } from "@/components/home/NumeralPrecio";
import { diaMes, type BloqueNinosGratis, type HotelNinoGratis } from "@/lib/promociones/ninosGratis";

// Cotizador ya armado para la promo: hospedaje en Margarita, dos adultos y un
// niño (inicialDesdeParams ignora lo que no reconozca).
const COTIZAR_HREF = "/cotizador-personalizado?servicio=hospedaje&destino=Isla%20de%20Margarita&adultos=2&ninos=1";

function Cuenta({ h }: { h: HotelNinoGratis }) {
  if (h.dias === null || !h.hasta) return null;
  return (
    <span className="absolute left-3.5 top-3.5 z-10 inline-flex min-h-9 items-center gap-2 rounded-pill bg-dusk px-3.5 text-sm font-semibold text-dusk-text">
      <Icono nombre="calendario" tamano={16} />
      {h.dias === 0 ? (
        <b className="font-mono text-gold">Último día</b>
      ) : (
        <span>
          Queda{h.dias === 1 ? "" : "n"} <b className="font-mono text-gold">{h.dias} {h.dias === 1 ? "día" : "días"}</b>
        </span>
      )}
      <span className="text-dusk-text-soft">· hasta el {diaMes(h.hasta)}</span>
    </span>
  );
}

function Precios({ h, cantidad, grande }: { h: HotelNinoGratis; cantidad: number; grande?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {h.precio ? (
        <div>
          <span className="block text-xs text-ink-soft">Adulto, por noche</span>
          <span className={"font-mono font-bold leading-tight text-ink tabular-nums " + (grande ? "text-2xl" : "text-lg")}>
            <PrecioMostrado texto={h.precio} />
          </span>
        </div>
      ) : null}
      <SelloNinoGratis cantidad={cantidad} />
    </div>
  );
}

const condicion = (h: HotelNinoGratis) => (h.hasta ? `Viajando hasta el ${diaMes(h.hasta)}` : null);

function Destacado({ h, cantidad }: { h: HotelNinoGratis; cantidad: number }) {
  return (
    <Link href={h.href} className="group block rounded-card transition-transform duration-150 ease-salida active:scale-[0.985]">
      <Boleto
        orientacion="h"
        tamanoTalon="5.5rem"
        talon={
          <div className="flex h-full items-center justify-between gap-4 px-6">
            <Precios h={h} cantidad={cantidad} grande />
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-coral-bright text-btn-ink">
              <Icono nombre="flecha-der" tamano={20} />
              <span className="sr-only">Ver {h.hotel}</span>
            </span>
          </div>
        }
      >
        <div className="relative aspect-16/10 overflow-hidden bg-sand-2">
          {h.foto ? (
            <Image
              src={h.foto}
              alt=""
              fill
              sizes="(min-width: 1280px) 42rem, (min-width: 1024px) 55vw, 100vw"
              className="object-cover transition-[scale] duration-700 ease-salida group-hover:scale-[1.04]"
            />
          ) : null}
          <Cuenta h={h} />
        </div>
        <div className="px-6 pb-4 pt-5">
          <p className="text-balance font-display text-[clamp(1.8rem,3vw,2.4rem)] font-bold leading-[1.05] text-ink">{h.hotel}</p>
          <p className="mt-1 text-ink-soft">Margarita{h.plan ? ` · ${h.plan}` : ""}</p>
          {condicion(h) ? <p className="mt-2.5 text-ink">{condicion(h)}.</p> : null}
        </div>
      </Boleto>
    </Link>
  );
}

function Secundario({ h, cantidad }: { h: HotelNinoGratis; cantidad: number }) {
  return (
    <Link
      href={h.href}
      className="group flex overflow-hidden rounded-card border border-linea bg-card text-ink transition-transform duration-150 ease-salida active:scale-[0.985]"
    >
      <div className="relative min-h-36 w-[36%] shrink-0 overflow-hidden bg-sand-2">
        {h.foto ? (
          <Image
            src={h.foto}
            alt=""
            fill
            sizes="(min-width: 1024px) 12rem, (min-width: 640px) 18vw, 36vw"
            className="object-cover transition-[scale] duration-700 ease-salida group-hover:scale-[1.04]"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 px-4 py-4">
        <p className="font-display text-xl font-bold leading-[1.05]">{h.hotel}</p>
        <p className="mt-1 text-sm text-ink-soft">{[h.plan, condicion(h)].filter(Boolean).join(" · ")}</p>
        <div className="mt-3">
          <Precios h={h} cantidad={cantidad} />
        </div>
      </div>
    </Link>
  );
}

/** Banda "Niños gratis en Margarita" (comp C aprobado, 2026-09-24): dusk a
 * sangre en los dos temas, con la foto del lugar. A la izquierda el precio
 * real como firma ("desde $X", el piso por adulto y noche en doble) y la
 * píldora del regalo; a la derecha el hotel que vence primero en grande, con
 * su cuenta regresiva, y hasta dos más en horizontal. Sin bloque, no se monta. */
export function NinosGratisBanda({ bloque }: { bloque: BloqueNinosGratis | null }) {
  if (!bloque) return null;
  const [destacado, ...resto] = bloque.hoteles;
  const secundarios = resto.slice(0, 2);
  const { cantidad, edades } = bloque;

  return (
    <section aria-labelledby="ninos-gratis-titulo" className="relative overflow-hidden bg-dusk pb-14 text-dusk-text lg:py-24">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-84 lg:inset-y-0 lg:right-auto lg:h-auto lg:w-[62%]">
        <Image src="/destinos/margarita.jpg" alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-dusk from-5% via-dusk/35 via-70% to-dusk/55 lg:bg-gradient-to-r lg:from-dusk/55 lg:from-0% lg:via-dusk/35 lg:via-55% lg:to-dusk" />
      </div>

      <div className="relative mx-auto grid max-w-[var(--ancho-contenido)] gap-10 px-5 pt-48 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-16 lg:pt-0">
        <Revelar>
          <h2
            id="ninos-gratis-titulo"
            className="max-w-[11ch] text-balance font-display text-[clamp(2.6rem,5.4vw,4.4rem)] font-bold leading-[0.95] tracking-[-0.01em] text-white"
          >
            Niños gratis <span className="text-coral-bright">en Margarita</span>
          </h2>
          {bloque.desde ? (
            <>
              <p className="mt-8">
                <span className="mb-3 block text-lg font-semibold text-dusk-text">desde</span>
                <NumeralPrecio texto={bloque.desde} />
              </p>
              <p className="mt-4 max-w-[26ch] text-lg leading-snug text-dusk-text">por adulto, por noche, en habitación doble.</p>
            </>
          ) : null}
          <p className="mt-5 inline-flex rounded-pill bg-gold px-4 py-2.5 text-lg font-bold leading-tight text-btn-ink">
            Y {cantidad} {cantidad === 1 ? "niño" : "niños"}
            {edades ? ` de ${edades} años` : ""} gratis
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Boton href={COTIZAR_HREF} variante="firma" iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
              Cotizar con niño gratis
            </Boton>
            <WhatsAppLeadButton
              mensajeBase="Hola! Vengo de su página web y quiero la promo de niños gratis en Margarita."
              triggerClassName={clasesBoton({ variante: "whatsapp" })}
            >
              <WhatsAppIcon size={18} />
              WhatsApp
            </WhatsAppLeadButton>
          </div>
          <p className="mt-4 max-w-[40ch] text-sm text-dusk-text-soft">
            Precios por adulto en habitación doble, sujetos a disponibilidad.
          </p>
        </Revelar>

        <Revelar retraso={120} className="grid gap-4">
          <Destacado h={destacado} cantidad={cantidad} />
          {secundarios.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {secundarios.map((h) => (
                <Secundario key={h.id} h={h} cantidad={cantidad} />
              ))}
            </div>
          ) : null}
        </Revelar>
      </div>
    </section>
  );
}
