"use client";

import { useId, useState } from "react";
import { SeccionVuelo } from "@/components/cotizador/SeccionVuelo";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { CLASE_CONTROL, Campo, Entrada } from "@/components/ui/Campo";
import { Hoja } from "@/components/ui/Hoja";
import { Icono } from "@/components/ui/Icono";
import { SelectorFecha } from "@/components/ui/SelectorFecha";
import { TelefonoPais } from "@/components/ui/TelefonoPais";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { esDestinoCompraDirecta } from "@/lib/checkout/destinos";
import { estadoInicial, hoyCaracas, sumarDias, type EstadoViaje } from "@/lib/cotizador/estado";
import { listaNatural, nombreDia, recomendacionDia, rutasHacia, type RutaAerea } from "@/lib/cotizador/guiaRutas";
import { estimarVueloViaje, type RutaVuelo } from "@/lib/cotizador/vuelo";
import { enviarCotizacionViaje, type CotizacionEnviada } from "@/lib/leads/enviarCotizacionViaje";
import { PAIS_POR_DEFECTO, buscarPais, telefonoInternacional } from "@/lib/paises";
import type { Reserva } from "./useReserva";

const CONTROL_BOTON = `${CLASE_CONTROL} min-h-12 py-2.5 cursor-pointer`;

// La compra directa solo vende Margarita (lib/checkout/destinos.ts): ese es el destino del vuelo.
const DESTINO_VUELO = { destino: "Isla de Margarita", iata: "PMV" } as const;

type Errores = Partial<Record<"fechas" | "nombre" | "telefono", string>>;

function estadoDesdeReserva(r: Pick<Reserva, "desde" | "hasta" | "pasajeros">): EstadoViaje {
  const edades = r.pasajeros.edades;
  return {
    ...estadoInicial(),
    servicios: ["vuelo"],
    destino: DESTINO_VUELO.destino,
    vueloDestino: DESTINO_VUELO.iata,
    desde: r.desde,
    hasta: r.hasta,
    adultos: r.pasajeros.adultos,
    ninos: edades.length,
    edades,
    bebes: r.pasajeros.bebes,
  };
}

/** «Para su llegada el miércoles 25: desde Caracas suelen volar …; desde Valencia no suelen salir vuelos ese día.» */
function avanceLlegada(guia: readonly RutaAerea[], fecha: string): string | null {
  if (!fecha) return null;
  const partes = rutasHacia(guia, DESTINO_VUELO.iata)
    .map((g) => {
      const rec = recomendacionDia(guia, g.origenIata, DESTINO_VUELO.iata, fecha);
      if (!rec) return null;
      return rec.tipo === "hay"
        ? `desde ${g.origenNombre} suelen volar ${listaNatural(rec.aerolineas)}`
        : `desde ${g.origenNombre} no suelen salir vuelos ese día`;
    })
    .filter((p): p is string => p !== null);
  if (!partes.length) return null;
  const d = new Date(`${fecha}T00:00:00Z`);
  return `Para su llegada el ${nombreDia(d.getUTCDay())} ${d.getUTCDate()}: ${partes.join("; ")}.`;
}

/** Boleto aéreo desde /reservar: el hospedaje se paga aquí; el boleto se pide aparte, con el mismo
 * lead que /cotizar (enviarCotizacionViaje), y lo cuadra el asesor. Su formulario vive en una Hoja
 * (portal) y no toca el estado de la reserva ni su envío. */
export function BoletoAereo({
  r,
  destino,
  hotelNombre,
  rutas,
  guia,
  className,
}: {
  r: Pick<Reserva, "f" | "desde" | "hasta" | "pasajeros">;
  destino: string | null;
  hotelNombre: string;
  rutas: readonly RutaVuelo[];
  guia: readonly RutaAerea[];
  className?: string;
}) {
  const id = useId();
  const formId = `${id}-boleto`;
  const [abierta, setAbierta] = useState(false);
  const [estado, setEstado] = useState<EstadoViaje>(() => estadoDesdeReserva(r));
  const [contacto, setContacto] = useState({ nombre: "", telefono: "", iso: PAIS_POR_DEFECTO });
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState<CotizacionEnviada | null>(null);

  if (!esDestinoCompraDirecta(destino)) return null;
  const vuelo = estimarVueloViaje(estado, rutas, hoyCaracas());
  const avance = avanceLlegada(guia, r.desde);
  const idaVuelta = estado.vuelo === "ida-vuelta";

  function abrir() {
    // Cada apertura parte de lo que el cliente tiene en la reserva (fechas, viajeros y sus datos).
    if (!enviado) {
      setEstado((e) => ({ ...estadoDesdeReserva(r), origen: e.origen, vuelo: e.vuelo, equipaje: e.equipaje, flexible: e.flexible }));
      setContacto((c) => ({
        nombre: c.nombre || r.f.nombre,
        telefono: c.telefono || r.f.telefono,
        iso: c.telefono ? c.iso : r.f.iso || c.iso,
      }));
      setErrores({});
    }
    setAbierta(true);
  }

  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    // La Hoja va por portal, pero el evento de React sube igual hasta el <form> de la reserva.
    ev.preventDefault();
    ev.stopPropagation();
    if (enviando) return;
    const nuevos: Errores = {};
    if (!estado.desde) nuevos.fechas = "Elija la fecha de ida del vuelo.";
    else if (idaVuelta && !estado.hasta) nuevos.fechas = "Elija también la fecha de vuelta, o marque solo ida.";
    if (contacto.nombre.trim().length < 2) nuevos.nombre = "Escriba su nombre y apellido.";
    if (!telefonoInternacional(buscarPais(contacto.iso), contacto.telefono)) nuevos.telefono = "Revise el número y el país, por ejemplo 0412 1234567.";
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    setEnviando(true);
    try {
      setEnviado(
        await enviarCotizacionViaje({
          estado,
          contacto: { nombre: contacto.nombre, telefono: contacto.telefono, correo: r.f.email ?? "", notas: `Pide el boleto desde la reserva directa de ${hotelNombre}.` },
          iso: contacto.iso,
          hotel: null,
          vueloViaje: vuelo,
          pagina: "Reservar - boleto",
        }),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    // Teléfono: encabezado con ícono y tarjeta debajo. lg: una sola franja baja (ícono, título, texto y botón
    // en fila) entre la cabecera y el mostrador, para que se vea en la primera pantalla.
    <section
      aria-labelledby={`${id}-titulo`}
      className={`flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4 lg:rounded-card lg:border lg:border-linea lg:bg-card lg:px-4 lg:py-2.5 ${className ?? ""}`}
    >
      <div className="flex shrink-0 items-center gap-3">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-pill border border-linea-fuerte text-ink">
          <Icono nombre="avion" tamano={16} />
        </span>
        <h2 id={`${id}-titulo`} className="min-w-0 flex-1 font-display text-xl font-bold text-ink lg:text-base">
          Boleto aéreo
        </h2>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-3 rounded-card border border-linea p-4 md:flex-row md:items-center md:justify-between md:gap-6 md:p-5 lg:rounded-none lg:border-0 lg:border-l lg:p-0 lg:pl-4">
        <div className="flex min-w-0 flex-col gap-1 lg:gap-0.5">
          <p className="text-sm font-semibold text-ink lg:hidden">¿Necesita también el boleto aéreo?</p>
          <p className="text-sm text-ink-soft lg:text-ink">
            <span className="max-lg:hidden">¿Necesita también el boleto? </span>Pague su hospedaje ahora; el boleto se lo cotiza un asesor de boletería.
          </p>
          {avance ? <p className="text-sm text-ink-soft lg:text-xs">{avance}</p> : null}
        </div>
        <Boton type="button" variante="secundario" className="shrink-0 self-start md:self-center" aria-haspopup="dialog" onClick={abrir}>
          {enviado ? "Ver solicitud del boleto" : "Cotizar boleto aéreo"}
        </Boton>
      </div>

      <Hoja abierta={abierta} onCerrar={() => setAbierta(false)} titulo="Boleto aéreo" anchoClassName="lg:max-w-lg">
        {enviado ? (
          <div className="flex flex-col gap-4">
            <Aviso tono="info">
              {enviado.fallo
                ? "No pudimos registrar la solicitud. Envíela por WhatsApp y un asesor la atiende."
                : `Solicitud${enviado.leadId ? ` #${enviado.leadId}` : ""} registrada. Envíela por WhatsApp para que el asesor la vea ya.`}
            </Aviso>
            <Boton href={enviado.waHref} target="_blank" rel="noopener noreferrer" variante="whatsapp" ancho iconoInicio={<WhatsAppIcon size={20} />}>
              {enviado.asesorNombre ? `Enviar a ${enviado.asesorNombre}` : "Enviar por WhatsApp"}
            </Boton>
            <p className="text-sm text-ink-soft">Su reserva sigue abierta: puede terminar el pago del hospedaje.</p>
          </div>
        ) : (
          <form id={formId} onSubmit={enviar} noValidate className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo etiqueta="Ida del vuelo" error={errores.fechas}>
                {() => (
                  <SelectorFecha
                    id={`${id}-ida`}
                    name="boleto_ida"
                    etiqueta="Ida del vuelo"
                    valor={estado.desde}
                    onCambio={(iso) => setEstado((e) => ({ ...e, desde: iso, hasta: e.hasta && e.hasta <= iso ? "" : e.hasta }))}
                    rango={idaVuelta && estado.hasta ? { desde: estado.desde, hasta: estado.hasta } : undefined}
                    vacio="Elegir fecha"
                    className={CONTROL_BOTON}
                  />
                )}
              </Campo>
              {idaVuelta ? (
                <Campo etiqueta="Vuelta del vuelo">
                  {() => (
                    <SelectorFecha
                      id={`${id}-vuelta`}
                      name="boleto_vuelta"
                      etiqueta="Vuelta del vuelo"
                      valor={estado.hasta}
                      min={estado.desde ? sumarDias(estado.desde, 1) : undefined}
                      onCambio={(iso) => setEstado((e) => ({ ...e, hasta: iso }))}
                      rango={estado.desde && estado.hasta ? { desde: estado.desde, hasta: estado.hasta } : undefined}
                      vacio="Elegir fecha"
                      className={CONTROL_BOTON}
                    />
                  )}
                </Campo>
              ) : null}
            </div>

            <SeccionVuelo
              estado={estado}
              rutas={rutas}
              guia={guia}
              vuelo={vuelo}
              errorId={`${id}-vuelo`}
              onCambio={setEstado}
              ayudaFechas="Las fechas del vuelo se eligen arriba; parten de las de su hospedaje."
            />

            <div className="flex flex-col gap-4 border-t border-dashed border-linea-fuerte pt-4">
              <Campo etiqueta="Nombre y apellido" error={errores.nombre} requerido>
                {(a) => (
                  <Entrada {...a} value={contacto.nombre} onChange={(e) => setContacto((c) => ({ ...c, nombre: e.target.value }))} autoComplete="name" maxLength={80} />
                )}
              </Campo>
              <Campo etiqueta="Teléfono (WhatsApp)" error={errores.telefono} requerido>
                {(a) => (
                  <TelefonoPais
                    {...a}
                    iso={contacto.iso}
                    onIso={(iso) => setContacto((c) => ({ ...c, iso }))}
                    valor={contacto.telefono}
                    onValor={(v) => setContacto((c) => ({ ...c, telefono: v }))}
                  />
                )}
              </Campo>
            </div>

            <Boton type="submit" variante="primario" ancho cargando={enviando}>
              Pedir cotización del boleto
            </Boton>
          </form>
        )}
      </Hoja>
    </section>
  );
}
