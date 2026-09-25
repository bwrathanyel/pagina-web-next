import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa, TarifarioBloque } from "@/types/supabase";
import { estimarEstadia, nochesDeEstadia, type Estadia } from "./estimado.ts";

// Filas calcadas del tarifario real (2026-09-25): Costa Caribe (producto 1),
// LD Palm Beach (4, en euros) y Venetur (254).

const bloque = (b: Partial<TarifarioBloque>): TarifarioBloque =>
  ({
    id: 1,
    plan: null,
    base_precio: null,
    incluye: null,
    check_in: null,
    check_out: null,
    ocupacion: null,
    ninos: null,
    suplementos: null,
    minimo_noches: null,
    impuestos: null,
    otras: null,
    ...b,
  }) as TarifarioBloque;

const fila = (t: Partial<Tarifa> & { id: number }): Tarifa =>
  ({ precio_texto: "", precio_desde_usd: null, vigencia_texto: null, vigente: true, moneda: "USD", ...t }) as Tarifa;

const v = (desde: string, hasta: string) => [{ desde, hasta }];

const BLOQUE_CARIBE = bloque({
  ninos: { chd_desde: 4, chd_hasta: 10 },
  suplementos: [{ adt: 75, chd: 45, temporada: "SUPLEMENTO OBLIGATORIO: CENA DE NAVIDAD (24 DICIEMBRE)", obligatorio: true }],
});
const caribe = (id: number, titulo: string, dbl: number, sgl: number, chd: number, ventana: [string, string], minimo: number | null) =>
  fila({
    id,
    titulo,
    habitacion: "STANDARD ROOM",
    precios: { cdp: null, dbl, sgl, tpl: dbl, chd_4_10: chd },
    minimo_noches: minimo,
    ventanas: v(...ventana),
    tarifario_bloques: BLOQUE_CARIBE,
  });
const CARIBE = [
  caribe(52295, "NAVIDAD", 80, 120, 48, ["2026-12-20", "2026-12-26"], 3),
  caribe(52297, "FIN DE AÑO", 110, 165, 66, ["2026-12-27", "2027-01-09"], 4),
  caribe(52301, "TEMPORADA BAJA 2027", 60, 90, 36, ["2027-02-10", "2027-03-18"], null),
];

const BLOQUE_PALM = bloque({ id: 2, ninos: { chd_desde: 4, chd_hasta: 10 } });
const palm = (id: number, titulo: string, dbl: number, sgl: number, ventanas: Tarifa["ventanas"], extra: Partial<Tarifa> = {}) =>
  fila({
    id,
    titulo,
    plan: "TODO INCLUIDO",
    habitacion: "SUPERIOR",
    moneda: "EUR",
    precios: { cdp: dbl, dbl, sgl, tpl: dbl, chd_4_10: Math.round(dbl / 2) },
    ventanas,
    tarifario_bloques: BLOQUE_PALM,
    ...extra,
  });
const PALM = [
  palm(52329, "TEMPORADA BAJA", 75, 95, v("2026-09-16", "2026-12-21")),
  palm(52330, "PREVENTA NAVIDAD", 100, 125, v("2026-12-22", "2026-12-26"), { minimo_noches: 3 }),
  // Sin ventanas y solo con fecha de fin: abierta hacia atrás, la menos específica.
  palm(52332, "TEMPORADA BAJA", 75, 115, [], { fecha_fin: "2027-02-04" }),
];

const BLOQUE_VENETUR = bloque({ id: 3 });
const VENETUR_PERSONA = fila({
  id: 52430,
  titulo: "TEMPORADA BAJA",
  habitacion: "HOTELERA",
  precios: { cpl: 55, dbl: 60, sgl: 72, tpl: 58, chd_4_9: 30 },
  ventanas: v("2026-09-16", "2026-12-15"),
  tarifario_bloques: BLOQUE_VENETUR,
});
const VENETUR_HABITACION = fila({
  id: 52435,
  titulo: "TEMPORADA BAJA",
  habitacion: "HOTELERA",
  precios: { cpl: 85, dbl: 65, sgl: 55, tpl: 75, chd_4_9: 20 },
  ventanas: v("2026-09-16", "2026-12-15"),
  tarifario_bloques: BLOQUE_VENETUR,
});
const VENETUR = [VENETUR_PERSONA, VENETUR_HABITACION];

const estadia = (desde: string, hasta: string, adultos = 2, edades: number[] = [], bebes = 0): Estadia => ({
  desde,
  hasta,
  adultos,
  edades,
  bebes,
});

test("nochesDeEstadia: la noche de salida no se duerme", () => {
  assert.deepEqual(nochesDeEstadia("2026-12-30", "2027-01-02"), ["2026-12-30", "2026-12-31", "2027-01-01"]);
  assert.deepEqual(nochesDeEstadia("2026-10-10", "2026-10-10"), []);
  assert.deepEqual(nochesDeEstadia("", "2026-10-10"), []);
});

test("por persona, cruzando Navidad y Fin de Año, con un niño", () => {
  const r = estimarEstadia(CARIBE[0], CARIBE, estadia("2026-12-23", "2026-12-28", 2, [6]));
  assert.ok(r.ok);
  // Navidad: (80 x 2 + 48) x 4 = 832. Fin de Año: 110 x 2 + 66 = 286.
  assert.equal(r.total, 1118);
  assert.equal(r.moneda, "USD");
  assert.equal(r.noches, 5);
  assert.deepEqual(r.lineas, [
    { texto: "4 noches, navidad", monto: 832 },
    { texto: "1 noche, fin de año", monto: 286 },
  ]);
  assert.ok(r.avisos.some((a) => a.includes("cena de Navidad")));
});

test("mínimo de noches: la temporada más exigente de la estadía manda", () => {
  const r = estimarEstadia(CARIBE[0], CARIBE, estadia("2026-12-20", "2026-12-22"));
  assert.equal(r.ok, false);
  assert.ok(!r.ok && r.motivo === "minimo" && r.minimo === 3);
  const cruce = estimarEstadia(CARIBE[0], CARIBE, estadia("2026-12-25", "2026-12-28"));
  assert.ok(!cruce.ok && cruce.motivo === "minimo" && cruce.minimo === 4);
});

test("fuera de ventana: sin tarifa, nunca un número", () => {
  const r = estimarEstadia(CARIBE[0], CARIBE, estadia("2026-10-10", "2026-10-13"));
  assert.ok(!r.ok && r.motivo === "sin-tarifa");
  // Un hueco en el medio (del 18 de marzo al 10 de febrero no hay nada) también.
  const hueco = estimarEstadia(CARIBE[2], CARIBE, estadia("2027-03-17", "2027-03-20"));
  assert.ok(!hueco.ok && hueco.motivo === "sin-tarifa");
});

test("niños: bebé gratis, debajo del rango gratis, arriba del rango paga como adulto", () => {
  const r = estimarEstadia(CARIBE[2], CARIBE, estadia("2027-02-15", "2027-02-17", 2, [3], 1));
  assert.ok(r.ok);
  assert.equal(r.total, 240); // 60 x 2 x 2; el de 3 años y el bebé no pagan
  const grande = estimarEstadia(CARIBE[2], CARIBE, estadia("2027-02-15", "2027-02-17", 2, [11]));
  assert.ok(grande.ok);
  assert.equal(grande.total, 360); // triple: 60 x 3 x 2
});

test("por habitación (dbl > sgl): el precio no se multiplica por adulto", () => {
  const r = estimarEstadia(VENETUR_HABITACION, VENETUR, estadia("2026-10-10", "2026-10-13", 2, [5]));
  assert.ok(r.ok);
  assert.equal(r.total, 255); // (65 + 20) x 3
  const tres = estimarEstadia(VENETUR_HABITACION, VENETUR, estadia("2026-10-10", "2026-10-11", 2, [10]));
  assert.ok(tres.ok);
  assert.equal(tres.total, 75); // el de 10 años pasa a adulto: triple por habitación
});

test("dos juegos de precios iguales de específicos: gana la fila elegida", () => {
  const r = estimarEstadia(VENETUR_PERSONA, VENETUR, estadia("2026-10-10", "2026-10-13"));
  assert.ok(r.ok);
  assert.equal(r.total, 360); // 60 x 2 x 3, por persona
});

test("cuádruple con clave cpl y ocupación sin precio", () => {
  const r = estimarEstadia(VENETUR_PERSONA, VENETUR, estadia("2026-10-10", "2026-10-11", 4));
  assert.ok(r.ok);
  assert.equal(r.total, 220); // 55 x 4
  const caribe4 = estimarEstadia(CARIBE[2], CARIBE, estadia("2027-02-15", "2027-02-16", 4));
  assert.ok(!caribe4.ok && caribe4.motivo === "ocupacion"); // cdp: null
  const seis = estimarEstadia(VENETUR_PERSONA, VENETUR, estadia("2026-10-10", "2026-10-11", 6));
  assert.ok(!seis.ok && seis.motivo === "ocupacion");
});

test("euros y fila sin fechas: la temporada específica le gana a la abierta", () => {
  const r = estimarEstadia(PALM[2], PALM, estadia("2026-12-20", "2026-12-23"));
  assert.ok(r.ok);
  assert.equal(r.moneda, "EUR");
  // 20 y 21 temporada baja (75 x 2), 22 preventa Navidad (100 x 2).
  assert.equal(r.total, 500);
  assert.equal(r.lineas.length, 2);
});

test("niño sin tarifa publicada: a confirmar", () => {
  const sinChd = fila({ id: 9, habitacion: "X", precios: { dbl: 50, sgl: 70 }, ventanas: [] });
  const r = estimarEstadia(sinChd, [sinChd], estadia("2026-10-10", "2026-10-11", 2, [6]));
  assert.ok(!r.ok && r.motivo === "ninos");
});

test("sin fechas o sin adultos", () => {
  assert.ok(!estimarEstadia(CARIBE[0], CARIBE, estadia("", "")).ok);
  const r = estimarEstadia(CARIBE[0], CARIBE, estadia("2026-12-20", "2026-12-24", 0));
  assert.ok(!r.ok && r.motivo === "ocupacion");
});
