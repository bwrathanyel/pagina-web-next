"use client";

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import Form from "next/form";
import Image from "next/image";
import { Boton, clasesBoton } from "@/components/ui/Boton";
import { CLASE_CONTROL, Campo, Selector } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { SelloDestino } from "@/components/ui/SelloDestino";
import { selloDestino } from "@/lib/arte";
import { SelectorFecha, seguirCon } from "@/components/ui/SelectorFecha";
import { SelectorViajeros, type Viajeros } from "@/components/ui/SelectorViajeros";
import {
  ADULTOS_MAX,
  BEBES_MAX,
  COTIZACION_RAPIDA_INICIAL as INICIAL,
  contarNoches,
  DESTINOS_RAPIDOS,
  fechasDelServicio,
  hoyCaracas,
  NINOS_MAX,
  sumarDias,
  textoDuracion,
} from "@/lib/cotizador/cotizacionRapida";
import type { Servicio } from "@/lib/cotizador/estado";
import { normalizarBusqueda } from "@/lib/catalogo/busqueda";
import type { FotoHero } from "@/lib/promociones/fotosHero";
import type { HotelNinoGratis } from "@/lib/promociones/ninosGratis";

// Cotizador rápido del hero. Es un formulario GET de verdad (next/form): sin
// JavaScript igual llega a /cotizar con los datos en la URL,
// y con JavaScript navega en el cliente. La página traduce la URL al estado
// del cotizador (lib/cotizador/estado.ts).
const DESTINO = "/cotizar";

const MAXIMOS: Viajeros = { adultos: ADULTOS_MAX, ninos: NINOS_MAX, bebes: BEBES_MAX };
/** Servicio combinable -> slug del cotizador rápido (de ahí salen las fechas). */
const SLUG_DE_SERVICIO: Record<Servicio, string> = { hospedaje: "hospedaje", vuelo: "vuelos", tours: "fullday" };
/** Sellos de servicio de la hoja. «Paquete» es atajo: marca hospedaje y vuelo. */
const SELLOS_SERVICIO: readonly { id: Servicio | "paquete"; etiqueta: string; icono: NombreIcono }[] = [
  { id: "hospedaje", etiqueta: "Hospedaje", icono: "hotel" },
  { id: "tours", etiqueta: "Full Day", icono: "sol" },
  { id: "vuelo", etiqueta: "Vuelos", icono: "avion" },
  { id: "paquete", etiqueta: "Paquete", icono: "maletin" },
];
const ORDEN_SERVICIOS: Servicio[] = ["hospedaje", "vuelo", "tours"];
const ordenar = (l: Servicio[]) => ORDEN_SERVICIOS.filter((s) => l.includes(s));
const esPaquete = (l: Servicio[]) => l.includes("hospedaje") && l.includes("vuelo");

/** Marca o desmarca un sello de servicio; siempre queda al menos uno. */
function alternar(lista: Servicio[], id: Servicio | "paquete"): Servicio[] {
  if (id === "paquete") {
    return esPaquete(lista) ? (lista.length > 2 ? ordenar(lista.filter((s) => s !== "vuelo")) : ["hospedaje"]) : ordenar([...lista, "hospedaje", "vuelo"]);
  }
  if (lista.includes(id)) return lista.length === 1 ? lista : lista.filter((s) => s !== id);
  return ordenar([...lista, id]);
}

const CLASE_SELLO =
  "relative flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-card border px-1.5 py-2.5 text-center text-xs font-semibold leading-tight text-balance " +
  "transition-[background-color,border-color,color] duration-150 ease-salida motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";
/** Variante pestaña: los sellos de servicio sobre la barra de escritorio. */
const CLASE_PESTANA =
  "relative flex h-10 items-center gap-2 rounded-t-card border border-b-0 px-4 text-sm font-semibold " +
  "transition-[background-color,border-color,color] duration-150 ease-salida motion-reduce:transition-none " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento";

/** Opción con forma de sello de pasaporte (como SelloDestino en /reservar):
 * marcada, el sello se estampa en tinta de acento y lleva un check. */
function Sello({
  activo,
  onClick,
  etiqueta,
  destino,
  icono,
  compacto = false,
  orden,
}: {
  activo: boolean;
  onClick: () => void;
  etiqueta: string;
  destino?: string;
  icono?: NombreIcono;
  compacto?: boolean;
  /** Posición en el panel de destinos: las opciones caen escalonadas al abrir. */
  orden?: number;
}) {
  // La key cambia al marcar: así la animación `estampa` vuelve a correr.
  const tinta = activo ? "estampa -rotate-8 text-acento" : "-rotate-8 opacity-60";
  // Tinta y giro propios al pasar el puntero (`.sello-destino` en globals.css).
  const slugSello = destino && !compacto ? selloDestino(destino) : undefined;
  return (
    <button
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      data-destino={slugSello}
      style={orden === undefined ? undefined : ({ "--n": orden } as CSSProperties)}
      className={`${compacto ? `pestana ${CLASE_PESTANA}` : CLASE_SELLO} ${orden === undefined ? "" : "op-cae"} ${slugSello ? "sello-destino" : ""} ${
        activo ? "border-acento bg-acento-suave text-ink" : "border-linea-fuerte bg-card text-ink-soft hover:border-ink/40 hover:text-ink"
      }`}
    >
      {activo && !compacto ? (
        <span aria-hidden="true" className="absolute right-1 top-1 grid size-5 place-items-center rounded-full bg-acento text-sobre-acento">
          <Icono nombre="check" tamano={12} />
        </span>
      ) : null}
      {destino ? (
        <SelloDestino key={String(activo)} destino={destino} tamano={36} className={`sello-destino-arte ${tinta}`} />
      ) : icono ? (
        <span key={String(activo)} aria-hidden="true" className={`inline-flex ${compacto ? "pestana-icono" : ""} ${tinta}`}>
          <Icono nombre={icono} tamano={compacto ? 18 : 28} />
        </span>
      ) : null}
      <span>{etiqueta}</span>
      {activo && compacto ? <Icono nombre="check" tamano={14} className="text-acento" /> : null}
      {/* Pestaña marcada: el canto con el degradado del logo crece desde el centro. */}
      {activo && compacto ? (
        <span aria-hidden="true" className="pestana-marca franja-marca absolute inset-x-3 bottom-0 h-0.5 rounded-pill" />
      ) : null}
    </button>
  );
}

function Rotulo({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mb-1.5 text-sm font-semibold text-ink">
      {children}
    </p>
  );
}

/** Hotel con niño gratis que la home destaca (el que vence primero). */
type PropsCotizador = { ninoGratis?: HotelNinoGratis | null };

/** Estado que comparten la barra y la hoja: se marcan varios servicios y las
 * fechas se llaman como el primero (el full day es de un solo día). */
function useCotizacionRapida(ninoGratis: HotelNinoGratis | null) {
  const [servicios, setServicios] = useState<Servicio[]>(["hospedaje"]);
  const [destino, setDestinoPropio] = useState<string>(INICIAL.destino);
  const [combinar, setCombinar] = useState("");
  const [entrada, setEntrada] = useState("");
  const [salida, setSalida] = useState("");
  const [viajeros, setViajeros] = useState<Viajeros>({ adultos: INICIAL.adultos, ninos: 0, bebes: 0 });
  const [etiquetaInicio, etiquetaFin] = fechasDelServicio(SLUG_DE_SERVICIO[servicios[0]]);
  const conHotel = servicios.includes("hospedaje");

  function setDestino(v: string) {
    setDestinoPropio(v);
    if (v === combinar) setCombinar("");
  }

  // Si la entrada nueva alcanza a la salida, la salida se corre y conserva
  // las noches que ya tenía (una, si no había).
  function cambiarEntrada(v: string) {
    if (v && salida && salida <= v) setSalida(sumarDias(v, Math.max(1, contarNoches(entrada, salida))));
    setEntrada(v);
  }

  const noches = etiquetaFin ? contarNoches(entrada, salida) : 0;
  // Margarita con niños: hay hoteles con el primer niño gratis (ver OfertasHospedaje).
  const promoNinos = /margarita/i.test(destino) && viajeros.ninos > 0;
  return {
    servicios,
    setServicios,
    destino,
    setDestino,
    combinar,
    setCombinar,
    promoNinos,
    // Si el servicio lleva hotel, /cotizar abre con el de niño gratis ya
    // elegido (pedido del dueño, 2026-10-16); el cliente puede cambiarlo allá.
    hotelNinos: promoNinos && conHotel ? ninoGratis : null,
    entrada,
    cambiarEntrada,
    salida,
    setSalida,
    minSalida: sumarDias(entrada || hoyCaracas(), 1),
    viajeros,
    setViajeros,
    etiquetaInicio,
    etiquetaFin,
    duracion: noches > 0 ? textoDuracion(noches) : "",
  };
}

/** Margarita + niños: se avisa antes de cotizar. En /cotizar se muestran esos
 * hoteles primero, con lo que paga el siguiente niño. */
function AvisoNinosGratis({ ninos, hotel }: { ninos: number; hotel: HotelNinoGratis | null }) {
  const siguiente = ninos > 1 ? " y cuánto paga el segundo niño" : "";
  return (
    <p role="status" className="sobre-claro flex items-start gap-2.5 rounded-card border border-seafoam bg-seafoam-bg px-4 py-2.5 text-sm text-ink">
      <span aria-hidden="true">🎁</span>
      <span>
        <strong className="font-semibold">En Margarita el primer niño va totalmente gratis</strong> en hoteles seleccionados.
        {hotel
          ? ` Al cotizar le dejamos elegido el ${hotel.hotel}${siguiente}; puede cambiarlo por otro.`
          : ninos > 1
            ? " Al cotizar le mostramos esos hoteles y cuánto paga el segundo niño."
            : " Al cotizar le mostramos esos hoteles primero."}
      </span>
    </p>
  );
}

/** Viaja en la URL como un enlace "Cotizar" de la promo (enlaceCotizarPromocion). */
function CamposHotelNinos({ hotel }: { hotel: HotelNinoGratis | null }) {
  if (!hotel) return null;
  return (
    <>
      <input type="hidden" name="hotel" value={hotel.hotelId} />
      <input type="hidden" name="tarifa" value={hotel.id} />
    </>
  );
}

function OpcionesNumero({ desde, hasta }: { desde: number; hasta: number }) {
  return Array.from({ length: hasta - desde + 1 }, (_, k) => desde + k).map((n) => (
    <option key={n} value={n}>
      {n}
    </option>
  ));
}

// Un tramo de la barra: etiqueta chica arriba, valor grande abajo, el control
// nativo sin caja propia (la caja es la barra). El foco se ve en el control.
// Arriba y no centrado: bajo las fechas va la línea de días y noches, y así
// las etiquetas y los valores de todos los tramos quedan a la misma altura.
function Tramo({
  etiqueta,
  id,
  className = "",
  foto = null,
  children,
}: {
  etiqueta: string;
  id?: string;
  className?: string;
  /** Banner: la foto del destino detrás, oscurecida con dusk (texto claro en los dos temas). */
  foto?: string | null;
  children: (id: string) => ReactNode;
}) {
  const propio = useId();
  const idControl = id ?? propio;
  return (
    <div
      className={`tramo relative isolate flex min-w-0 flex-col gap-0.5 rounded-control px-4 pb-1.5 pt-3 transition-colors duration-150 ease-salida xl:px-5 ${
        foto ? "" : "hover:bg-sand-2/60"
      } ${className}`}
    >
      {foto ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-control bg-dusk">
          {/* La key cambia con el destino: la foto nueva entra asentándose. */}
          <Image key={foto} src={foto} alt="" fill sizes="22rem" className="hero-banner-destino object-cover" />
          <span className="absolute inset-0 bg-gradient-to-r from-dusk/90 via-dusk/70 to-dusk/35" />
        </span>
      ) : null}
      <label htmlFor={idControl} className={`text-sm ${foto ? "text-dusk-text-soft" : "text-ink-soft"}`}>
        {etiqueta}
      </label>
      {children(idControl)}
      {/* Tramo activo (foco adentro o su panel abierto): línea con el degradado del logo. */}
      <span aria-hidden="true" className="tramo-linea franja-marca absolute inset-x-4 bottom-0 h-0.5 rounded-pill xl:inset-x-5" />
    </div>
  );
}

const CONTROL_TRAMO_BASE =
  "w-full min-w-0 cursor-pointer rounded-control bg-transparent py-1 text-base font-semibold outline-offset-4 xl:text-lg";
const CONTROL_TRAMO = `${CONTROL_TRAMO_BASE} text-ink`;

/** Foto del destino para el banner del tramo: primero las fotos propias del
 * lugar (las que traen `fondos`), si no la del alojamiento. «Isla de Margarita»
 * casa con «Margarita»; sin foto (Extranjero) el tramo queda liso. */
function fotoDelDestino(fotos: readonly FotoHero[], destino: string): string | null {
  const d = normalizarBusqueda(destino);
  const casa = (f: FotoHero) => {
    const x = normalizarBusqueda(f.destino?.trim() ?? "");
    return x !== "" && (d.includes(x) || x.includes(d));
  };
  return (fotos.find((f) => f.fondos && casa(f)) ?? fotos.find(casa))?.url ?? null;
}
const etiquetaDestino = (valor: string) => DESTINOS_RAPIDOS.find((d) => d.valor === valor)?.label ?? valor;

/** Escritorio: el destino abre un popover ancho con los 8 sellos (opción
 * única) y «Combinar con otro destino». Esc y clic afuera lo cierra el
 * navegador (popover="auto"); elegir destino también lo cierra. */
function DestinoBarra({
  id,
  destino,
  setDestino,
  combinar,
  setCombinar,
  sobreFoto = false,
}: {
  id: string;
  destino: string;
  setDestino: (v: string) => void;
  combinar: string;
  setCombinar: (v: string) => void;
  sobreFoto?: boolean;
}) {
  const idPanel = useId();
  const panel = useRef<HTMLDivElement>(null);
  const [conOtro, setConOtro] = useState(false);
  const ancla = `--destino-${idPanel.replace(/[^a-zA-Z0-9]/g, "")}`;
  const texto = combinar ? `${etiquetaDestino(destino)} + ${etiquetaDestino(combinar)}` : etiquetaDestino(destino);
  const cerrar = () => panel.current?.hidePopover();

  return (
    <>
      <button
        id={id}
        type="button"
        popoverTarget={idPanel}
        aria-label={`Destino: ${texto}`}
        style={{ anchorName: ancla } as CSSProperties}
        className={`flex items-center gap-2 text-left ${CONTROL_TRAMO_BASE} ${sobreFoto ? "banner-control text-dusk-text" : "text-ink"}`}
      >
        {/* Keys con prefijo: valor y etiqueta del destino suelen coincidir
            («Canaima»), y dos hermanos con la misma key dejaban sellos viejos
            sin desmontar (se acumulaban en el botón). */}
        <SelloDestino key={`sello-${destino}`} destino={destino} tamano={24} className={`estampa -rotate-8 shrink-0 ${sobreFoto ? "text-gold" : "text-acento"}`} />
        <span key={`texto-${texto}`} className="valor-cambia min-w-0 truncate">
          {texto}
        </span>
        <Icono nombre="chevron-abajo" tamano={18} className={`ml-auto shrink-0 ${sobreFoto ? "text-dusk-text-soft" : "text-ink-soft"}`} />
      </button>
      <input type="hidden" name="destino" value={destino} />
      {combinar ? <input type="hidden" name="combinar" value={combinar} /> : null}

      <div
        ref={panel}
        id={idPanel}
        popover="auto"
        role="dialog"
        aria-label="Elegir destino"
        onToggle={(e) => {
          if (e.newState === "open") panel.current?.querySelector<HTMLButtonElement>('button[aria-pressed="true"]')?.focus();
        }}
        style={{ positionAnchor: ancla } as CSSProperties}
        className="calendario-flotante w-[min(36rem,calc(100vw-2rem))] rounded-card bg-card p-4 text-ink shadow-chrome"
      >
        <div className="grid grid-cols-4 gap-2">
          {DESTINOS_RAPIDOS.map((d, i) => (
            <Sello
              key={d.valor}
              orden={(i % 4) + Math.floor(i / 4)}
              activo={destino === d.valor}
              onClick={() => {
                setDestino(d.valor);
                cerrar();
              }}
              etiqueta={d.label}
              destino={d.valor}
            />
          ))}
        </div>
        {conOtro ? (
          <div className="mt-3 border-t border-linea pt-3">
            <p className="mb-1.5 text-sm font-semibold text-ink">¿Con qué otro destino?</p>
            <div className="grid grid-cols-4 gap-2">
              {DESTINOS_RAPIDOS.filter((d) => d.valor !== destino).map((d, i) => (
                <Sello
                  key={d.valor}
                  orden={(i % 4) + Math.floor(i / 4)}
                  activo={combinar === d.valor}
                  onClick={() => {
                    setCombinar(combinar === d.valor ? "" : d.valor);
                    cerrar();
                  }}
                  etiqueta={d.label}
                  destino={d.valor}
                />
              ))}
            </div>
          </div>
        ) : null}
        <button
          type="button"
          aria-expanded={conOtro}
          onClick={() => {
            if (conOtro) setCombinar("");
            setConOtro(!conOtro);
          }}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-control text-sm font-semibold text-acento outline-offset-2 hover:underline md:min-h-0 md:py-1.5"
        >
          <Icono nombre={conOtro ? "menos" : "suma"} tamano={18} />
          {conOtro ? "Solo un destino" : "Combinar con otro destino"}
        </button>
      </div>
    </>
  );
}

/** Escritorio: barra ancha estilo buscador de viajes, con "Cotizar" como CTA. */
export function CotizadorRapidoBarra({
  ninoGratis = null,
  brillo = false,
  fotos = [],
}: PropsCotizador & { brillo?: boolean; fotos?: readonly FotoHero[] }) {
  const c = useCotizacionRapida(ninoGratis);
  const fotoDestino = fotoDelDestino(fotos, c.destino);
  const n = c.servicios.length;
  const idSalida = useId();
  const fin = c.etiquetaFin;
  const rango = fin ? { desde: c.entrada, hasta: c.salida } : undefined;

  function elegirEntrada(v: string) {
    c.cambiarEntrada(v);
    // Como en los buscadores de viaje: elegida la entrada, se abre la salida.
    if (v && fin && !c.salida) seguirCon(idSalida);
  }

  return (
    <div className="flex flex-col gap-2">
    <div>
    {/* Pestañas del pase de abordar: servicios, varios a la vez («Paquete» =
        hospedaje + vuelo). Viajan en el hidden `servicios` del formulario. */}
    <div role="group" aria-label="Servicios, puede marcar varios" className="sobre-claro flex gap-1.5 px-3">
      {SELLOS_SERVICIO.map((s) => (
        <Sello
          key={s.id}
          compacto
          activo={s.id === "paquete" ? esPaquete(c.servicios) : c.servicios.includes(s.id)}
          onClick={() => c.setServicios(alternar(c.servicios, s.id))}
          etiqueta={s.etiqueta}
          icono={s.icono}
        />
      ))}
    </div>
    <Form
      action={DESTINO}
      aria-label="Cotizar un viaje"
      className="sobre-claro flex items-stretch rounded-card border border-linea bg-card p-2"
    >
      <input type="hidden" name="servicios" value={c.servicios.join(",")} />
      <div className="grid min-w-0 flex-1 grid-cols-[2.35fr_2fr_1.65fr] divide-x divide-linea">
        <Tramo etiqueta="Destino" foto={fotoDestino}>
          {(id) => (
            <DestinoBarra
              id={id}
              destino={c.destino}
              setDestino={c.setDestino}
              combinar={c.combinar}
              setCombinar={c.setCombinar}
              sobreFoto={Boolean(fotoDestino)}
            />
          )}
        </Tramo>

        <div className="flex min-w-0 flex-col">
          <div className="grid flex-1 grid-cols-2">
            <Tramo etiqueta={c.etiquetaInicio} className={fin ? "" : "col-span-2"}>
              {(id) => (
                <SelectorFecha
                  id={id}
                  name="fecha"
                  etiqueta={c.etiquetaInicio}
                  valor={c.entrada}
                  onCambio={elegirEntrada}
                  rango={rango}
                  vacio={fin ? "Flexible" : undefined}
                  className={CONTROL_TRAMO}
                />
              )}
            </Tramo>
            {fin ? (
              <Tramo etiqueta={fin} id={idSalida} className="border-l border-linea">
                {(id) => (
                  <SelectorFecha
                    id={id}
                    name="hasta"
                    etiqueta={fin}
                    valor={c.salida}
                    onCambio={c.setSalida}
                    min={c.minSalida}
                    rango={rango}
                    vacio="Flexible"
                    className={CONTROL_TRAMO}
                  />
                )}
              </Tramo>
            ) : null}
          </div>
          <p aria-live="polite" className="min-h-5 px-4 pb-2 text-center font-mono text-xs tabular-nums text-ink-soft">
            {c.duracion}
          </p>
        </div>

        <Tramo etiqueta="Viajeros">
          {(id) => (
            <SelectorViajeros
              id={id}
              valor={c.viajeros}
              onCambio={c.setViajeros}
              maximos={MAXIMOS}
              className={CONTROL_TRAMO}
            />
          )}
        </Tramo>
      </div>
      <CamposHotelNinos hotel={c.hotelNinos} />
      <Boton
        type="submit"
        variante="firma"
        tamano="lg"
        className={"ml-2 shrink-0 self-stretch" + (brillo ? " relative overflow-hidden" : "")}
      >
        {/* El destello del botón del asistente (fab-shine, cada ~6 s) mientras
            nadie tocó el cotizador; al primer toque se va con el resto del
            movimiento del hero. */}
        {brillo ? (
          <span
            aria-hidden="true"
            className="animate-fab-shine pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 bg-gradient-to-r from-transparent via-white/60 to-transparent motion-reduce:animate-none"
          />
        ) : null}
        <span className="relative">{n === 1 ? "Cotizar" : `Cotizar ${n} servicios`}</span>
      </Boton>
    </Form>
    </div>
    {c.promoNinos ? <AvisoNinosGratis ninos={c.viajeros.ninos} hotel={c.hotelNinos} /> : null}
    </div>
  );
}

/** Teléfono: un botón con forma de campo que abre la hoja con los datos. */
export function CotizadorRapidoMovil({ ninoGratis = null }: PropsCotizador) {
  const [abierta, setAbierta] = useState(false);
  const [conOtro, setConOtro] = useState(false);
  const idForm = useId();
  const idRotulo = useId();
  const c = useCotizacionRapida(ninoGratis);
  const n = c.servicios.length;
  const cambiarViajeros = (clave: keyof Viajeros) => (e: { target: { value: string } }) =>
    c.setViajeros({ ...c.viajeros, [clave]: Number(e.target.value) });

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-haspopup="dialog"
        className="sobre-claro flex min-h-14 w-full items-center gap-3 rounded-control border border-linea bg-card pl-4 pr-2 text-left text-base text-ink-soft transition-colors duration-150 ease-salida hover:text-ink"
      >
        <Icono nombre="buscar" tamano={20} className="shrink-0 text-acento" />
        <span className="min-w-0 flex-1 truncate">¿A dónde quiere viajar?</span>
        {/* La flecha naranja reemplaza al botón "Cotizar mi viaje" que iba
            debajo y tapaba la foto del hero (elección del dueño, 2026-09-25):
            la barra de abajo ya lleva "Cotizar" al centro. */}
        <span aria-hidden="true" className="grid size-10 shrink-0 place-items-center rounded-control bg-coral-bright text-btn-ink">
          <Icono nombre="flecha-der" tamano={20} />
        </span>
      </button>

      <Hoja
        abierta={abierta}
        onCerrar={() => setAbierta(false)}
        titulo="Cotice su viaje"
        escritorio="centrado"
        pie={
          <button type="submit" form={idForm} className={clasesBoton({ variante: "firma", tamano: "lg", ancho: true })}>
            Cotizar {n} {n === 1 ? "servicio" : "servicios"}
            <Icono nombre="flecha-der" tamano={20} />
          </button>
        }
      >
        <Form id={idForm} action={DESTINO} className="flex flex-col gap-4 pb-2">
          <div>
            <Rotulo id={`${idRotulo}-servicio`}>Servicio · puede marcar varios</Rotulo>
            <div role="group" aria-labelledby={`${idRotulo}-servicio`} className="grid grid-cols-4 gap-2">
              {SELLOS_SERVICIO.map((s) => (
                <Sello
                  key={s.id}
                  activo={s.id === "paquete" ? esPaquete(c.servicios) : c.servicios.includes(s.id)}
                  onClick={() => c.setServicios(alternar(c.servicios, s.id))}
                  etiqueta={s.etiqueta}
                  icono={s.icono}
                />
              ))}
            </div>
            <input type="hidden" name="servicios" value={c.servicios.join(",")} />
          </div>

          <div>
            <Rotulo id={`${idRotulo}-destino`}>Destino</Rotulo>
            <div role="group" aria-labelledby={`${idRotulo}-destino`} className="grid grid-cols-4 gap-2">
              {DESTINOS_RAPIDOS.map((d) => (
                <Sello
                  key={d.valor}
                  activo={c.destino === d.valor}
                  onClick={() => c.setDestino(d.valor)}
                  etiqueta={d.label}
                  destino={d.valor}
                />
              ))}
            </div>
            <input type="hidden" name="destino" value={c.destino} />
            {conOtro ? (
              <div className="mt-3">
                <Rotulo id={`${idRotulo}-combinar`}>¿Con qué otro destino?</Rotulo>
                <div role="group" aria-labelledby={`${idRotulo}-combinar`} className="grid grid-cols-4 gap-2">
                  {DESTINOS_RAPIDOS.filter((d) => d.valor !== c.destino).map((d) => (
                    <Sello
                      key={d.valor}
                      activo={c.combinar === d.valor}
                      onClick={() => c.setCombinar(c.combinar === d.valor ? "" : d.valor)}
                      etiqueta={d.label}
                      destino={d.valor}
                    />
                  ))}
                </div>
                {c.combinar ? <input type="hidden" name="combinar" value={c.combinar} /> : null}
              </div>
            ) : null}
            <button
              type="button"
              aria-expanded={conOtro}
              onClick={() => {
                if (conOtro) c.setCombinar("");
                setConOtro(!conOtro);
              }}
              className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-control text-sm font-semibold text-acento outline-offset-2 hover:underline"
            >
              <Icono nombre={conOtro ? "menos" : "suma"} tamano={18} />
              {conOtro ? "Solo un destino" : "Combinar con otro destino"}
            </button>
          </div>

          <div>
            <div className={c.etiquetaFin ? "grid grid-cols-2 gap-3" : ""}>
              <Campo etiqueta={c.etiquetaInicio}>
                {(a11y) => (
                  <SelectorFecha
                    id={a11y.id}
                    name="fecha"
                    etiqueta={c.etiquetaInicio}
                    valor={c.entrada}
                    onCambio={(v) => {
                      c.cambiarEntrada(v);
                      // Elegida la entrada, se abre la salida.
                      if (v && c.etiquetaFin && !c.salida) {
                        const boton = document.querySelector(`[id="${idForm}"] input[name="hasta"]`)?.previousElementSibling;
                        if (boton?.id) seguirCon(boton.id);
                      }
                    }}
                    min={hoyCaracas()}
                    rango={c.etiquetaFin ? { desde: c.entrada, hasta: c.salida } : undefined}
                    vacio="Elegir fecha"
                    className={`${CLASE_CONTROL} min-h-12 cursor-pointer py-2.5`}
                  />
                )}
              </Campo>
              {c.etiquetaFin ? (
                <Campo etiqueta={c.etiquetaFin}>
                  {(a11y) => (
                    <SelectorFecha
                      id={a11y.id}
                      name="hasta"
                      etiqueta={c.etiquetaFin ?? "Salida"}
                      valor={c.salida}
                      onCambio={c.setSalida}
                      min={c.minSalida}
                      rango={{ desde: c.entrada, hasta: c.salida }}
                      vacio="Elegir fecha"
                      className={`${CLASE_CONTROL} min-h-12 cursor-pointer py-2.5`}
                    />
                  )}
                </Campo>
              ) : null}
            </div>
            {c.etiquetaFin ? (
              <p aria-live="polite" className="mt-2 min-h-5 font-mono text-sm tabular-nums text-ink-soft">
                {c.duracion}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Campo etiqueta="Adultos">
              {(a11y) => (
                <Selector {...a11y} name="adultos" value={c.viajeros.adultos} onChange={cambiarViajeros("adultos")}>
                  <OpcionesNumero desde={1} hasta={ADULTOS_MAX} />
                </Selector>
              )}
            </Campo>
            <Campo etiqueta="Niños">
              {(a11y) => (
                <Selector {...a11y} name="ninos" value={c.viajeros.ninos} onChange={cambiarViajeros("ninos")}>
                  <OpcionesNumero desde={0} hasta={NINOS_MAX} />
                </Selector>
              )}
            </Campo>
            <Campo etiqueta="Bebés">
              {(a11y) => (
                <Selector {...a11y} name="bebes" value={c.viajeros.bebes} onChange={cambiarViajeros("bebes")}>
                  <OpcionesNumero desde={0} hasta={BEBES_MAX} />
                </Selector>
              )}
            </Campo>
          </div>
          {c.promoNinos ? <AvisoNinosGratis ninos={c.viajeros.ninos} hotel={c.hotelNinos} /> : null}
          <CamposHotelNinos hotel={c.hotelNinos} />
        </Form>
      </Hoja>
    </>
  );
}
