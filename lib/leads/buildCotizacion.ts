import type { Respuestas } from "@/components/cotizador/types";
import { calcularTotalFullDay } from "@/lib/fullday-pricing";

export interface ResultadoCotizacion {
  destino: string;
  servicio: string;
  personas: string;
  consulta: string;
  mensajeEmoji: string;
  mensajeTexto: string;
}

/** A line is [emoji-prefix, content] so both message variants (emoji for
 * normal browsers, plain "►" for Instagram's in-app browser, which
 * doesn't render emoji reliably) are built from the same data — no
 * regex-stripping of emoji from a single string. `false` skips the
 * line entirely (conditional fields). */
type Linea = [string, string] | false | null | undefined;

export function armarMensajes(titulo: string, lineas: Linea[], cierre?: string): { emoji: string; texto: string } {
  const validas = lineas.filter((l): l is [string, string] => Boolean(l));
  const emoji = [titulo, "", ...validas.map(([e, c]) => `${e} ${c}`), ...(cierre ? ["", cierre] : [])].join("\n");
  const texto = [
    titulo.replace(/[^\x00-\x7F]/gu, "").trim(),
    "",
    ...validas.map(([, c]) => `► ${c}`),
    ...(cierre ? ["", cierre.replace(/[^\x00-\x7F]/gu, "").trim()] : []),
  ].join("\n");
  return { emoji, texto };
}

function n(r: Respuestas, key: string, fallback = 0): number {
  const v = r[key];
  return typeof v === "number" ? v : v ? Number(v) : fallback;
}
function s(r: Respuestas, key: string, fallback = ""): string {
  const v = r[key];
  return typeof v === "string" && v ? v : fallback;
}

export function armarHospedaje(r: Respuestas): ResultadoCotizacion {
  const destino = s(r, "destino") === "Extranjero" ? s(r, "destinoOtro", "Extranjero") : s(r, "destino", s(r, "destinoOtro"));
  const adultos = n(r, "adultos", 1);
  const ninos = n(r, "ninos", 0);
  const noches =
    r.checkin && r.checkout
      ? Math.round((new Date(String(r.checkout)).getTime() - new Date(String(r.checkin)).getTime()) / 86400000)
      : null;
  const presupuesto = n(r, "presupuesto", 100);
  const presTexto = presupuesto >= 500 ? "Sin límite" : `$${presupuesto} USD`;
  const amenidades = (r.amenidades as string[]) ?? [];

  const { emoji: mensajeEmoji, texto: mensajeTexto } = armarMensajes(
    "🌟 *COTIZACIÓN HOSPEDAJE - DESTINO Y EVENTOS LOTUS 360*",
    [
      ["📍", `*Destino:* ${destino}`],
      ["👤", `*Nombre:* ${s(r, "nombre")}`],
      ["🏨", `*Alojamiento:* ${s(r, "alojamiento")}`],
      ["🍽️", `*Plan:* ${s(r, "plan")}`],
      r.checkin ? ["📅", `*Check-in:* ${r.checkin}`] : null,
      r.checkout ? ["📅", `*Check-out:* ${r.checkout}`] : null,
      noches != null ? ["🌙", `*Noches:* ${noches}`] : null,
      ["👥", `*Adultos:* ${adultos} | *Niños:* ${ninos}`],
      ninos > 0 ? ["👶", `*Edades niños:* ${s(r, "edadesNinos", "No especificadas")}`] : null,
      ["🛏️", `*Habitaciones:* ${s(r, "habitaciones", "1")}`],
      ["💰", `*Presupuesto/noche:* ${presTexto}`],
      amenidades.length > 0 ? ["✨", `*Preferencias:* ${amenidades.join(" · ")}`] : null,
      r.transporte === "traslado-aereo" ? ["✈️", `*Traslado aéreo desde:* ${s(r, "origenVuelo", "No especificado")}`] : null,
      r.ocasion && r.ocasion !== "Vacaciones" ? ["🎉", `*Ocasión:* ${r.ocasion}`] : null,
      s(r, "notas") ? ["📝", `*Notas:* ${r.notas}`] : null,
    ],
    "✅ *Enviar opciones. ¡Gracias!*",
  );

  return {
    destino,
    servicio: `${s(r, "alojamiento")} · ${s(r, "plan")}`,
    personas: `${adultos + ninos} persona(s)`,
    consulta: `${s(r, "alojamiento")} · ${s(r, "plan")}${r.notas ? ` · ${r.notas}` : ""}`,
    mensajeEmoji,
    mensajeTexto,
  };
}

export function armarBoleteria(r: Respuestas): ResultadoCotizacion {
  const origen = s(r, "origen") === "Otro" ? s(r, "origenOtro") : s(r, "origen", "Valencia");
  const destino = s(r, "destino") === "Otro" ? s(r, "destinoOtro") : s(r, "destino");
  const idaVuelta = r.tipoViaje !== "ida";
  const adultos = n(r, "adultos", 1);
  const ninos = n(r, "ninos", 0);
  const bebes = n(r, "bebes", 0);
  const equipaje = (r.equipaje as string[]) ?? [];
  const flex = n(r, "flexibilidad", 0);

  const { emoji: mensajeEmoji, texto: mensajeTexto } = armarMensajes(
    "✈️ *COTIZACIÓN DE VUELO - DESTINO Y EVENTOS LOTUS 360*",
    [
      ["👤", `*Nombre:* ${s(r, "nombre")}`],
      ["🔄", `*Tipo:* ${idaVuelta ? "Ida y Vuelta" : "Solo Ida"}`],
      ["📍", `*Origen:* ${origen}`],
      ["📍", `*Destino:* ${destino}`],
      r.fechaIda ? ["📅", `*Fecha ida:* ${r.fechaIda}`] : null,
      idaVuelta && r.fechaVuelta ? ["📅", `*Fecha vuelta:* ${r.fechaVuelta}`] : null,
      flex > 0 ? ["📆", `*Flexibilidad:* ±${flex} día(s)`] : ["📆", "*Fechas fijas*"],
      ["👥", `*Adultos:* ${adultos} | *Niños:* ${ninos} | *Bebés:* ${bebes}`],
      ninos > 0 ? ["👶", `*Edades:* ${s(r, "edadesNinos", "No especificadas")}`] : null,
      ["🧳", `*Equipaje:* ${equipaje.length ? equipaje.join(" + ") : "No especificado"}`],
      ["🆔", `*Cédulas adultos:* ${r.cedulaAdultos ? "Sí" : "No - REVISAR"}`],
      ninos > 0 ? ["🆔", `*Cédulas niños:* ${r.cedulaNinos ? "Sí" : "No - REVISAR"}`] : null,
      r.ocasion && r.ocasion !== "Viaje regular" ? ["🎉", `*Ocasión:* ${r.ocasion}`] : null,
      s(r, "notas") ? ["📝", `*Notas:* ${r.notas}`] : null,
    ],
    "✅ *Enviar opciones con precios. ¡Gracias!*",
  );

  return {
    destino: `${origen} → ${destino}`,
    servicio: idaVuelta ? "Ida y Vuelta" : "Solo Ida",
    personas: `${adultos + ninos} persona(s)`,
    consulta: `${idaVuelta ? "Ida y Vuelta" : "Solo Ida"}, fecha ${r.fechaIda ?? ""}${r.notas ? ` · ${r.notas}` : ""}`,
    mensajeEmoji,
    mensajeTexto,
  };
}

export function armarFullday(r: Respuestas, nombreProducto: string): ResultadoCotizacion {
  const adultos = n(r, "adultos", 15);
  const ninos = n(r, "ninos", 0);
  const grupo = adultos + ninos;
  const plan = r.plan === "full360" ? "PLAN FULL360" : "PLAN BÁSICO";
  const precio = r.plan === "full360" ? 35 : 25;
  const totalCalc = calcularTotalFullDay(nombreProducto, adultos, ninos);
  const total = totalCalc?.totalUsd ?? adultos * precio;
  const faltanGrupo = grupo < 15 ? 15 - grupo : 0;

  const { emoji: mensajeEmoji, texto: mensajeTexto } = armarMensajes("🌴 *RESERVA TOUR PRIVADO - DESTINO Y EVENTOS LOTUS 360*", [
    ["📍", `*Tour:* ${nombreProducto}`],
    ["🔒", "*Modalidad:* Privado por grupo (mín. 15 personas)"],
    ["🎫", `*Plan:* ${plan} ($${precio} por persona)`],
    ["👤", `*Responsable:* ${s(r, "nombre")}`],
    ["👥", `*Grupo:* ${grupo} persona(s) → ${adultos} adulto(s)${ninos > 0 ? ` + ${ninos} niño(s)` : ""}`],
    ninos > 0 ? ["👶", `*Edades niños:* ${s(r, "edadesNinos", "No especificadas")}`] : null,
    ["💰", `*Total estimado:* $${total} USD`],
    faltanGrupo > 0 ? ["⚠️", `*Nota:* Al grupo le faltan ${faltanGrupo} personas para el mínimo de 15.`] : null,
    s(r, "notas") ? ["📝", `*Notas:* ${r.notas}`] : null,
  ]);

  return {
    destino: nombreProducto,
    servicio: `${plan} · $${precio} · Grupo ${grupo}`,
    personas: `${grupo} persona(s)`,
    consulta: `${plan} · $${precio}${r.notas ? ` · ${r.notas}` : ""}`,
    mensajeEmoji,
    mensajeTexto,
  };
}

export function armarPaquete(r: Respuestas): ResultadoCotizacion {
  const adultos = n(r, "adultos", 1);
  const ninos = n(r, "ninos", 0);
  const destino = s(r, "destino");

  const { emoji: mensajeEmoji, texto: mensajeTexto } = armarMensajes(
    "🌍 *CONSULTA DE PAQUETE - DESTINO Y EVENTOS LOTUS 360*",
    [
      ["📍", `*Destino:* ${destino}`],
      ["👤", `*Nombre:* ${s(r, "nombre")}`],
      r.fechaAprox ? ["📅", `*Fecha aproximada:* ${r.fechaAprox}`] : null,
      ["👥", `*Adultos:* ${adultos} | *Niños:* ${ninos}`],
      ninos > 0 ? ["👶", `*Edades niños:* ${s(r, "edadesNinos", "No especificadas")}`] : null,
      s(r, "notas") ? ["📝", `*Notas:* ${r.notas}`] : null,
    ],
    "✅ *Enviar opciones. ¡Gracias!*",
  );

  return {
    destino,
    servicio: "Consulta de paquete",
    personas: `${adultos + ninos} persona(s)`,
    consulta: `Consulta de paquete${r.notas ? ` · ${r.notas}` : ""}`,
    mensajeEmoji,
    mensajeTexto,
  };
}

export function armarPersonalizado(r: Respuestas): ResultadoCotizacion {
  const destino = s(r, "destino") === "Extranjero" ? s(r, "destinoOtro", "Extranjero") : s(r, "destino", s(r, "destinoOtro"));
  const servicio = s(r, "tipoServicio", "No especificado");
  const adultos = n(r, "adultos", 1);
  const ninos = n(r, "ninos", 0);
  const presupuesto = n(r, "presupuesto", 500);
  // El slider (wizardConfig.ts, max:3000) muestra "Sin límite" en pantalla
  // al llegar al tope — el mensaje al asesor tiene que decir lo mismo, si
  // no el asesor recibe "$3000" como techo fijo en vez de "sin techo real".
  const presTexto = presupuesto >= 3000 ? "Sin límite" : `$${presupuesto} USD`;

  const { emoji: mensajeEmoji, texto: mensajeTexto } = armarMensajes(
    "🧭 *COTIZADOR PERSONALIZADO - DESTINO Y EVENTOS LOTUS 360*",
    [
      ["👤", `*Nombre:* ${s(r, "nombre")}`],
      ["🧳", `*Tipo de servicio:* ${servicio}`],
      ["📍", `*Destino:* ${destino}`],
      r.fechaAprox ? ["📅", `*Fecha aproximada:* ${r.fechaAprox}`] : null,
      ["👥", `*Adultos:* ${adultos} | *Niños:* ${ninos}`],
      ninos > 0 ? ["👶", `*Edades niños:* ${s(r, "edadesNinos", "No especificadas")}`] : null,
      ["💰", `*Presupuesto aproximado:* ${presTexto}`],
      s(r, "notas") ? ["📝", `*Notas:* ${r.notas}`] : null,
    ],
    "✅ *Armar propuesta a medida. ¡Gracias!*",
  );

  return {
    destino,
    servicio,
    personas: `${adultos + ninos} persona(s)`,
    consulta: `Cotizador personalizado: ${servicio}${r.notas ? ` · ${r.notas}` : ""}`,
    mensajeEmoji,
    mensajeTexto,
  };
}
