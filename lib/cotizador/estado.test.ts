import assert from "node:assert/strict";
import { test } from "node:test";
import {
  alternarServicio,
  alternarTour,
  cambiarDesde,
  cambiarViajeros,
  correoValido,
  estadoInicial,
  fechasVuelo,
  parsearEstado,
  serializarEstado,
  telefonoValido,
} from "./estado.ts";

const HOY = "2026-09-25";

test("sin parametros devuelve el estado inicial", () => {
  assert.deepEqual(parsearEstado({}, HOY), estadoInicial());
});

test("ida y vuelta por URL conserva todo", () => {
  const e = parsearEstado(
    {
      servicios: "vuelo,hospedaje",
      destino: "Los Roques",
      fecha: "2026-10-12",
      hasta: "2026-10-16",
      adultos: "2",
      ninos: "2",
      edades: "4,9",
      bebes: "1",
      hotel: "254",
      origen: "Caracas",
      vuelo: "ida",
    },
    HOY,
  );
  assert.deepEqual(e.servicios, ["hospedaje", "vuelo"]);
  assert.equal(e.destino, "Los Roques");
  assert.deepEqual(e.edades, [4, 9]);
  assert.equal(e.hotel, 254);
  assert.equal(e.vuelo, "ida");
  assert.deepEqual(parsearEstado(Object.fromEntries(new URLSearchParams(serializarEstado(e))), HOY), e);
});

test("valores basura se descartan", () => {
  const e = parsearEstado(
    { servicios: "x,,y", destino: "Marte", fecha: "2020-01-01", hasta: "2026-10-01", adultos: "99", ninos: "9", hotel: "-3", origen: "Roma" },
    HOY,
  );
  assert.deepEqual(e, estadoInicial());
});

test("hasta no anterior ni igual a desde; sin desde valido no hay hasta", () => {
  assert.equal(parsearEstado({ fecha: "2026-10-12", hasta: "2026-10-12" }, HOY).hasta, "");
  assert.equal(parsearEstado({ fecha: "2026-10-12", hasta: "2026-10-10" }, HOY).hasta, "");
  assert.equal(parsearEstado({ fecha: "2026-01-01", hasta: "2026-10-20" }, HOY).hasta, "");
});

test("enlaces viejos: servicio legado y producto", () => {
  assert.deepEqual(parsearEstado({ servicio: "paquete" }, HOY).servicios, ["hospedaje", "vuelo"]);
  assert.deepEqual(parsearEstado({ servicio: "fullday" }, HOY).servicios, ["tours"]);
  assert.deepEqual(parsearEstado({ servicio: "vuelos" }, HOY).servicios, ["vuelo"]);
  assert.equal(parsearEstado({ producto: "77" }, HOY).hotel, 77);
});

test("edades faltantes se completan al largo de ninos", () => {
  assert.deepEqual(parsearEstado({ ninos: "3", edades: "7" }, HOY).edades, [7, 5, 5]);
  assert.deepEqual(parsearEstado({ ninos: "2", edades: "1,30" }, HOY).edades, [5, 5]);
});

test("siempre queda un servicio", () => {
  const e = estadoInicial();
  assert.equal(alternarServicio(e, "hospedaje"), e);
  assert.deepEqual(alternarServicio(e, "vuelo").servicios, ["hospedaje", "vuelo"]);
});

test("cambiar desde corre hasta conservando noches", () => {
  const e = { ...estadoInicial(), desde: "2026-10-12", hasta: "2026-10-16" };
  const n = cambiarDesde(e, "2026-10-20");
  assert.equal(n.hasta, "2026-10-24");
  assert.equal(cambiarDesde(e, "2026-10-13").hasta, "2026-10-16");
});

test("cambiar viajeros ajusta edades", () => {
  const e = cambiarViajeros({ ...estadoInicial(), ninos: 2, edades: [3, 8] }, { adultos: 2, ninos: 1, bebes: 0 });
  assert.deepEqual(e.edades, [3]);
});

test("contacto", () => {
  assert.ok(telefonoValido("0412-1234567"));
  assert.ok(telefonoValido("+58 412-1234567"));
  assert.ok(!telefonoValido("abc"));
  assert.ok(!telefonoValido("123"));
  assert.ok(correoValido("a@b.co"));
  assert.ok(!correoValido("a@b"));
});

test("vuelo: fechas propias, equipaje y flexibilidad viajan por URL", () => {
  const e = parsearEstado(
    { servicios: "hospedaje,vuelo", fecha: "2026-10-12", hasta: "2026-10-16", vuelo_ida: "2026-10-11", vuelo_vuelta: "2026-10-17", equipaje: "mano", flex: "1" },
    HOY,
  );
  assert.deepEqual(fechasVuelo(e), { ida: "2026-10-11", vuelta: "2026-10-17", propias: true });
  assert.equal(e.equipaje, "mano");
  assert.equal(e.flexible, true);
  assert.deepEqual(parsearEstado(Object.fromEntries(new URLSearchParams(serializarEstado(e))), HOY), e);
});

test("vuelo sin fechas propias copia las del viaje; solo ida no tiene vuelta", () => {
  const e = { ...estadoInicial(), servicios: ["hospedaje", "vuelo"] as const, desde: "2026-10-12", hasta: "2026-10-16" };
  assert.deepEqual(fechasVuelo({ ...e, servicios: [...e.servicios] }), { ida: "2026-10-12", vuelta: "2026-10-16", propias: false });
  assert.equal(fechasVuelo({ ...e, servicios: [...e.servicios], vuelo: "ida" }).vuelta, "");
});

test("vuelo: fechas propias invalidas se descartan; vuelta no anterior a la ida", () => {
  assert.equal(parsearEstado({ vuelo_ida: "2020-01-01", vuelo_vuelta: "2026-10-20" }, HOY).vueloHasta, "");
  assert.equal(parsearEstado({ vuelo_ida: "2026-10-12", vuelo_vuelta: "2026-10-10" }, HOY).vueloHasta, "");
  assert.equal(parsearEstado({ equipaje: "cuatro" }, HOY).equipaje, "maleta");
});

test("tours: se leen sin repetidos ni basura, tope de 6, y se alternan", () => {
  const e = parsearEstado({ servicios: "tours", tour: "5,5,abc,-2,7,8,9,10,11,12" }, HOY);
  assert.deepEqual(e.tours, [5, 7, 8, 9, 10, 11]);
  assert.deepEqual(alternarTour(estadoInicial(), 3).tours, [3]);
  assert.deepEqual(alternarTour({ ...estadoInicial(), tours: [3] }, 3).tours, []);
  assert.equal(alternarTour(e, 99), e);
  // Sin el servicio de tours marcado, los ids no viajan en la URL.
  assert.ok(!serializarEstado({ ...e, servicios: ["hospedaje"] }).includes("tour="));
});
