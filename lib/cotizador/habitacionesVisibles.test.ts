import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa } from "@/types/supabase";
import type { Estadia } from "./estimado";
import { habitacionVisible, habitacionesVisibles, opcionDeOferta } from "./habitacionesVisibles";

const estadia: Estadia = { desde: "2026-12-10", hasta: "2026-12-13", adultos: 2, edades: [], bebes: 0 };
const fila = (id: number, extra: Partial<Tarifa> = {}): Tarifa => ({
  id, habitacion: "STANDARD", plan: "TODO INCLUIDO", vigente: true,
  precio_texto: "", precio_desde_usd: null, moneda: "USD",
  precios: { dbl: 60, sgl: 90 },
  ventanas: [{ desde: "2026-12-01", hasta: "2026-12-31" }],
  ...extra,
} as Tarifa);

function visibles(filas: Tarifa[], e: Estadia = estadia) {
  return habitacionesVisibles(filas, filas, e);
}

test("/cotizar ofrece la habitación con total concreto del motor", () => {
  const r = visibles([fila(1)]);
  assert.equal(r.length, 1);
  assert.ok(r[0].estimado?.ok);
  assert.equal(r[0].estimado.total, 360);
});

test("/cotizar oculta on request aunque tenga precio numérico", () => {
  assert.deepEqual(visibles([fila(1, { habitacion: "JUNIOR (On Request)" })]), []);
  assert.deepEqual(visibles([fila(2, { habitacion: "Suite on-request" })]), []);
});

test("/cotizar oculta habitaciones sin tarifa para las noches elegidas", () => {
  assert.deepEqual(visibles([fila(1, { ventanas: [{ desde: "2027-01-01", hasta: "2027-01-31" }] })]), []);
});

test("/cotizar oculta el precio a consultar y no confunde precio_desde con total", () => {
  const sinPrecio = fila(1, { precios: {}, precio_texto: "A consultar", precio_desde_usd: 60 });
  assert.deepEqual(visibles([sinPrecio]), []);
  assert.deepEqual(visibles([sinPrecio], { ...estadia, desde: "", hasta: "" }), []);
});

test("/cotizar no ofrece estadías que incumplen el mínimo de noches", () => {
  assert.deepEqual(visibles([fila(1, { minimo_noches: 4 })]), []);
});

test("sin fechas conserva precios publicados, pero no on request", () => {
  const r = visibles([fila(1), fila(2, { habitacion: "JUNIOR (On Request)" })], { ...estadia, desde: "", hasta: "" });
  assert.deepEqual(r.map((x) => x.tarifa.id), [1]);
  assert.equal(r[0].estimado, null);
});

test("sin edades conserva la habitación publicada sin inventar el total", () => {
  const r = visibles([fila(1)], { ...estadia, edades: [null] });
  assert.equal(r.length, 1);
  assert.equal(r[0].estimado, null);
});

test("una habitación conserva sus temporadas y toma el precio de la entrada", () => {
  const filas = [
    fila(1, { ventanas: [{ desde: "2026-12-01", hasta: "2026-12-11" }] }),
    fila(2, { precios: { dbl: 80, sgl: 110 }, ventanas: [{ desde: "2026-12-12", hasta: "2026-12-31" }] }),
  ];
  const r = visibles(filas);
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].filas.map((t) => t.id), [1, 2]);
  assert.ok(r[0].estimado?.ok);
  assert.equal(r[0].estimado.total, 400);
});

test("una opción descartada no elimina las demás habitaciones del mismo plan", () => {
  const filas = [fila(1), fila(2, { habitacion: "SUITE", precios: {}, precio_texto: "A consultar" })];
  assert.deepEqual(visibles(filas).map((x) => x.tarifa.id), [1]);
});

test("una tarifa oculta llegada por URL o borrador tampoco es elegible", () => {
  const t = fila(1, { habitacion: "JUNIOR (On Request)" });
  assert.equal(habitacionVisible(t, [t], estadia), null);
});

test("sin nombre de habitación también reconoce on request en el título", () => {
  assert.deepEqual(visibles([fila(1, { habitacion: null, titulo: "Suite (ON REQUEST)" })]), []);
});

test("una temporada sin cobertura a mitad de la estadía no ofrece precio parcial", () => {
  const t = fila(1, { ventanas: [{ desde: "2026-12-01", hasta: "2026-12-11" }] });
  assert.equal(habitacionVisible(t, [t], estadia), null);
});

test("/cotizar: oferta de flyer sin grilla cae a la habitación más barata con precio (LD Palm Beach)", () => {
  const flyer = fila(9, { habitacion: null, plan: null, precios: null, ventanas: null, titulo: "Plan Residentes Navidad", precio_texto: "03 días y 02 noches para 02 personas con 1 Niño Gratis: REF. 240.00" } as Partial<Tarifa>);
  const cara = fila(2, { habitacion: "SUITE", precios: { dbl: 90 }, titulo: "TEMPORADA BAJA" });
  const barata = fila(3, { titulo: "TEMPORADA BAJA" });
  const filas = [flyer, cara, barata];
  const r = opcionDeOferta(flyer, filas, { ...estadia, ninosGratis: 1 });
  assert.equal(r?.tarifa.id, 3);
  assert.ok(r?.estimado?.ok);
  assert.equal(r.estimado.total, 360);
  assert.match(r.estimado.avisos[0], /Plan Residentes Navidad.*no cubre esta estadía/);
});

test("/cotizar: la tarifa anunciada con precio manda, y sin fechas no se elige otra", () => {
  const filas = [fila(1, { precios: { dbl: 80 } }), fila(2, { habitacion: "SUITE", precios: { dbl: 50 } })];
  assert.equal(opcionDeOferta(filas[0], filas, estadia)?.tarifa.id, 1);
  const flyer = fila(9, { precios: null, ventanas: null, precio_texto: "A consultar" } as Partial<Tarifa>);
  assert.equal(opcionDeOferta(flyer, [flyer, ...filas], { ...estadia, desde: "", hasta: "" }), null);
});
