"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BarraViaje, BarraViajeCompacta, ChipsServicios, chip } from "@/components/cotizador/BarraViaje";
import { AyudanteCotizar } from "@/components/cotizador/AyudanteCotizar";
import { DetalleHotel } from "@/components/cotizador/DetalleHotel";
import { OfertasHospedaje } from "@/components/cotizador/OfertasHospedaje";
import { RecomendacionesHospedaje, type PrecioViaje } from "@/components/cotizador/RecomendacionesHospedaje";
import { ResumenViaje, textoFechas } from "@/components/cotizador/ResumenViaje";
import { SeccionTours } from "@/components/cotizador/SeccionTours";
import { SeccionVuelo } from "@/components/cotizador/SeccionVuelo";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { estimarEstadia, type Estadia } from "@/lib/cotizador/estimado";
import {
  bloqueosEnFechas,
  esOnRequest,
  hotelParaCotizar,
  tarifasDeHoteles,
  textoSinDisponibilidad,
  type Bloqueo,
  type HotelDetalle,
} from "@/lib/cotizador/hotel";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { candidatosEstimado, recomendarHoteles } from "@/lib/cotizador/recomendar";
import type { Tarifa } from "@/types/supabase";
import { montoConMoneda } from "@/lib/tarifas";
import { SolicitudLista } from "@/components/leads/SolicitudLista";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Entrada } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { asesorAsignado, nombreDePila } from "@/lib/asesores";
import {
  alternarTour,
  atajosFinde,
  correoValido,
  fechasVuelo,
  hoyCaracas,
  nochesDe,
  parsearEstado,
  serializarEstado,
  telefonoValido,
  textoDuracion,
  textoRangoCorto,
  textoViajeros,
  type EstadoViaje,
} from "@/lib/cotizador/estado";
import { almacenLocal, borradorUtil, borrarBorrador, guardarBorrador, leerBorrador, type Borrador } from "@/lib/cotizador/borrador";
import type { TourWeb } from "@/lib/cotizador/tours";
import { estimarVueloViaje, type RutaVuelo } from "@/lib/cotizador/vuelo";
import { toursDelCatalogo } from "@/lib/cotizador/toursWeb";
import { armarCotizacionViaje, type ContactoViaje, type HospedajeElegido } from "@/lib/leads/buildCotizacion";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import type { HotelCotizador } from "@/lib/supabase/queries";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";
import { NUMERO_CORPORATIVO } from "@/lib/whatsapp";

interface Errores {
  fechas?: string;
  vuelo?: string;
  nombre?: string;
  telefono?: string;
  correo?: string;
}

interface Enviado {
  waHref: string;
  leadId: number | null;
  fallo: boolean;
  /** Nombre de pila de quien recibe el WhatsApp; null = número corporativo. */
  asesorNombre: string | null;
}

type Servicio = EstadoViaje["servicios"][number];
type EstadoPestana = { tono: "listo" | "falta" | "vacio"; texto: string };

const NOMBRE_PESTANA: Record<Servicio, string> = { hospedaje: "Hospedaje", vuelo: "Vuelo", tours: "Tours" };
const TONO_PESTANA: Record<EstadoPestana["tono"], string> = {
  listo: "text-seafoam-text",
  falta: "font-semibold text-ambar",
  vacio: "text-ink-soft",
};

/** Una pestaña por servicio marcado, con su estado a la vista. Los paneles
 * inactivos quedan montados y ocultos: no pierden lo que el cliente tocó. Con
 * un solo servicio no hay pestañas: un título y el panel. */
function Pestanas({
  base,
  activa,
  onActivar,
  items,
}: {
  base: string;
  activa: Servicio;
  onActivar: (s: Servicio) => void;
  items: { id: Servicio; titulo: string; estado: EstadoPestana; panel: ReactNode }[];
}) {
  if (items.length === 1) {
    const [it] = items;
    return (
      <section aria-labelledby={`${base}-titulo-${it.id}`} className="rounded-card border border-linea bg-card">
        <div id={`${base}-panel-${it.id}`} className="flex flex-col gap-4 p-4 md:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <h2 id={`${base}-titulo-${it.id}`} className="font-display text-2xl font-bold leading-tight text-ink">
              {it.titulo}
            </h2>
            <span className={`text-xs ${TONO_PESTANA[it.estado.tono]}`}>{it.estado.texto}</span>
          </div>
          {it.panel}
        </div>
      </section>
    );
  }

  function teclado(ev: React.KeyboardEvent) {
    const i = items.findIndex((it) => it.id === activa);
    const destino =
      ev.key === "ArrowRight" ? (i + 1) % items.length
      : ev.key === "ArrowLeft" ? (i - 1 + items.length) % items.length
      : ev.key === "Home" ? 0
      : ev.key === "End" ? items.length - 1
      : -1;
    if (destino < 0) return;
    ev.preventDefault();
    onActivar(items[destino].id);
    document.getElementById(`${base}-tab-${items[destino].id}`)?.focus();
  }

  return (
    <div className="overflow-hidden rounded-card border border-linea bg-card">
      <div
        role="tablist"
        aria-label="Servicios de su viaje"
        onKeyDown={teclado}
        className="grid auto-cols-fr grid-flow-col border-b border-linea bg-sand-2"
      >
        {items.map((it) => {
          const sel = it.id === activa;
          return (
            <button
              key={it.id}
              id={`${base}-tab-${it.id}`}
              type="button"
              role="tab"
              aria-selected={sel}
              aria-controls={`${base}-panel-${it.id}`}
              tabIndex={sel ? 0 : -1}
              onClick={() => onActivar(it.id)}
              className={`relative flex min-h-12 min-w-0 items-center gap-2 px-4 py-2 text-left transition-colors duration-150 ease-salida motion-reduce:transition-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-acento ${
                sel ? "bg-card" : "hover:bg-sand"
              }`}
            >
              <span className={`shrink-0 font-semibold ${sel ? "text-ink" : "text-ink-soft"}`}>{NOMBRE_PESTANA[it.id]}</span>
              <span className={`min-w-0 truncate text-xs ${TONO_PESTANA[it.estado.tono]}`}>{it.estado.texto}</span>
              {sel ? <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" /> : null}
            </button>
          );
        })}
      </div>
      {items.map((it) => (
        <div
          key={it.id}
          id={`${base}-panel-${it.id}`}
          role="tabpanel"
          aria-labelledby={`${base}-tab-${it.id}`}
          hidden={it.id !== activa}
          className="flex flex-col gap-4 p-4 md:p-5"
        >
          {it.panel}
        </div>
      ))}
    </div>
  );
}

/** Con "reducir movimiento" el desplazamiento es instantáneo. */
const comportamientoScroll = (): ScrollBehavior =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";

const CONTACTO_VACIO: ContactoViaje = { nombre: "", telefono: "", correo: "", notas: "" };

function validar(e: EstadoViaje, c: ContactoViaje): Errores {
  const errores: Errores = {};
  const necesitaSalida = e.servicios.includes("hospedaje") || (e.servicios.includes("vuelo") && e.vuelo === "ida-vuelta");
  if (!e.desde) errores.fechas = "Elija la fecha del viaje para que el asesor confirme disponibilidad.";
  else if (necesitaSalida && !e.hasta) errores.fechas = "Elija también la fecha de salida o de vuelta.";
  const fv = fechasVuelo(e);
  if (e.servicios.includes("vuelo") && fv.propias && e.vuelo === "ida-vuelta" && !fv.vuelta)
    errores.vuelo = "Elija la fecha de vuelta del vuelo, o use las fechas de su viaje.";
  if (c.nombre.trim().length < 2) errores.nombre = "Escriba su nombre y apellido.";
  if (!telefonoValido(c.telefono)) errores.telefono = "Revise el número: de 7 a 15 dígitos, por ejemplo 0412-1234567.";
  if (c.correo.trim() && !correoValido(c.correo)) errores.correo = "Revise el correo, por ejemplo nombre@correo.com.";
  return errores;
}

/** Nombre y WhatsApp a la vista; correo y comentarios plegados. Se pinta en el
 * resumen (escritorio y hoja) y en una tarjeta en móvil: todos los campos van
 * con `form` al mismo formulario y comparten estado. */
function DatosContacto({
  formId,
  contacto,
  errores,
  onCampo,
  compacto = false,
}: {
  formId: string;
  /** En el resumen: menos aire y sin ayuda (el talón ya la dice). */
  compacto?: boolean;
  contacto: ContactoViaje;
  errores: Errores;
  onCampo: (clave: keyof ContactoViaje, valor: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const extra = abierto || !!errores.correo || !!contacto.correo || !!contacto.notas;
  return (
    <div className={`flex flex-col ${compacto ? "gap-3" : "gap-4"}`}>
      <Campo etiqueta="Nombre y apellido" requerido error={errores.nombre}>
        {(a11y) => (
          <Entrada
            {...a11y}
            form={formId}
            name="nombre"
            autoComplete="name"
            value={contacto.nombre}
            onChange={(ev) => onCampo("nombre", ev.target.value)}
          />
        )}
      </Campo>
      <Campo etiqueta="WhatsApp" requerido ayuda={compacto ? undefined : "Aquí le escribe el asesor con el precio confirmado."} error={errores.telefono}>
        {(a11y) => (
          <Entrada
            {...a11y}
            form={formId}
            name="telefono"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="0412-1234567"
            value={contacto.telefono}
            onChange={(ev) => onCampo("telefono", ev.target.value)}
          />
        )}
      </Campo>
      {extra ? (
        <>
          <Campo etiqueta="Correo (opcional)" error={errores.correo}>
            {(a11y) => (
              <Entrada
                {...a11y}
                form={formId}
                name="correo"
                type="email"
                autoComplete="email"
                value={contacto.correo}
                onChange={(ev) => onCampo("correo", ev.target.value)}
              />
            )}
          </Campo>
          <Campo etiqueta="Comentarios (opcional)">
            {(a11y) => (
              <AreaTexto
                {...a11y}
                form={formId}
                name="notas"
                rows={3}
                placeholder="Presupuesto, plan, zona, celebración..."
                maxLength={1000}
                value={contacto.notas}
                onChange={(ev) => onCampo("notas", ev.target.value)}
              />
            )}
          </Campo>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="self-start text-sm font-semibold text-acento underline underline-offset-4 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento"
        >
          Agregar correo o comentarios
        </button>
      )}
    </div>
  );
}

const PASOS = ["Su viaje", "Elija", "Envíe"] as const;

/** Móvil: tres pasos cortos para que se entienda qué hacer primero. */
function GuiaPasos({ paso }: { paso: 1 | 2 | 3 }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Paso ${paso} de 3`}>
      {PASOS.map((nombre, i) => {
        const n = i + 1;
        const hecho = n < paso;
        const actual = n === paso;
        return (
          <li key={nombre} className="flex flex-1 flex-col gap-1.5" aria-current={actual ? "step" : undefined}>
            <span className={`h-1.5 rounded-pill ${hecho || actual ? "bg-acento" : "bg-linea"}`} />
            <span className={`text-xs ${actual ? "font-semibold text-ink" : "text-ink-soft"}`}>
              {hecho ? "✓ " : `${n}. `}
              {nombre}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function CotizadorViaje({
  inicial,
  hotel: hotelInicial,
  ofertas,
  rutas,
}: {
  inicial: EstadoViaje;
  hotel: HotelCotizador | null;
  ofertas: OfertaHotel[];
  rutas: RutaVuelo[];
}) {
  const formId = useId();
  const { tasaUSD, tasaEUR } = useCurrency();
  const [estado, setEstado] = useState(inicial);
  const [detalles, setDetalles] = useState<Record<number, HotelDetalle | "error">>({});
  const [verHotel, setVerHotel] = useState<{ id: number; nombre: string } | null>(null);
  const [bloqueos, setBloqueos] = useState<{ clave: string; mapa: Map<number, Bloqueo[]>; fallo?: boolean } | null>(null);
  const [contacto, setContacto] = useState(CONTACTO_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  // Móvil: el viaje se ve en un renglón y se edita en una hoja.
  const [editarViaje, setEditarViaje] = useState(false);
  const [pestana, setPestana] = useState<Servicio | null>(null);
  const [catalogoTours, setCatalogoTours] = useState<TourWeb[] | "error" | null>(null);
  // Tarifas de los hoteles que se pueden recomendar, para mostrar su total sin abrirlos.
  const [tarifasHoteles, setTarifasHoteles] = useState<Record<number, Tarifa[] | "error">>({});
  const [verTodos, setVerTodos] = useState(false);
  // Borrador guardado de una visita anterior: se ofrece retomar, no se aplica solo.
  const [borradorPendiente, setBorradorPendiente] = useState<Borrador | null>(null);
  const borradorResuelto = useRef(false);
  // Ref, no state: un doble clic antes del próximo render vería el mismo
  // `enviando` y mandaría el lead dos veces.
  const enviandoRef = useRef(false);
  const primeraVez = useRef(true);

  const hospedaje = estado.servicios.includes("hospedaje");
  const vuelo = estado.servicios.includes("vuelo");
  const tours = estado.servicios.includes("tours");
  const ofertasDestino = ofertas.filter((o) => o.destino === estado.destino);
  const ofertaElegida = ofertas.find((o) => o.hotelId === estado.hotel);
  const hotel: HotelCotizador | null =
    estado.hotel == null
      ? null
      : hotelInicial?.id === estado.hotel
        ? hotelInicial
        : ofertaElegida
          ? { id: ofertaElegida.hotelId, nombre: ofertaElegida.nombre, destino: estado.destino, foto: ofertaElegida.foto }
          : null;

  // Detalle (tarifas y habitaciones) del hotel elegido y del que se está mirando.
  const pendientes = [hotel?.id, verHotel?.id].filter((id): id is number => id != null && !(id in detalles));
  const clavePendientes = pendientes.join(",");
  useEffect(() => {
    if (!clavePendientes) return;
    let vivo = true;
    for (const id of clavePendientes.split(",").map(Number)) {
      hotelParaCotizar(id)
        .then((d) => vivo && setDetalles((m) => ({ ...m, [id]: d ?? "error" })))
        .catch(() => vivo && setDetalles((m) => ({ ...m, [id]: "error" })));
    }
    return () => {
      vivo = false;
    };
  }, [clavePendientes]);

  // Stop sales de los hoteles a la vista en las fechas elegidas.
  const idsBloqueo = [...new Set([...ofertasDestino.map((o) => o.hotelId), ...(hotel ? [hotel.id] : [])])];
  const claveBloqueo = hospedaje && estado.desde && estado.hasta ? `${idsBloqueo.join(",")}|${estado.desde}|${estado.hasta}` : "";
  useEffect(() => {
    if (!claveBloqueo) return;
    let vivo = true;
    const [ids, desde, hasta] = claveBloqueo.split("|");
    bloqueosEnFechas(ids.split(",").filter(Boolean).map(Number), desde, hasta)
      .then((mapa) => vivo && setBloqueos({ clave: claveBloqueo, mapa }))
      // Si la consulta falla no hay cómo saber si hay stop sale: se avisa y no se estima (Fase 6).
      .catch(() => vivo && setBloqueos({ clave: claveBloqueo, mapa: new Map(), fallo: true }));
    return () => {
      vivo = false;
    };
  }, [claveBloqueo]);
  // Tarifas de los candidatos a recomendar: una lectura por destino. No
  // dependen de las fechas, así el total aparece apenas el cliente las elige.
  const candidatos = hospedaje ? candidatosEstimado(ofertasDestino) : [];
  const claveCandidatos = candidatos.filter((id) => !(id in tarifasHoteles)).join(",");
  useEffect(() => {
    if (!claveCandidatos) return;
    let vivo = true;
    const ids = claveCandidatos.split(",").map(Number);
    const guardar = (de: (id: number) => Tarifa[] | "error") =>
      setTarifasHoteles((m) => ({ ...m, ...Object.fromEntries(ids.map((id) => [id, de(id)])) }));
    tarifasDeHoteles(ids)
      .then((mapa) => vivo && guardar((id) => mapa.get(id) ?? "error"))
      .catch(() => vivo && guardar(() => "error"));
    return () => {
      vivo = false;
    };
  }, [claveCandidatos]);
  // Tours del catálogo: una lectura la primera vez que se marca el servicio.
  useEffect(() => {
    if (!tours || catalogoTours !== null) return;
    let vivo = true;
    toursDelCatalogo()
      .then((t) => vivo && setCatalogoTours(t))
      .catch(() => vivo && setCatalogoTours("error"));
    return () => {
      vivo = false;
    };
  }, [tours, catalogoTours]);

  // Borrador: solo si la URL viene limpia (un enlace con hotel o fechas manda).
  useEffect(() => {
    // localStorage no existe en el servidor: se lee ya montado, fuera del cuerpo síncrono del efecto.
    const t = setTimeout(() => {
      const guardado = window.location.search === "" ? leerBorrador(almacenLocal()) : null;
      if (guardado && borradorUtil(guardado.q, guardado.contacto)) setBorradorPendiente(guardado);
      else borradorResuelto.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!borradorResuelto.current || enviado) return;
    const q = serializarEstado(estado);
    const espera = setTimeout(() => {
      if (borradorUtil(q, contacto)) guardarBorrador(almacenLocal(), q, contacto);
    }, 500);
    return () => clearTimeout(espera);
  }, [estado, contacto, enviado]);

  function retomarBorrador() {
    if (!borradorPendiente) return;
    setEstado(parsearEstado(Object.fromEntries(new URLSearchParams(borradorPendiente.q))));
    setContacto(borradorPendiente.contacto);
    descartarBorrador(false);
  }

  function descartarBorrador(borrar = true) {
    if (borrar) borrarBorrador(almacenLocal());
    borradorResuelto.current = true;
    setBorradorPendiente(null);
    // El guardado espera al siguiente cambio del cliente.
    setEstado((e) => ({ ...e }));
  }

  const mapaBloqueos = bloqueos && bloqueos.clave === claveBloqueo ? bloqueos.mapa : null;
  const bloqueosFallo = !!bloqueos && bloqueos.clave === claveBloqueo && !!bloqueos.fallo;
  const sinDisponibilidad = (id: number) =>
    estado.desde && estado.hasta ? textoSinDisponibilidad(mapaBloqueos?.get(id), estado.desde, estado.hasta) : null;

  const detalleElegido = hotel ? detalles[hotel.id] : undefined;
  // Sin habitación elegida se usa la tarifa que anuncia la oferta: el cliente
  // ve un precio desde que marca fechas y afina después con "Ver habitaciones".
  const tarifaBase = estado.tarifa ?? ofertaElegida?.tarifaId ?? null;
  const tarifaElegida =
    detalleElegido && detalleElegido !== "error" ? (detalleElegido.tarifas.find((t) => t.id === tarifaBase) ?? null) : null;
  const estadia: Estadia = {
    desde: estado.desde,
    hasta: estado.hasta,
    adultos: estado.adultos,
    edades: estado.edades.slice(0, estado.ninos),
    bebes: estado.bebes,
    ninosGratis: ofertaElegida?.ninosGratisCantidad || undefined,
  };
  const hotelBloqueado = hospedaje && hotel ? sinDisponibilidad(hotel.id) : null;
  const estimado =
    hospedaje && tarifaElegida && detalleElegido && detalleElegido !== "error" && !hotelBloqueado && !bloqueosFallo
      ? estimarEstadia(tarifaElegida, detalleElegido.tarifas, estadia)
      : null;
  const toursElegidos = (catalogoTours && catalogoTours !== "error" ? catalogoTours : []).filter((t) => estado.tours.includes(t.id));
  const vueloViaje = estimarVueloViaje(estado, rutas, hoyCaracas());
  const habitacion = tarifaElegida?.habitacion ?? null;
  const elegido: HospedajeElegido = {
    habitacion,
    plan: tarifaElegida?.plan ?? null,
    estimado: estimado?.ok ? montoConMoneda(estimado.total, estimado.moneda) : null,
  };

  // Total de cada hotel recomendable con la tarifa que anuncia su oferta: el
  // mismo cálculo (y el mismo número) que el resumen cuando el cliente lo elige.
  const conFechas = !!(estado.desde && estado.hasta);
  const precioDe = (o: OfertaHotel): PrecioViaje => {
    if (!conFechas || bloqueosFallo) return null;
    const detalle = detalles[o.hotelId];
    const filas = detalle && detalle !== "error" ? detalle.tarifas : tarifasHoteles[o.hotelId];
    if (filas === undefined) return candidatos.includes(o.hotelId) ? "cargando" : null;
    if (filas === "error") return null;
    const anunciada = filas.find((t) => t.id === o.tarifaId);
    return anunciada ? estimarEstadia(anunciada, filas, { ...estadia, ninosGratis: o.ninosGratisCantidad || undefined }) : null;
  };
  const recomendaciones = recomendarHoteles(ofertasDestino, {
    ninos: estado.ninos,
    bloqueada: (o) => !!sinDisponibilidad(o.hotelId),
    // EUR y USD se comparan en dólares con la tasa del día (la de PrecioMostrado);
    // sin tasa, cada moneda va aparte.
    total: (o) => {
      const p = precioDe(o);
      if (!p || p === "cargando" || !p.ok) return null;
      return p.moneda === "EUR" && tasaUSD && tasaEUR
        ? { monto: (p.total * tasaEUR) / tasaUSD, moneda: "USD" }
        : { monto: p.total, moneda: p.moneda };
    },
  });

  // El estado vive en la URL: se reescribe sin apilar historial. La primera
  // vez no, así una URL limpia sigue limpia hasta que el cliente toca algo.
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    window.history.replaceState(null, "", `?${serializarEstado(estado)}`);
  }, [estado]);

  // El botón de envío desaparece al confirmar: el foco pasa a la confirmación,
  // si no queda en el body y el lector de pantalla no se entera.
  const confirmacion = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (enviado) confirmacion.current?.focus({ preventScroll: true });
  }, [enviado]);

  function cambiar(nuevo: EstadoViaje) {
    // Un servicio recién marcado abre su pestaña.
    const agregado = nuevo.servicios.find((s) => !estado.servicios.includes(s));
    if (agregado) setPestana(agregado);
    // Un hotel de otro destino no sigue elegido, ni los tours del destino anterior.
    setEstado(nuevo.destino === estado.destino ? nuevo : { ...nuevo, hotel: null, tarifa: null, tours: [] });
    if (errores.fechas) setErrores((e) => ({ ...e, fechas: undefined }));
  }

  function campo<K extends keyof ContactoViaje>(clave: K, valor: string) {
    setContacto((c) => ({ ...c, [clave]: valor }));
    if (errores[clave as keyof Errores]) setErrores((e) => ({ ...e, [clave]: undefined }));
  }

  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (enviandoRef.current) return;
    const nuevos = validar(estado, contacto);
    // Decisión del dueño: no se cotiza un hospedaje en fechas con stop sale.
    const porBloqueo = !nuevos.fechas && !!hotelBloqueado;
    if (porBloqueo) nuevos.fechas = `${hotel?.nombre}: ${hotelBloqueado?.toLowerCase()}. Cambie las fechas o elija otro hotel.`;
    setErrores(nuevos);
    const primero = (["fechas", "vuelo", "nombre", "telefono", "correo"] as const).find((k) => nuevos[k]);
    if (primero) {
      // El error abre su pestaña. Los datos de contacto, en móvil, viven en la
      // hoja del resumen: se abre (o se queda abierta); lo demás está en la página.
      if (primero === "vuelo") setPestana("vuelo");
      else if (porBloqueo) setPestana("hospedaje");
      const enHoja =
        (primero === "nombre" || primero === "telefono" || primero === "correo") &&
        !window.matchMedia("(min-width: 64rem)").matches;
      setHojaAbierta(enHoja);
      // El foco va al primer campo con error, después de que la hoja termine de
      // abrir o cerrar (ella también mueve el foco). Los campos se pintan dos
      // veces (resumen y hoja): vale el que se ve.
      setTimeout(() => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        const destino =
          primero === "fechas" || primero === "vuelo"
            ? document.getElementById(`${formId}-${primero}`)
            : (Array.from(form?.elements ?? []).find(
                (el): el is HTMLElement =>
                  el instanceof HTMLElement && el.getAttribute("name") === primero && el.getClientRects().length > 0,
              ) ?? null);
        destino?.focus({ preventScroll: true });
        destino?.scrollIntoView({ block: "center", behavior: comportamientoScroll() });
      }, enHoja ? 320 : 60);
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    try {
      const datos: ContactoViaje = {
        nombre: contacto.nombre.trim(),
        telefono: contacto.telefono.trim(),
        correo: contacto.correo.trim(),
        notas: contacto.notas.trim(),
      };
      const nombresTours = toursElegidos.map((t) => t.nombre);
      const base = armarCotizacionViaje(estado, datos, hotel, undefined, elegido, nombresTours, vueloViaje);

      let leadId: number | null = null;
      // Siempre el asesor que asignó el reparto del CRM (también en vuelo solo):
      // el WhatsApp tiene que coincidir con el dueño del lead en el CRM.
      let asesor: { nombre: string; telefono: string } | null = null;
      let fallo = false;
      try {
        const lead = await crearLeadCRM({
          nombre: datos.nombre,
          telefono: datos.telefono,
          destino: base.destino,
          personas: base.personas,
          consulta: base.consulta,
        });
        leadId = lead.lead_id ?? null;
        asesor = asesorAsignado(lead.asesor, lead.asesor_whatsapp);
      } catch {
        fallo = true;
      }
      const telefonoAsesor = asesor?.telefono ?? NUMERO_CORPORATIVO;
      const asesorNombre = asesor ? nombreDePila(asesor.nombre) : null;

      // Después del lead: el reporte lleva al asesor que de verdad recibe el WhatsApp.
      enviarASheetMonkey({
        destino: base.destino,
        servicio: base.servicio,
        pagina: "Arme su viaje",
        nombre: datos.nombre,
        procedencia: detectarProcedencia(),
        telefono: datos.telefono,
        asesor: telefonoAsesor,
      });

      const final = armarCotizacionViaje(
        estado,
        datos,
        hotel,
        leadId ?? undefined,
        elegido,
        nombresTours,
        vueloViaje,
        asesorNombre,
      );
      // Con el CRM caído el borrador se queda: el cliente puede reintentar.
      if (!fallo) borrarBorrador(almacenLocal());
      const mensaje = esInstagramInApp() ? final.mensajeTexto : final.mensajeEmoji;
      setEnviado({
        waHref: `https://wa.me/${telefonoAsesor}?text=${encodeURIComponent(mensaje)}`,
        leadId,
        fallo,
        asesorNombre,
      });
      setHojaAbierta(false);
      window.scrollTo({ top: 0 });
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div ref={confirmacion} tabIndex={-1} className="outline-none">
        <SolicitudLista
          waHref={enviado.waHref}
          detalle={enviado.leadId ? `Cotización #${enviado.leadId}` : "Arme su viaje"}
          titulo={enviado.fallo ? "Falta un paso para enviarla" : "Su cotización está lista"}
          boton={enviado.asesorNombre ? `Enviar a ${enviado.asesorNombre}` : undefined}
        >
          <div className="flex flex-col gap-3">
            {enviado.fallo ? (
              <Aviso>
                No pudimos registrar su solicitud en nuestro sistema. Envíela ahora por WhatsApp y un asesor la
                recibe directamente.
              </Aviso>
            ) : enviado.asesorNombre ? (
              <p>
                Su asesor es <strong className="font-semibold text-ink">{enviado.asesorNombre}</strong>. Envíele la
                cotización por WhatsApp y le confirma disponibilidad y precio.
              </p>
            ) : (
              <p>Envíela por WhatsApp y un asesor le confirma disponibilidad y precio.</p>
            )}
            <p className="text-sm">
              {estado.destino} · {textoFechas(estado)} · {textoViajeros(estado)}
            </p>
          </div>
        </SolicitudLista>
      </div>
    );
  }

  const cantidad = estado.servicios.length;
  const activa = pestana && estado.servicios.includes(pestana) ? pestana : estado.servicios[0];
  const fv = fechasVuelo(estado);
  const falta: EstadoPestana = { tono: "falta", texto: "Falta un dato" };
  const sinElegir: EstadoPestana = { tono: "vacio", texto: "Sin elegir" };
  const estadoPestana: Record<Servicio, EstadoPestana> = {
    hospedaje:
      hotelBloqueado || (hotel && !(estado.desde && estado.hasta)) ? falta
      : hotel ? { tono: "listo", texto: `Listo · ${hotel.nombre}` }
      : sinElegir,
    vuelo:
      errores.vuelo || !fv.ida || (estado.vuelo === "ida-vuelta" && !fv.vuelta) ? falta
      : { tono: "listo", texto: `Listo · ${estado.origen} a ${estado.destino}` },
    tours: estado.tours.length
      ? { tono: "listo", texto: `Listo · ${estado.tours.length} ${estado.tours.length === 1 ? "tour" : "tours"}` }
      : sinElegir,
  };
  const resumen = (conTitulo: boolean) => (
    <ResumenViaje
      estado={estado}
      hotel={hotel}
      habitacion={habitacion}
      estimado={estimado}
      formId={formId}
      enviando={enviando}
      conTitulo={conTitulo}
      tours={toursElegidos.map((t) => t.nombre)}
      vuelo={vueloViaje}
      desde={ofertaElegida?.precio ? { monto: ofertaElegida.precio.monto, unidad: ofertaElegida.precio.unidad } : null}
      datos={<DatosContacto formId={formId} contacto={contacto} errores={errores} onCampo={campo} compacto />}
    />
  );
  const detalleVisto = verHotel ? detalles[verHotel.id] : undefined;
  // Sin fotos por habitación el detalle no aporta para decidir: la oferta se
  // elige directo con su tarifa anunciada (el asesor confirma la habitación).
  const abrirOferta = (o: OfertaHotel) =>
    o.conFotosHabitacion
      ? setVerHotel({ id: o.hotelId, nombre: o.nombre })
      : cambiar({ ...estado, hotel: o.hotelId, tarifa: o.tarifaId });
  // Desde la hoja de todos los hoteles: primero se cierra, después se abre el
  // detalle; si no, la hoja que sale le devuelve el foco a su botón y se lo
  // quita a la que entra.
  const verDesdeTodos = (o: OfertaHotel) => {
    setVerTodos(false);
    if (o.conFotosHabitacion) setTimeout(() => abrirOferta(o), 260);
    else abrirOferta(o);
  };
  // "Otras fechas": en escritorio abre el calendario de la barra; en móvil, la hoja del viaje.
  const abrirCalendario = () => {
    const boton = window.matchMedia("(min-width: 64rem)").matches ? document.getElementById(`${formId}-barra-desde`) : null;
    if (!boton) return setEditarViaje(true);
    boton.scrollIntoView({ block: "nearest", behavior: comportamientoScroll() });
    boton.click();
  };
  const noches = nochesDe(estado);
  const textoNoches = `${noches} ${noches === 1 ? "noche" : "noches"}`;
  const montoBarra = estimado?.ok ? montoConMoneda(estimado.total, estimado.moneda) : null;
  const hayRegalo = ofertasDestino.some((o) => o.ninosGratis);
  // Móvil: en qué paso va (1 viaje, 2 elegir, 3 enviar), solo para orientar.
  const pasoActual: 1 | 2 | 3 = !(estado.desde && estado.hasta)
    ? 1
    : estado.servicios.every((s) => estadoPestana[s].tono === "listo")
      ? 3
      : 2;
  const panelHospedaje = (
    <>
      {hotel ? (
        <div className="flex flex-col gap-3 rounded-card border border-acento bg-card p-3 sm:flex-row sm:items-center">
          {hotel.foto ? (
            <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-control bg-sand-2">
              <Image src={hotel.foto} alt="" fill sizes="112px" className="object-cover" />
            </span>
          ) : null}
          <div className="min-w-0 flex-1" aria-live="polite" aria-atomic="true">
            <p className="font-semibold text-ink">{hotel.nombre}</p>
            {habitacion ? <p className="text-sm text-ink-soft">{habitacion}</p> : null}
            {hotelBloqueado ? (
              <p className="text-sm font-semibold text-peligro">{hotelBloqueado}. Cambie las fechas o elija otro hotel.</p>
            ) : estimado?.ok ? (
              <p className="text-sm text-ink">
                Estimado{" "}
                <span className="font-mono font-bold tabular-nums">
                  <PrecioMostrado texto={montoBarra} />
                </span>{" "}
                <span className="text-ink-soft">
                  · {textoDuracion(estimado.noches)} · {textoViajeros(estado)}
                </span>
              </p>
            ) : (
              <p className="text-sm text-ink-soft">
                {bloqueosFallo
                  ? "No pudimos verificar la disponibilidad en esas fechas. "
                  : estimado && !estimado.ok ? `${estimado.texto} ` : !tarifaBase ? "Elija la habitación para ver el estimado. " : ""}
                Precio a confirmar por el asesor.
              </p>
            )}
            {estimado?.ok
              ? estimado.avisos.map((a) => (
                  <p key={a} className="text-xs text-ink-soft">
                    {a}
                  </p>
                ))
              : null}
          </div>
          <div className="flex gap-2 sm:flex-col">
            <Boton variante="secundario" tamano="sm" onClick={() => setVerHotel({ id: hotel.id, nombre: hotel.nombre })}>
              {estado.tarifa ? "Cambiar habitación" : "Ver habitaciones"}
            </Boton>
            <Boton variante="fantasma" tamano="sm" onClick={() => cambiar({ ...estado, hotel: null, tarifa: null })}>
              Quitar
            </Boton>
          </div>
        </div>
      ) : null}
      {!estado.desde ? (
        <div className="flex flex-col gap-2 rounded-card bg-acento-suave p-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <p className="text-sm font-semibold text-ink">¿Cuándo viaja? Elija y le mostramos el total:</p>
          <div role="group" aria-label="Fechas sugeridas" className="flex flex-wrap gap-2">
            {atajosFinde().map((a) => (
              <button
                key={a.desde}
                type="button"
                onClick={() => cambiar({ ...estado, desde: a.desde, hasta: a.hasta })}
                className={chip(false)}
              >
                {textoRangoCorto(a.desde, a.hasta)}
              </button>
            ))}
            <button type="button" onClick={abrirCalendario} className={chip(false)}>
              Otras fechas
            </button>
          </div>
        </div>
      ) : null}
      {ofertasDestino.length ? (
        <RecomendacionesHospedaje
          recomendaciones={recomendaciones}
          precioDe={precioDe}
          onRequest={(o) => esOnRequest(mapaBloqueos?.get(o.hotelId))}
          detalle={`${textoNoches} · ${textoViajeros(estado)}`}
          detalleCorto={`por ${textoNoches}`}
          ninos={estado.ninos}
          elegido={hotel?.id ?? null}
          totalHoteles={ofertasDestino.length}
          destino={estado.destino}
          onElegir={(o) => cambiar({ ...estado, hotel: o.hotelId, tarifa: o.tarifaId })}
          onVerHabitaciones={(o) => setVerHotel({ id: o.hotelId, nombre: o.nombre })}
          onVerTodos={() => setVerTodos(true)}
        />
      ) : (
        <p className="text-ink-soft">
          Aún no tenemos ofertas publicadas en {estado.destino}. Escriba en los comentarios, junto al botón de envío,
          qué busca (plan, presupuesto, zona) y un asesor le propone opciones con disponibilidad para sus fechas.
        </p>
      )}
    </>
  );
  const panelVuelo = <SeccionVuelo estado={estado} rutas={rutas} vuelo={vueloViaje} error={errores.vuelo} errorId={`${formId}-vuelo`} onCambio={cambiar} />;
  const panelTours = (
    <SeccionTours
      destino={estado.destino}
      tours={catalogoTours && catalogoTours !== "error" ? catalogoTours : []}
      elegidos={estado.tours}
      cargando={catalogoTours === null}
      error={catalogoTours === "error"}
      onAlternar={(id) => cambiar(alternarTour(estado, id))}
    />
  );

  return (
    <>
      <div className="mb-4 hidden lg:block">
        <BarraViajeCompacta estado={estado} onCambio={cambiar} idBase={`${formId}-barra`} />
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
        <div className="flex min-w-0 flex-col gap-6 md:gap-8">
          <form id={formId} onSubmit={enviar} noValidate hidden />
          {borradorPendiente ? (
            <div role="status" className="flex items-center gap-2 rounded-card border border-acento bg-acento-suave py-2 pl-4 pr-2 sm:gap-3 sm:p-4">
              <p className="min-w-0 flex-1 text-sm text-ink sm:text-base">
                <span className="sm:hidden">Tiene una cotización sin enviar.</span>
                <span className="max-sm:hidden">Tiene una cotización sin enviar de una visita anterior. ¿Desea retomarla?</span>
              </p>
              <div className="flex shrink-0 gap-1 sm:gap-2">
                <Boton tamano="sm" onClick={retomarBorrador}>
                  Retomar
                </Boton>
                <Boton variante="fantasma" tamano="sm" aria-label="Descartar y empezar de nuevo" onClick={() => descartarBorrador()}>
                  <span className="sm:hidden">
                    <Icono nombre="cerrar" tamano={18} />
                  </span>
                  <span className="max-sm:hidden">Empezar de nuevo</span>
                </Boton>
              </div>
            </div>
          ) : null}
          {/* Móvil: el viaje en un renglón (se edita en una hoja) y los servicios debajo. */}
          <div className="flex flex-col gap-4 lg:hidden">
            <GuiaPasos paso={pasoActual} />
            <button
              type="button"
              aria-haspopup="dialog"
              onClick={() => setEditarViaje(true)}
              className="flex items-center gap-3 rounded-card border border-linea bg-card p-3.5 text-left"
            >
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">{estado.destino}</span>
                <span className={`block text-sm ${estado.desde ? "text-ink-soft" : "font-semibold text-acento"}`}>
                  {estado.desde ? textoFechas(estado) : "Toque para elegir fechas"} · {textoViajeros(estado)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-acento underline underline-offset-4">Editar</span>
            </button>
            <ChipsServicios estado={estado} onCambio={cambiar} compacto />
          </div>

          {errores.fechas ? (
            <Aviso>
              <span id={`${formId}-fechas`} tabIndex={-1}>
                {errores.fechas}
              </span>{" "}
              <button
                type="button"
                onClick={() => setEditarViaje(true)}
                className="font-semibold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-acento lg:hidden"
              >
                Cambiar fechas
              </button>
            </Aviso>
          ) : null}

          <Pestanas
            base={formId}
            activa={activa}
            onActivar={setPestana}
            items={estado.servicios.map((s) => ({
              id: s,
              titulo:
                s === "hospedaje" ? `Hospedaje en ${estado.destino}`
                : s === "vuelo" ? "Vuelo"
                : `Full day y tours en ${estado.destino}`,
              estado: estadoPestana[s],
              panel: s === "hospedaje" ? panelHospedaje : s === "vuelo" ? panelVuelo : panelTours,
            }))}
          />
          {/* Móvil: Solcito después de las opciones, no antes: lo primero que se ve es qué elegir. */}
          <div className="lg:hidden">
            <AyudanteCotizar
              variante="movil"
              estado={estado}
              hotel={hotel?.nombre ?? null}
              estimado={montoBarra}
              hayRegalo={hayRegalo}
            />
          </div>
        </div>

        {/* Resumen arriba: nombre, WhatsApp y "Enviar solicitud" a la vista sin bajar. */}
        <aside aria-label="Su cotización" className="hidden lg:sticky lg:top-24 lg:flex lg:max-h-[calc(100dvh-7rem)] lg:flex-col lg:gap-4 lg:overflow-y-auto lg:overscroll-contain">
          {resumen(true)}
          <AyudanteCotizar
            variante="escritorio"
            estado={estado}
            hotel={hotel?.nombre ?? null}
            estimado={montoBarra}
            hayRegalo={hayRegalo}
          />
        </aside>
      </div>

      {/* Móvil: una sola barra al pie (en /cotizar no se muestra la barra de
          pestañas del sitio, ver BottomTabBar): el total y la única acción. */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-linea bg-card/95 px-4 pt-3 shadow-chrome backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-soft">
            {cantidad} {cantidad === 1 ? "servicio" : "servicios"}
            {nochesDe(estado) > 0 && hospedaje ? ` · ${textoDuracion(nochesDe(estado))}` : ""}
          </span>
          <span className="block truncate font-mono text-lg font-bold tabular-nums text-ink">
            {montoBarra ? (
              <PrecioMostrado texto={montoBarra} />
            ) : hospedaje && ofertaElegida?.precio ? (
              <>
                <span className="font-sans text-xs font-normal text-ink-soft">Desde </span>
                <PrecioMostrado texto={ofertaElegida.precio.monto} />
              </>
            ) : (
              <span className="font-sans text-sm font-semibold text-ink-soft">Precio lo confirma el asesor</span>
            )}
          </span>
        </span>
        <Boton tamano="lg" aria-haspopup="dialog" onClick={() => setHojaAbierta(true)}>
          {pasoActual === 3 ? "Enviar" : "Revisar"}
        </Boton>
      </div>

      <Hoja abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} titulo="Su cotización">
        <div className="p-4">{resumen(false)}</div>
      </Hoja>

      <Hoja abierta={editarViaje} onCerrar={() => setEditarViaje(false)} titulo="Su viaje">
        <div className="flex flex-col gap-6 p-4">
          <BarraViaje estado={estado} onCambio={cambiar} conServicios={false} />
          <Boton tamano="lg" ancho onClick={() => setEditarViaje(false)}>
            Listo
          </Boton>
        </div>
      </Hoja>

      <Hoja
        abierta={verTodos}
        onCerrar={() => setVerTodos(false)}
        titulo={`Hoteles en ${estado.destino}`}
        anchoClassName="lg:max-w-4xl"
      >
        <div className="flex flex-col gap-4 p-4 md:p-5">
          <OfertasHospedaje
            ofertas={ofertasDestino}
            destino={estado.destino}
            ninos={estado.ninos}
            elegido={hotel?.id ?? null}
            bloqueos={mapaBloqueos}
            desde={estado.desde}
            hasta={estado.hasta}
            onVer={verDesdeTodos}
          />
          <p className="text-sm text-ink-soft">
            ¿No encontró lo que busca? Escriba su presupuesto, plan o zona en los comentarios, junto al botón de
            envío, y un asesor le propone opciones.
          </p>
        </div>
      </Hoja>

      <Hoja
        abierta={!!verHotel}
        onCerrar={() => setVerHotel(null)}
        titulo={verHotel?.nombre ?? "Hotel"}
        anchoClassName="lg:max-w-2xl"
      >
        {verHotel ? (
          <DetalleHotel
            detalle={detalleVisto && detalleVisto !== "error" ? detalleVisto : null}
            error={detalleVisto === "error"}
            estadia={estadia}
            personas={estado.adultos + estado.ninos + estado.bebes}
            tarifaElegida={verHotel.id === estado.hotel ? estado.tarifa : null}
            sinDisponibilidad={sinDisponibilidad(verHotel.id)}
            onElegir={(tarifa) => {
              cambiar({ ...estado, hotel: verHotel.id, tarifa });
              setVerHotel(null);
            }}
          />
        ) : null}
      </Hoja>
    </>
  );
}
