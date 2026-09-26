import assert from "node:assert/strict";
import { test } from "node:test";
import { diasHasta, estimarVuelo, type EntradaVuelo } from "./vuelo.ts";

// Tarifas semilla reales de `vuelos_referencia` (2026-09-25): CCS-BOG 299, VLN-PZO 155.

const HOY = "2026-10-01";
const base: EntradaVuelo = { desdeUsd: 299, idaVuelta: true, fechaIda: "2026-10-31", hoy: HOY, adultos: 2, ninos: 0, bebes: 0 };

test("+20% sobre la tarifa, por persona y total", () => {
  const r = estimarVuelo(base);
  assert.equal(r.porPersona, 359);
  assert.equal(r.total, 718);
  assert.equal(r.cercano, false);
  assert.deepEqual(r.aConfirmar, []);
});

test("a 20 días o menos suma x1,15 sobre el +20%", () => {
  const r = estimarVuelo({ ...base, fechaIda: "2026-10-11" });
  assert.equal(r.dias, 10);
  assert.equal(r.cercano, true);
  assert.equal(r.porPersona, 413);
});

test("borde: 20 días es cercano, 21 no", () => {
  assert.equal(estimarVuelo({ ...base, fechaIda: "2026-10-21" }).cercano, true);
  assert.equal(estimarVuelo({ ...base, fechaIda: "2026-10-22" }).cercano, false);
});

test("vuelo hoy es cercano", () => {
  assert.equal(estimarVuelo({ ...base, fechaIda: HOY }).cercano, true);
});

test("solo ida: mitad de la tarifa con los mismos recargos", () => {
  assert.equal(estimarVuelo({ ...base, idaVuelta: false }).porPersona, 180);
  assert.equal(estimarVuelo({ ...base, idaVuelta: false, fechaIda: "2026-10-11" }).porPersona, 207);
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
  assert.equal(r.porPersona, 359);
});

test("niños pagan asiento completo; bebés no suman", () => {
  const r = estimarVuelo({ ...base, adultos: 2, ninos: 1, bebes: 1 });
  assert.equal(r.total, 359 * 3);
  assert.equal(r.bebesSinCosto, true);
});

test("sin pasajeros con asiento no hay total", () => {
  assert.equal(estimarVuelo({ ...base, adultos: 0, ninos: 0 }).total, null);
});

test("redondeo: sin error de coma flotante en montos exactos", () => {
  // 155 * 1.2 = 186 exacto; un ceil ingenuo daría 187.
  assert.equal(estimarVuelo({ ...base, desdeUsd: 155 }).porPersona, 186);
  // 299 * 1.2 = 358.8, sube a 359.
  assert.equal(estimarVuelo({ ...base, desdeUsd: 299 }).porPersona, 359);
});

test("diasHasta ignora fechas inválidas", () => {
  assert.equal(diasHasta("no-es-fecha", HOY), null);
  assert.equal(diasHasta(null, HOY), null);
});
