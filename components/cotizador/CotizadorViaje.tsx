"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { BarraViaje, chip } from "@/components/cotizador/BarraViaje";
import { ResumenViaje, textoFechas } from "@/components/cotizador/ResumenViaje";
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
import { armarCotizacionViaje, type ContactoViaje } from "@/lib/leads/buildCotizacion";
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

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-linea pt-6">
      <h2 className="font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{titulo}</h2>
      {children}
    </section>
  );
}

export function CotizadorViaje({ inicial, hotel: hotelInicial }: { inicial: EstadoViaje; hotel: HotelCotizador | null }) {
  const formId = useId();
  const [estado, setEstado] = useState(inicial);
  const [contacto, setContacto] = useState(CONTACTO_VACIO);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<Enviado | null>(null);
  const [hojaAbierta, setHojaAbierta] = useState(false);
  // Ref, no state: un doble clic antes del próximo render vería el mismo
  // `enviando` y mandaría el lead dos veces.
  const enviandoRef = useRef(false);
  const primeraVez = useRef(true);

  const hotel = hotelInicial && estado.hotel === hotelInicial.id ? hotelInicial : null;
  const hospedaje = estado.servicios.includes("hospedaje");
  const vuelo = estado.servicios.includes("vuelo");
  const tours = estado.servicios.includes("tours");

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
    setErrores(nuevos);
    const primero = (["fechas", "nombre", "telefono", "correo"] as const).find((k) => nuevos[k]);
    if (primero) {
      setHojaAbierta(false);
      // Tras cerrar la hoja: el foco va al primer campo con error.
      setTimeout(() => {
        const campoError =
          primero === "fechas"
            ? document.getElementById(`${formId}-fechas`)
            : (document.getElementById(formId) as HTMLFormElement | null)?.elements.namedItem(primero);
        const destino = campoError instanceof HTMLElement ? campoError : null;
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
      const base = armarCotizacionViaje(estado, datos, hotel);

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

      const final = armarCotizacionViaje(estado, datos, hotel, leadId ?? undefined);
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
  const resumen = (conTitulo: boolean) => (
    <ResumenViaje estado={estado} hotel={hotel} formId={formId} enviando={enviando} conTitulo={conTitulo} />
  );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start xl:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <BarraViaje estado={estado} onCambio={cambiar} />
          {errores.fechas ? (
            <Aviso>
              <span id={`${formId}-fechas`} tabIndex={-1}>
                {errores.fechas}
              </span>
            </Aviso>
          ) : null}

          {hospedaje ? (
            <Seccion titulo={`Hospedaje en ${estado.destino}`}>
              {hotel ? (
                <div className="flex items-center gap-4 rounded-card border border-linea bg-card p-3">
                  {hotel.foto ? (
                    <span className="relative h-20 w-28 shrink-0 overflow-hidden rounded-control bg-sand-2">
                      <Image src={hotel.foto} alt="" fill sizes="112px" className="object-cover" />
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{hotel.nombre}</p>
                    <p className="text-sm text-ink-soft">Precio a confirmar por el asesor.</p>
                  </div>
                  <Boton variante="fantasma" tamano="sm" onClick={() => cambiar({ ...estado, hotel: null, tarifa: null })}>
                    Quitar
                  </Boton>
                </div>
              ) : (
                <p className="text-ink-soft">
                  Aún no eligió un hotel. Cuéntenos abajo qué busca (plan, presupuesto, zona) y un asesor le propone
                  opciones con disponibilidad para sus fechas.
                </p>
              )}
            </Seccion>
          ) : null}

          {vuelo ? (
            <Seccion titulo="Vuelo">
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
            </Seccion>
          ) : null}

          {tours ? (
            <Seccion titulo={`Full day y tours en ${estado.destino}`}>
              <p className="text-ink-soft">
                Un asesor le propone los tours disponibles para sus fechas. Los full day son por grupo privado, con un
                mínimo de 15 personas.
              </p>
            </Seccion>
          ) : null}

          <Seccion titulo="Sus datos">
            <form id={formId} onSubmit={enviar} noValidate className="flex flex-col gap-4">
              <Campo etiqueta="Nombre y apellido" requerido error={errores.nombre}>
                {(a11y) => (
                  <Entrada
                    {...a11y}
                    name="nombre"
                    autoComplete="name"
                    value={contacto.nombre}
                    onChange={(ev) => campo("nombre", ev.target.value)}
                  />
                )}
              </Campo>
              <Campo
                etiqueta="WhatsApp"
                requerido
                ayuda="Un asesor le escribe a este número con el precio confirmado."
                error={errores.telefono}
              >
                {(a11y) => (
                  <Entrada
                    {...a11y}
                    name="telefono"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="0412-1234567"
                    value={contacto.telefono}
                    onChange={(ev) => campo("telefono", ev.target.value)}
                  />
                )}
              </Campo>
              <Campo etiqueta="Correo (opcional)" error={errores.correo}>
                {(a11y) => (
                  <Entrada
                    {...a11y}
                    name="correo"
                    type="email"
                    autoComplete="email"
                    value={contacto.correo}
                    onChange={(ev) => campo("correo", ev.target.value)}
                  />
                )}
              </Campo>
              <Campo etiqueta="¿Algo más que debamos saber?">
                {(a11y) => (
                  <AreaTexto
                    {...a11y}
                    name="notas"
                    placeholder="Presupuesto, plan, zona, celebración..."
                    maxLength={1000}
                    value={contacto.notas}
                    onChange={(ev) => campo("notas", ev.target.value)}
                  />
                )}
              </Campo>
              {/* Móvil: el resumen vive en una hoja, así que el envío también va al pie del formulario. */}
              <Boton type="submit" tamano="lg" ancho cargando={enviando} className="lg:hidden">
                Enviar solicitud
              </Boton>
            </form>
          </Seccion>
        </div>

        <aside aria-label="Su cotización" className="hidden lg:sticky lg:top-24 lg:block">
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
        <span className="flex items-center gap-2 font-mono text-base font-bold">
          A confirmar
          <Icono nombre="chevron-abajo" tamano={18} className="rotate-180" />
        </span>
      </button>

      <Hoja abierta={hojaAbierta} onCerrar={() => setHojaAbierta(false)} titulo="Su cotización">
        <div className="p-4">{resumen(false)}</div>
      </Hoja>
    </>
  );
}
