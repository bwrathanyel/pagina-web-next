import { asesorAsignado, nombreDePila } from "@/lib/asesores";
import type { EstadoViaje } from "@/lib/cotizador/estado";
import type { VueloViaje } from "@/lib/cotizador/vuelo";
import { armarCotizacionViaje, type ContactoViaje, type HospedajeElegido } from "@/lib/leads/buildCotizacion";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { enviarASheetMonkey } from "@/lib/leads/sheetMonkey";
import { buscarPais, telefonoInternacional } from "@/lib/paises";
import { detectarProcedencia, esInstagramInApp } from "@/lib/utils/procedencia";
import { NUMERO_CORPORATIVO } from "@/lib/whatsapp";

export type CotizacionEnviada = { waHref: string; leadId: number | null; fallo: boolean; asesorNombre: string | null };

/** Envío de una cotización de viaje (el de /cotizar, y el del boleto en /reservar): lead al CRM, reporte
 * y WhatsApp al asesor que asignó el reparto. Con el CRM caído no lanza: `fallo` y número corporativo. */
export async function enviarCotizacionViaje({
  estado,
  contacto,
  iso,
  hotel,
  elegido,
  nombresTours = [],
  vueloViaje,
  pagina,
}: {
  estado: EstadoViaje;
  contacto: ContactoViaje;
  iso: string;
  hotel: { id: number; nombre: string } | null;
  elegido?: HospedajeElegido;
  nombresTours?: string[];
  vueloViaje: VueloViaje | null;
  /** Nombre de la página en el reporte («Arme su viaje», «Reservar - boleto»). */
  pagina: string;
}): Promise<CotizacionEnviada> {
  const datos: ContactoViaje = {
    nombre: contacto.nombre.trim(),
    telefono: telefonoInternacional(buscarPais(iso), contacto.telefono) ?? contacto.telefono.trim(),
    correo: contacto.correo.trim(),
    notas: contacto.notas.trim(),
  };
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
    pagina,
    nombre: datos.nombre,
    procedencia: detectarProcedencia(),
    telefono: datos.telefono,
    asesor: telefonoAsesor,
  });

  const final = armarCotizacionViaje(estado, datos, hotel, leadId ?? undefined, elegido, nombresTours, vueloViaje, asesorNombre);
  const mensaje = esInstagramInApp() ? final.mensajeTexto : final.mensajeEmoji;
  return { waHref: `https://wa.me/${telefonoAsesor}?text=${encodeURIComponent(mensaje)}`, leadId, fallo, asesorNombre };
}
