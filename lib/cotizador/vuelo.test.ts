import assert from "node:assert/strict";
import { test } from "node:test";
import { diasHasta, estimarVuelo, type EntradaVuelo } from "./vuelo.ts";

// Tarifas semilla reales de `vuelos_referencia` (2026-09-25): CCS-BOG 299, VLN-PZO 155.

const HOY = "2026-10-01";
const base: EntradaVuelo = { desdeUsd: 299, idaVuelta: true, fechaIda: "2026-10-31", hoy: HOY, adultos: 2, ninos: 0, bebes: 0 };

test("la tarifa ya trae el fee: sin recargo, por persona y total", () => {
  const r = estimarVuelo(base);
  assert.equal(r.porPersona, 299);
  assert.equal(r.total, 598);
  assert.equal(r.cercano, false);
  assert.deepEqual(r.aConfirmar, []);
});

test("a 20 días o menos marca cercano sin cambiar el precio", () => {
  const r = estimarVuelo({ ...base, fechaIda: "2026-10-11" });
  assert.equal(r.dias, 10);
  assert.equal(r.cercano, true);
  assert.equal(r.porPersona, 299);
});

test("borde: 20 días es cercano, 21 no", () => {
  assert.equal(estimarVuelo({ ...base, fechaIda: "2026-10-21" }).cercano, true);
  assert.equal(estimarVuelo({ ...base, fechaIda: "2026-10-22" }).cercano, false);
});

test("vuelo hoy es cercano", () => {
  assert.equal(estimarVuelo({ ...base, fechaIda: HOY }).cercano, true);
});

test("solo ida: mitad de la tarifa, redondeada hacia arriba", () => {
  assert.equal(estimarVuelo({ ...base, idaVuelta: false }).porPersona, 150);
  assert.equal(estimarVuelo({ ...base, idaVuelta: false, fechaIda: "2026-10-11" }).porPersona, 150);
});

test("ruta sin tarifa u Otro: a confirmar, nunca un número", () => {
  const r = estimarVuelo({ ...base, desdeUsd: null });
  assert.equal(r.porPersona, null);
  assert.equal(r.total, null);
  assert.deepEqual(r.aConfirmar, ["ruta"]);
});

test("fecha pasada: a confirmar", () => {
  const r = estimarVuelo({ ...base, fechaIda: "2026-09-01" });
  assert.equal(r.porPersona, null);
  assert.deepEqual(r.aConfirmar, ["fecha"]);
});

test("sin fecha: tarifa base, no cercano", () => {
  const r = estimarVuelo({ ...base, fechaIda: null });
  assert.equal(r.dias, null);
  assert.equal(r.cercano, false);
  assert.equal(r.porPersona, 299);
});

test("niños pagan asiento completo; bebés no suman", () => {
  const r = estimarVuelo({ ...base, adultos: 2, ninos: 1, bebes: 1 });
  assert.equal(r.total, 299 * 3);
  assert.equal(r.bebesSinCosto, true);
});

test("sin pasajeros con asiento no hay total", () => {
  assert.equal(estimarVuelo({ ...base, adultos: 0, ninos: 0 }).total, null);
});

test("redondeo: montos exactos no suben, centavos sí", () => {
  assert.equal(estimarVuelo({ ...base, desdeUsd: 155 }).porPersona, 155);
  assert.equal(estimarVuelo({ ...base, desdeUsd: 185.57 }).porPersona, 186);
});

test("diasHasta ignora fechas inválidas", () => {
  assert.equal(diasHasta("no-es-fecha", HOY), null);
  assert.equal(diasHasta(null, HOY), null);
});

// ---- rutas y estado del cotizador ----

import { estadoInicial, parsearEstado, serializarEstado, type EstadoViaje } from "./estado.ts";
import { destinosDeRutas, estimarVueloViaje, rutaParaFecha, type RutaVuelo } from "./vuelo.ts";

const ruta = (o: string, d: string, nombre: string, desde: number, ambito: RutaVuelo["ambito"] = "internacional"): RutaVuelo => ({
  origen_iata: o,
  origen_nombre: o,
  destino_iata: d,
  destino_nombre: nombre,
  ambito,
  desde_usd: desde,
  ida_vuelta: true,
});
const RUTAS = [ruta("CCS", "BOG", "Bogotá", 299), ruta("CCS", "PMV", "Margarita", 109, "nacional"), ruta("VLN", "PMV", "Margarita", 160, "nacional")];
const viaje = (e: Partial<EstadoViaje>): EstadoViaje => ({ ...estadoInicial(), servicios: ["vuelo"], ...e });

test("CCS-Bogotá, 2 adultos: $299 c/u a 30 o a 10 días", () => {
  const lejos = estimarVueloViaje(viaje({ origen: "Caracas", vueloDestino: "BOG", desde: "2026-10-31" }), RUTAS, HOY);
  assert.equal(lejos.porPersona, 299);
  assert.equal(lejos.total, 598);
  const cerca = estimarVueloViaje(viaje({ origen: "Caracas", vueloDestino: "BOG", desde: "2026-10-11" }), RUTAS, HOY);
  assert.equal(cerca.porPersona, 299);
  assert.equal(cerca.cercano, true);
});

test("Otro destino y ruta sin tarifa desde ese origen: a confirmar", () => {
  const otro = estimarVueloViaje(viaje({ origen: "Caracas", vueloDestino: "otro", vueloDestinoOtro: "Lima" }), RUTAS, HOY);
  assert.equal(otro.porPersona, null);
  assert.equal(otro.destinoNombre, "Lima");
  const sinRuta = estimarVueloViaje(viaje({ origen: "Valencia", vueloDestino: "BOG" }), RUTAS, HOY);
  assert.equal(sinRuta.destino, "BOG");
  assert.equal(sinRuta.porPersona, null);
});

test("el destino del viaje preselecciona la ruta; un IATA sin ruta se ignora", () => {
  const margarita = estimarVueloViaje(viaje({ origen: "Caracas", destino: "Isla de Margarita" }), RUTAS, HOY);
  assert.equal(margarita.destino, "PMV");
  assert.equal(margarita.porPersona, 109);
  assert.equal(estimarVueloViaje(viaje({ vueloDestino: "XYZ", destino: "Mérida" }), RUTAS, HOY).destino, "");
  assert.equal(estimarVueloViaje(viaje({ vueloDestino: "BOG" }), [], HOY).destino, "");
});

test("destinosDeRutas: únicos y ordenados", () => {
  assert.deepEqual(
    destinosDeRutas(RUTAS).map((d) => d.iata),
    ["BOG", "PMV"],
  );
});

test("temporada alta (Navidad): la fecha de ida elige la tarifa", () => {
  const conTemporada: RutaVuelo[] = [
    ruta("CCS", "PMV", "Margarita", 190, "nacional"),
    {
      ...ruta("CCS", "PMV", "Margarita", 395, "nacional"),
      temporada: "Navidad y Fin de Año 2026-27",
      temporada_desde: "2026-12-15",
      temporada_hasta: "2027-01-10",
    },
  ];
  assert.equal(rutaParaFecha(conTemporada, "CCS", "PMV", "2026-12-23")?.desde_usd, 395);
  assert.equal(rutaParaFecha(conTemporada, "CCS", "PMV", "2026-11-13")?.desde_usd, 190);
  assert.equal(rutaParaFecha(conTemporada, "CCS", "PMV", null)?.desde_usd, 190);
  assert.equal(rutaParaFecha(conTemporada, "VLN", "PMV", "2026-12-23"), null);
  // La ficha del cotizador usa la temporada cuando la ida cae adentro.
  const navidad = estimarVueloViaje(viaje({ origen: "Caracas", vueloDestino: "PMV", desde: "2026-12-23", hasta: "2026-12-26" }), conTemporada, HOY);
  assert.equal(navidad.porPersona, 395);
  const baja = estimarVueloViaje(viaje({ origen: "Caracas", vueloDestino: "PMV", desde: "2026-11-13", hasta: "2026-11-16" }), conTemporada, HOY);
  assert.equal(baja.porPersona, 190);
  // El selector de destinos no duplica la ruta por tener dos tarifas.
  assert.deepEqual(destinosDeRutas(conTemporada).map((d) => d.iata), ["PMV"]);
});

test("vdestino y vdestino_otro viajan por la URL con topes", () => {
  const e = parsearEstado({ servicios: "vuelo", vdestino: "otro", vdestino_otro: "  Lima\u0000 Perú " + "x".repeat(80) }, HOY);
  assert.equal(e.vueloDestino, "otro");
  assert.equal(e.vueloDestinoOtro.length, 60);
  assert.ok(e.vueloDestinoOtro.startsWith("Lima Perú"));
  assert.equal(parsearEstado({ vdestino: "bog" }, HOY).vueloDestino, "");
  assert.equal(parsearEstado({ vdestino: "BOG", vdestino_otro: "Lima" }, HOY).vueloDestinoOtro, "");
  const q = new URLSearchParams(serializarEstado({ ...e, vueloDestinoOtro: "Lima" }));
  assert.equal(q.get("vdestino"), "otro");
  assert.equal(q.get("vdestino_otro"), "Lima");
});
