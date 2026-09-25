"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BarraViaje, chip } from "@/components/cotizador/BarraViaje";
import { DetalleHotel } from "@/components/cotizador/DetalleHotel";
import { OfertasHospedaje } from "@/components/cotizador/OfertasHospedaje";
import { ResumenViaje, textoFechas } from "@/components/cotizador/ResumenViaje";
import { PrecioMostrado } from "@/components/ui/PrecioMostrado";
import { estimarEstadia, type Estadia } from "@/lib/cotizador/estimado";
import { bloqueosEnFechas, hotelParaCotizar, textoSinDisponibilidad, type Bloqueo, type HotelDetalle } from "@/lib/cotizador/hotel";
import type { OfertaHotel } from "@/lib/cotizador/ofertas";
import { montoConMoneda } from "@/lib/tarifas";
import { SolicitudLista } from "@/components/leads/SolicitudLista";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Campo, Entrada, Selector } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { ASESOR_BOLETERIA, asesorPorNombre, elegirAsesor } from "@/lib/asesores";
import {
  correoValido,
  nochesDe,
  ORIGENES_VUELO,
  serializarEstado,
  telefonoValido,
  textoDuracion,
  textoViajeros,
  type EstadoViaje,
} from "@/lib/cotizador/estado";
import { armarCotizacionViaje, type ContactoViaje, type HospedajeElegido } from "@/lib/leads/buildCotizacion";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import type { HotelCotizador } from "@/lib/supabase/queries";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";

interface Errores {
  fechas?: string;
  nombre?: string;
  telefono?: string;
  correo?: string;
}

interface Enviado {
  waHref: string;
  leadId: number | null;
  fallo: boolean;
}

const CONTACTO_VACIO: ContactoViaje = { nombre: "", telefono: "", correo: "", notas: "" };

function validar(e: EstadoViaje, c: ContactoViaje): Errores {
  const errores: Errores = {};
  const necesitaSalida = e.servicios.includes("hospedaje") || (e.servicios.includes("vuelo") && e.vuelo === "ida-vuelta");
  if (!e.desde) errores.fechas = "Elija la fecha del viaje para que el asesor confirme disponibilidad.";
  else if (necesitaSalida && !e.hasta) errores.fechas = "Elija también la fecha de salida o de vuelta.";
  if (c.nombre.trim().length < 2) errores.nombre = "Escriba su nombre y apellido.";
  if (!telefonoValido(c.telefono)) errores.telefono = "Revise el número: de 7 a 15 dígitos, por ejemplo 0412-1234567.";
  if (c.correo.trim() && !correoValido(c.correo)) errores.correo = "Revise el correo, por ejemplo nombre@correo.com.";
  return errores;
}

/** Un paso del armado: tarjeta con número y título. El número es real, el
 * cliente recorre los pasos en orden. */
function Paso({ numero, titulo, children }: { numero?: number; titulo: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex flex-col gap-5 rounded-card border border-linea bg-card p-5 md:p-7">
      <h2 id={id} className="flex items-center gap-3 font-display text-2xl font-bold leading-tight text-ink">
        {numero ? (
          <span
            aria-hidden="true"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-pill bg-acento font-mono text-sm font-bold tabular-nums text-sobre-acento"
          >
            {numero}
          </span>
        ) : null}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

/** Nombre y WhatsApp a la vista; correo y comentarios plegados. Se pinta en el
 * resumen (escritorio y hoja) y en una tarjeta en móvil: todos los campos van
 * con `form` al mismo formulario y comparten estado. */
function DatosContacto({
  formId,
  contacto,
  errores,
  onCampo,
}: {
  formId: string;
  contacto: ContactoViaje;
  errores: Errores;
  onCampo: (clave: keyof ContactoViaje, valor: string) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const extra = abierto || !!errores.correo || !!contacto.correo || !!contacto.notas;
  return (
    <div className="flex flex-col gap-4">
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
      <Campo etiqueta="WhatsApp" requerido ayuda="Aquí le escribe el asesor con el precio confirmado." error={errores.telefono}>
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

export function CotizadorViaje({
  inicial,
  hotel: hotelInicial,
  ofertas,
}: {
  inicial: EstadoViaje;
  hotel: HotelCotizador | null;
  ofertas: OfertaHotel[];
}) {
  const formId = useId();
  const [estado, setEstado] = useState(inicial);
  const [detalles, setDetalles] = useState<Record<number, HotelDetalle | "error">>({});
  const [verHotel, setVerHotel] = useState<{ id: number; nombre: string } | null>(null);
  const [bloqueos, setBloqueos] = useState<{ clave: string; mapa: Map<number, Bloqueo[]> } | null>(null);
  const [contacto, setContacto] = useState(CONTACTO_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  const [verOtras, setVerOtras] = useState(false);
  // Ref, no state: un doble clic antes del próximo render vería el mismo
  // `enviando` y mandaría el lead dos veces.
  const enviandoRef = useRef(false);
  const primeraVez = useRef(true);

  const hospedaje = estado.servicios.includes("hospedaje");
  const vuelo = estado.servicios.includes("vuelo");
  const tours = estado.servicios.includes("tours");
  const ofertasDestino = ofertas.filter((o) => o.destino === estado.destino);
  const ofertaElegida = ofertas.find((o) => o.hotelId === estado.hotel);
  const otrasOfertas = ofertasDestino.filter((o) => o.hotelId !== estado.hotel);
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
      // Si la consulta falla no se bloquea nada: el asesor confirma disponibilidad igual.
      .catch(() => vivo && setBloqueos({ clave: claveBloqueo, mapa: new Map() }));
    return () => {
      vivo = false;
    };
  }, [claveBloqueo]);
  const mapaBloqueos = bloqueos && bloqueos.clave === claveBloqueo ? bloqueos.mapa : null;
  const sinDisponibilidad = (id: number) =>
    estado.desde && estado.hasta ? textoSinDisponibilidad(mapaBloqueos?.get(id), estado.desde, estado.hasta) : null;

  const detalleElegido = hotel ? detalles[hotel.id] : undefined;
  const tarifaElegida =
    detalleElegido && detalleElegido !== "error" ? (detalleElegido.tarifas.find((t) => t.id === estado.tarifa) ?? null) : null;
  const estadia: Estadia = {
    desde: estado.desde,
    hasta: estado.hasta,
    adultos: estado.adultos,
    edades: estado.edades.slice(0, estado.ninos),
    bebes: estado.bebes,
  };
  const hotelBloqueado = hospedaje && hotel ? sinDisponibilidad(hotel.id) : null;
  const estimado =
    hospedaje && tarifaElegida && detalleElegido && detalleElegido !== "error" && !hotelBloqueado
      ? estimarEstadia(tarifaElegida, detalleElegido.tarifas, estadia)
      : null;
  const habitacion = tarifaElegida?.habitacion ?? null;
  const elegido: HospedajeElegido = {
    habitacion,
    plan: tarifaElegida?.plan ?? null,
    estimado: estimado?.ok ? montoConMoneda(estimado.total, estimado.moneda) : null,
  };

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
    // Un hotel de otro destino no sigue elegido.
    setEstado(nuevo.destino === estado.destino ? nuevo : { ...nuevo, hotel: null, tarifa: null });
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
    if (!nuevos.fechas && hotelBloqueado) nuevos.fechas = `${hotel?.nombre}: ${hotelBloqueado.toLowerCase()}. Cambie las fechas o elija otro hotel.`;
    setErrores(nuevos);
    const primero = (["fechas", "nombre", "telefono", "correo"] as const).find((k) => nuevos[k]);
    if (primero) {
      setHojaAbierta(false);
      // Tras cerrar la hoja: el foco va al primer campo con error. Los campos
      // se pintan dos veces (resumen y tarjeta móvil): vale el que se ve.
      setTimeout(() => {
        const form = document.getElementById(formId) as HTMLFormElement | null;
        const destino =
          primero === "fechas"
            ? document.getElementById(`${formId}-fechas`)
            : (Array.from(form?.elements ?? []).find(
                (el): el is HTMLElement =>
                  el instanceof HTMLElement && el.getAttribute("name") === primero && el.getClientRects().length > 0,
              ) ?? null);
        destino?.focus({ preventScroll: true });
        destino?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 60);
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
      const solo = vuelo && !hospedaje && !tours;
      const asesorLocal = solo ? ASESOR_BOLETERIA : elegirAsesor();
      const base = armarCotizacionViaje(estado, datos, hotel, undefined, elegido);

      enviarASheetMonkey({
        destino: base.destino,
        servicio: base.servicio,
        pagina: "Arme su viaje",
        nombre: datos.nombre,
        procedencia: detectarProcedencia(),
        telefono: datos.telefono,
        asesor: asesorLocal.telefono,
      });

      let leadId: number | null = null;
      let asesor = asesorLocal;
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
        // Vuelo solo: siempre al asesor de boletería. Con hospedaje, el que asignó el CRM.
        asesor = solo ? asesorLocal : (asesorPorNombre(lead.asesor) ?? asesorLocal);
      } catch {
        fallo = true;
      }

      const final = armarCotizacionViaje(estado, datos, hotel, leadId ?? undefined, elegido);
      const mensaje = esInstagramInApp() ? final.mensajeTexto : final.mensajeEmoji;
      setEnviado({ waHref: `https://wa.me/${asesor.telefono}?text=${encodeURIComponent(mensaje)}`, leadId, fallo });
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
        >
          <div className="flex flex-col gap-3">
            {enviado.fallo ? (
              <Aviso>
                No pudimos registrar su solicitud en nuestro sistema. Envíela ahora por WhatsApp y un asesor la
                recibe directamente.
              </Aviso>
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
  const datos = <DatosContacto formId={formId} contacto={contacto} errores={errores} onCampo={campo} />;
  let paso = 1;
  const resumen = (conTitulo: boolean) => (
    <ResumenViaje
      estado={estado}
      hotel={hotel}
      habitacion={habitacion}
      estimado={estimado}
      formId={formId}
      enviando={enviando}
      conTitulo={conTitulo}
      datos={datos}
    />
  );
  const detalleVisto = verHotel ? detalles[verHotel.id] : undefined;
  const montoBarra = estimado?.ok ? montoConMoneda(estimado.total, estimado.moneda) : null;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
        <div className="flex min-w-0 flex-col gap-6 md:gap-8">
          <form id={formId} onSubmit={enviar} noValidate hidden />
          <Paso numero={paso} titulo="Su viaje">
            <BarraViaje estado={estado} onCambio={cambiar} />
            {errores.fechas ? (
              <Aviso>
                <span id={`${formId}-fechas`} tabIndex={-1}>
                  {errores.fechas}
                </span>
              </Aviso>
            ) : null}
          </Paso>

          {/* Móvil: los datos quedan a la vista enseguida, no al pie. En escritorio viven en el resumen. */}
          <div className="lg:hidden">
            <Paso titulo="Sus datos">{datos}</Paso>
          </div>

          {hospedaje ? (
            <Paso numero={++paso} titulo={`Hospedaje en ${estado.destino}`}>
              {hotel ? (
                <div className="flex flex-col gap-3 rounded-card border border-acento bg-card p-3 sm:flex-row sm:items-center">
                  {hotel.foto ? (
                    <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-control bg-sand-2">
                      <Image src={hotel.foto} alt="" fill sizes="112px" className="object-cover" />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1" aria-live="polite">
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
                        {estimado && !estimado.ok ? `${estimado.texto} ` : !estado.tarifa ? "Elija la habitación para ver el estimado. " : ""}
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
              {hotel && otrasOfertas.length ? (
                <Boton
                  variante="secundario"
                  tamano="sm"
                  className="self-start"
                  aria-expanded={verOtras}
                  onClick={() => setVerOtras((v) => !v)}
                >
                  {verOtras ? "Ocultar otras ofertas" : `Ver otras ofertas en ${estado.destino} (${otrasOfertas.length})`}
                </Boton>
              ) : null}
              {!hotel || verOtras ? (
                <OfertasHospedaje
                  ofertas={hotel ? otrasOfertas : ofertasDestino}
                  destino={estado.destino}
                  elegido={hotel?.id ?? null}
                  bloqueos={mapaBloqueos}
                  desde={estado.desde}
                  hasta={estado.hasta}
                  onVer={(o) => setVerHotel({ id: o.hotelId, nombre: o.nombre })}
                />
              ) : null}
              {!hotel && ofertasDestino.length ? (
                <p className="text-sm text-ink-soft">
                  ¿No encontró lo que busca? Escriba su presupuesto, plan o zona en los comentarios, junto al botón de
                  envío, y un asesor le propone opciones.
                </p>
              ) : null}
            </Paso>
          ) : null}

          {vuelo ? (
            <Paso numero={++paso} titulo="Vuelo">
              <div className="grid gap-4 sm:grid-cols-2">
                <Campo etiqueta="Desde">
                  {(a11y) => (
                    <Selector {...a11y} value={estado.origen} onChange={(ev) => cambiar({ ...estado, origen: ev.target.value })}>
                      {ORIGENES_VUELO.map((o) => (
                        <option key={o.valor} value={o.valor}>
                          {o.etiqueta}
                        </option>
                      ))}
                    </Selector>
                  )}
                </Campo>
                <div>
                  <p className="mb-1.5 text-sm font-semibold text-ink">Tipo de viaje</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        ["ida-vuelta", "Ida y vuelta"],
                        ["ida", "Solo ida"],
                      ] as const
                    ).map(([valor, etiqueta]) => (
                      <button
                        key={valor}
                        type="button"
                        aria-pressed={estado.vuelo === valor}
                        onClick={() => cambiar({ ...estado, vuelo: valor })}
                        className={chip(estado.vuelo === valor)}
                      >
                        {etiqueta}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-ink-soft">
                Las fechas y los pasajeros son los de su viaje. La cédula la solicita el asesor al confirmar.
              </p>
            </Paso>
          ) : null}

          {tours ? (
            <Paso numero={++paso} titulo={`Full day y tours en ${estado.destino}`}>
              <p className="text-ink-soft">
                Un asesor le propone los tours disponibles para sus fechas. Los full day son por grupo privado, con un
                mínimo de 15 personas.
              </p>
            </Paso>
          ) : null}

          {/* Móvil: el resumen vive en una hoja, así que el envío también queda al pie. */}
          <Boton type="submit" form={formId} tamano="lg" ancho cargando={enviando} className="lg:hidden">
            Enviar solicitud
          </Boton>
        </div>

        <aside aria-label="Su cotización" className="hidden lg:sticky lg:top-24 lg:block lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:overscroll-contain">
          {resumen(true)}
        </aside>
      </div>

      {/* Móvil: barra fija sobre la barra inferior; abre el resumen en una hoja. */}
      <button
        type="button"
        onClick={() => setHojaAbierta(true)}
        aria-haspopup="dialog"
        className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 flex min-h-14 items-center justify-between gap-3 bg-dusk px-5 text-left text-dusk-text lg:hidden"
      >
        <span className="text-sm font-semibold">
          Su cotización · {cantidad} {cantidad === 1 ? "servicio" : "servicios"}
          {nochesDe(estado) > 0 && hospedaje ? <span className="block text-xs font-normal text-dusk-text-soft">{textoDuracion(nochesDe(estado))}</span> : null}
        </span>
        <span className="flex items-center gap-2 font-mono text-base font-bold tabular-nums">
          {montoBarra ? <PrecioMostrado texto={montoBarra} /> : "A confirmar"}
          <Icono nombre="chevron-abajo" tamano={18} className="rotate-180" />
        </span>
      </button>

      <Hoja abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} titulo="Su cotización">
        <div className="p-4">{resumen(false)}</div>
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
              setVerOtras(false);
            }}
          />
        ) : null}
      </Hoja>
    </>
  );
}
