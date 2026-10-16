import assert from "node:assert/strict";
import { test } from "node:test";
import { estadoInicial, type EstadoViaje } from "@/lib/cotizador/estado";
import { armarCotizacionViaje, armarMensajes } from "./buildCotizacion.ts";

const contacto = { nombre: "María Peña", telefono: "04141234567", correo: "", notas: "" };
const viaje = (cambios: Partial<EstadoViaje>): EstadoViaje => ({
  ...estadoInicial(),
  destino: "Margarita",
  desde: "2026-11-12",
  hasta: "2026-11-15",
  adultos: 2,
  ...cambios,
});
// Fuera del BMP (surrogate pairs): lo que el navegador in-app de Instagram rompe.
const fueraDelBmp = /[\u{10000}-\u{10FFFF}]/u;

test("variante texto: conserva acentos y ñ, sin emoji", () => {
  const { texto } = armarMensajes("🛒 *SOLICITUD - COTIZACIÓN*", [["📍", "*Destino:* Mérida 🌄"]], "✅ ¡Gracias, señor!");
  assert.match(texto, /COTIZACIÓN/);
  assert.match(texto, /• \*Destino:\* Mérida$/m);
  assert.match(texto, /¡Gracias, señor!/);
  assert.doesNotMatch(texto, fueraDelBmp);
  assert.doesNotMatch(texto, /[►️]/u);
});

test("cotización: saludo al asesor, #lead en el título y fechas compactas", () => {
  const r = armarCotizacionViaje(viaje({}), contacto, { id: 77, nombre: "Hesperia" }, 4512, {}, [], null, "Ambar");
  const lineas = r.mensajeEmoji.split("\n");
  assert.equal(lineas[0], "Hola, Ambar. Le escribo por esta cotización de la web:");
  assert.equal(lineas[2], "*COTIZACIÓN DE VIAJE #4512*");
  assert.match(r.mensajeEmoji, /📅 \*Fechas:\* 12 al 15 de noviembre de 2026 \(3 noches\)/);
  assert.match(r.mensajeEmoji, /🏨 \*Hotel:\* Hesperia$/m);
  // El #id del hotel es interno: solo va al CRM.
  assert.doesNotMatch(r.mensajeEmoji, /#77/);
  assert.match(r.consulta, /Hesperia \(#77\)/);
  assert.doesNotMatch(r.mensajeEmoji, /🧭|🧳|🛏/u);
});

test("sin asesor conocido: saludo genérico", () => {
  const r = armarCotizacionViaje(viaje({}), contacto, null);
  assert.match(r.mensajeTexto, /^Hola\. Le escribo por esta cotización de la web:/);
  assert.doesNotMatch(r.mensajeTexto, fueraDelBmp);
});

test("vuelo en líneas cortas, no una sola línea larga", () => {
  const r = armarCotizacionViaje(
    viaje({ servicios: ["vuelo"], origen: "Caracas", vuelo: "ida-vuelta",equipaje: "maleta" }),
    contacto,
    null,
    undefined,
    {},
    [],
    { origenIata: "CCS", destino: "PMV", destinoNombre: "Porlamar", porPersona: 120, total: 240, cercano: false, bebesSinCosto: false } as never,
  );
  assert.match(r.mensajeEmoji, /✈️ \*Vuelo:\* Caracas \(CCS\) a Porlamar \(PMV\)\n {6}Ida y vuelta\n {6}1 maleta por persona\n {6}Aprox\. \$120 por persona \(\$240 total\)/u);
  assert.match(r.mensajeTexto, /• \*Vuelo:\* Caracas \(CCS\) a Porlamar \(PMV\)\n {3}Ida y vuelta/);
});

test("rango que cruza de mes y de año", () => {
  const mes = armarCotizacionViaje(viaje({ desde: "2026-11-28", hasta: "2026-12-02" }), contacto, null);
  assert.match(mes.consulta, /Fechas: 28 de noviembre al 2 de diciembre de 2026/);
  const anio = armarCotizacionViaje(viaje({ desde: "2026-12-30", hasta: "2027-01-02" }), contacto, null);
  assert.match(anio.consulta, /Fechas: 30 de diciembre de 2026 al 2 de enero de 2027/);
});
