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
    <span className="absolute left-3.5 top-3.5 z-10 inline-flex min-h-8 items-center gap-2 rounded-pill bg-dusk px-3 text-xs font-semibold text-dusk-text">
      <Icono nombre="calendario" tamano={14} />
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
          <span className={"font-mono font-bold leading-tight text-ink tabular-nums " + (grande ? "text-xl" : "text-base")}>
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
        tamanoTalon="4.25rem"
        talon={
          <div className="flex h-full items-center justify-between gap-4 px-5">
            <Precios h={h} cantidad={cantidad} grande />
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-coral-bright text-btn-ink">
              <Icono nombre="flecha-der" tamano={18} />
              <span className="sr-only">Ver {h.hotel}</span>
            </span>
          </div>
        }
      >
        <div className="relative aspect-[2/1] overflow-hidden bg-sand-2">
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
        <div className="px-5 pb-3 pt-4">
          <p className="text-balance font-display text-[clamp(1.4rem,2.2vw,1.8rem)] font-bold leading-[1.05] text-ink">{h.hotel}</p>
          <p className="mt-1 text-sm text-ink-soft">Margarita{h.plan ? ` · ${h.plan}` : ""}</p>
          {condicion(h) ? <p className="mt-1.5 text-sm text-ink">{condicion(h)}.</p> : null}
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
      <div className="relative min-h-28 w-[32%] shrink-0 overflow-hidden bg-sand-2">
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
      <div className="min-w-0 flex-1 px-3.5 py-3">
        <p className="font-display text-lg font-bold leading-[1.05]">{h.hotel}</p>
        <p className="mt-1 text-xs text-ink-soft">{[h.plan, condicion(h)].filter(Boolean).join(" · ")}</p>
        <div className="mt-2">
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
    <section aria-labelledby="ninos-gratis-titulo" className="relative overflow-hidden bg-dusk pb-10 text-dusk-text lg:py-14">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-72 lg:inset-y-0 lg:right-auto lg:h-auto lg:w-[62%]">
        <Image src="/destinos/margarita.jpg" alt="" fill sizes="(min-width: 1024px) 62vw, 100vw" className="object-cover" />
        <span className="absolute inset-0 bg-gradient-to-t from-dusk from-5% via-dusk/35 via-70% to-dusk/55 lg:bg-gradient-to-r lg:from-dusk/55 lg:from-0% lg:via-dusk/35 lg:via-55% lg:to-dusk" />
      </div>

      <div className="relative mx-auto grid max-w-[var(--ancho-contenido)] gap-8 px-5 pt-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-12 lg:pt-0">
        <Revelar>
          <h2
            id="ninos-gratis-titulo"
            className="max-w-[11ch] text-balance font-display text-[clamp(2.2rem,4vw,3.4rem)] font-bold leading-[0.95] tracking-[-0.01em] text-white"
          >
            Niños gratis <span className="text-coral-bright">en Margarita</span>
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
              mensajeBase="Hola! Vengo de su página web y quiero la promo de niños gratis en Margarita."
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

        <Revelar retraso={120} className="grid gap-3">
          <Destacado h={destacado} cantidad={cantidad} />
          {secundarios.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
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
