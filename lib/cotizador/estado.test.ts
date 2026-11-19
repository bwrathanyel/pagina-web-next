import assert from "node:assert/strict";
import { test } from "node:test";
import {
  conVueloAlExtranjero,
  DESTINO_EXTRANJERO,
  alternarServicio,
  alternarTour,
  atajosFinde,
  cambiarDesde,
  cambiarViajeros,
  correoValido,
  estadoInicial,
  fechasVuelo,
  leerVueloPedido,
  parsearEstado,
  ponerVuelo,
  rutaCotizar,
  serializarEstado,
  telefonoValido,
  textoRangoCorto,
  vueloATexto,
  vueloDeTexto,
} from "./estado.ts";

const HOY = "2026-09-25";

test("atajos de fin de semana: viernes a domingo con 2 dias de anticipacion", () => {
  // Miércoles: este mismo viernes.
  assert.deepEqual(atajosFinde("2026-10-14"), [
    { desde: "2026-10-16", hasta: "2026-10-18" },
    { desde: "2026-10-23", hasta: "2026-10-25" },
  ]);
  // Jueves y viernes ya no llegan: pasa al siguiente.
  assert.equal(atajosFinde("2026-10-15")[0].desde, "2026-10-23");
  assert.equal(atajosFinde("2026-10-16")[0].desde, "2026-10-23");
  // Sábado y domingo: el viernes que viene.
  assert.equal(atajosFinde("2026-10-17")[0].desde, "2026-10-23");
  assert.equal(atajosFinde("2026-10-18")[0].desde, "2026-10-23");
  // Los atajos son fechas válidas para la URL.
  const [a] = atajosFinde("2026-10-16");
  const e = parsearEstado({ fecha: a.desde, hasta: a.hasta }, "2026-10-16");
  assert.equal(e.desde, a.desde);
  assert.equal(e.hasta, a.hasta);
});

test("rango corto de los atajos", () => {
  assert.equal(textoRangoCorto("2026-10-23", "2026-10-25"), "vie 23 – dom 25 oct");
  assert.equal(textoRangoCorto("2026-10-30", "2026-11-01"), "vie 30 oct – dom 1 nov");
});

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
  assert.deepEqual(parsearEstado({ ninos: "3", edades: "7" }, HOY).edades, [7, null, null]);
  assert.deepEqual(parsearEstado({ ninos: "2", edades: "1,30" }, HOY).edades, [null, null]);
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

test("B-03: un niño sin edad elegida sigue sin edad al ida y vuelta por la URL", () => {
  const e = parsearEstado({ ninos: "3", edades: "7,,9" }, HOY);
  assert.deepEqual(e.edades, [7, null, 9]);
  assert.deepEqual(parsearEstado(Object.fromEntries(new URLSearchParams(serializarEstado(e))), HOY).edades, [7, null, 9]);
  assert.deepEqual(cambiarViajeros(e, { adultos: 2, ninos: 4, bebes: 0 }).edades, [7, null, 9, null]);
});

test("combinar: segundo destino conocido y distinto del principal; ida y vuelta", () => {
  const e = parsearEstado({ destino: "Morrocoy", combinar: "Los Roques" }, HOY);
  assert.equal(e.combinar, "Los Roques");
  assert.deepEqual(parsearEstado(Object.fromEntries(new URLSearchParams(serializarEstado(e))), HOY), e);
  assert.equal(parsearEstado({ destino: "Morrocoy", combinar: "Morrocoy" }, HOY).combinar, "");
  assert.equal(parsearEstado({ destino: "Morrocoy", combinar: "Narnia" }, HOY).combinar, "");
  assert.ok(!serializarEstado({ ...e, combinar: "" }).includes("combinar="));
});

test("vuelo pedido en /cotizar viaja a /reservar con origen, tipo, fechas propias, equipaje y flex", () => {
  const e = {
    ...estadoInicial(),
    servicios: ["hospedaje", "vuelo"] as const,
    origen: "Caracas",
    vuelo: "ida" as const,
    vueloDesde: "2026-11-26",
    vueloHasta: "",
    equipaje: "maleta" as const,
    flexible: true,
  };
  const q = new URLSearchParams({ hotel: "4", desde: "2026-11-26", hasta: "2026-11-30" });
  ponerVuelo(q, e);
  const sp = Object.fromEntries(q.entries());
  assert.deepEqual(leerVueloPedido(sp, HOY), {
    origen: "Caracas", vuelo: "ida", vueloDesde: "2026-11-26", vueloHasta: "", equipaje: "maleta", flexible: true,
  });
  // Sin `vuelo=` el enlace no trae boleto (solo hospedaje).
  assert.equal(leerVueloPedido({ hotel: "4", desde: "2026-11-26" }, HOY), null);
});

test("boleto de /reservar ida y vuelta por texto (sessionStorage)", () => {
  const v = { origen: "Caracas", vuelo: "ida-vuelta", vueloDesde: "2026-11-26", vueloHasta: "2026-11-30", equipaje: "maleta", flexible: true } as const;
  assert.deepEqual(vueloDeTexto(vueloATexto(v), HOY), v);
  assert.equal(vueloDeTexto("", HOY), null);
  assert.equal(vueloDeTexto(null, HOY), null);
  assert.equal(vueloDeTexto("hotel=4", HOY), null);
});

test("rutaCotizar: el hotel pasa a la ruta y el resto queda en la query", () => {
  assert.equal(rutaCotizar("hotel=12&destino=Isla+de+Margarita&adultos=2", "hesperia-isla-margarita"), "/cotizar/hesperia-isla-margarita?destino=Isla+de+Margarita&adultos=2");
  assert.equal(rutaCotizar("hotel=12", "hesperia-isla-margarita"), "/cotizar/hesperia-isla-margarita");
  assert.equal(rutaCotizar("hotel=12&adultos=2", null), "/cotizar?hotel=12&adultos=2");
  assert.equal(rutaCotizar("", undefined), "/cotizar");
});

test("extranjero: la solicitud va y vuelve por la URL, solo con ese destino", () => {
  const e = parsearEstado(
    {
      destino: "Extranjero",
      ext_pais: "Punta Cana",
      ext_ideas: "1",
      ext_tipo: "playa,luna-de-miel,nada,playa",
      ext_ppto: "1500",
      ext_salida: "otra",
      ext_salida_otra: "Barquisimeto",
      ext_extras: "seguro,visa,x",
    },
    HOY,
  );
  assert.deepEqual(e.ext, {
    pais: "Punta Cana",
    ideas: false,
    tipos: ["playa", "luna-de-miel"],
    presupuesto: "1500",
    salida: "otra",
    salidaOtra: "Barquisimeto",
    extras: ["seguro", "visa"],
  });
  assert.deepEqual(parsearEstado(Object.fromEntries(new URLSearchParams(serializarEstado(e))), HOY).ext, e.ext);
  assert.doesNotMatch(serializarEstado({ ...e, destino: "Morrocoy" }), /ext_/);
  const ideas = parsearEstado({ destino: "Extranjero", ext_ideas: "1", ext_ppto: "99", ext_salida: "Lima" }, HOY).ext;
  assert.equal(ideas.ideas, true);
  assert.equal(ideas.presupuesto, "");
  assert.equal(ideas.salida, "");
});

test("Viajar al extranjero marca el vuelo sin quitar los otros servicios", () => {
  assert.deepEqual(conVueloAlExtranjero(["hospedaje"], DESTINO_EXTRANJERO), ["hospedaje", "vuelo"]);
  assert.deepEqual(conVueloAlExtranjero(["vuelo", "tours"], DESTINO_EXTRANJERO), ["vuelo", "tours"]);
  assert.deepEqual(conVueloAlExtranjero(["hospedaje"], "Isla de Margarita"), ["hospedaje"]);
});
