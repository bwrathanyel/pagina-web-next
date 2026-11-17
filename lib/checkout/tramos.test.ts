import assert from "node:assert/strict";
import { test } from "node:test";
import { siguienteTramo, tramosCompletos } from "./tramos.ts";

const SIN = { fechas: null, edades: null, precio: null, plan: null, riel: null, nombre: null, telefono: null, email: null };

test("sin errores y con precio, todo terminado", () => {
  assert.deepEqual(tramosCompletos(SIN, true), { fechas: true, habitacion: true, pago: true, datos: true });
});

test("sin edad de un niño, ni fechas ni habitación están terminadas", () => {
  const c = tramosCompletos({ ...SIN, edades: "Elija la edad de cada niño." }, false);
  assert.equal(c.fechas, false);
  assert.equal(c.habitacion, false);
});

test("la habitación necesita precio aunque no haya error", () => {
  assert.equal(tramosCompletos(SIN, false).habitacion, false);
});

test("plan sin aceptar deja el pago abierto", () => {
  assert.equal(tramosCompletos({ ...SIN, plan: "Acepte" }, true).pago, false);
});

test("terminar fechas salta al primer tramo pendiente, no al siguiente terminado", () => {
  const antes = { fechas: false, habitacion: false, pago: false, datos: false };
  const ahora = { fechas: true, habitacion: true, pago: false, datos: false };
  assert.equal(siguienteTramo(antes, ahora), "pago");
});

test("sin cambios o sin pendientes detrás, no hay salto", () => {
  const todo = { fechas: true, habitacion: true, pago: true, datos: true };
  assert.equal(siguienteTramo(todo, todo), null);
  assert.equal(siguienteTramo({ ...todo, datos: false }, todo), null);
});

test("el orden de escritorio sin datos no salta a datos", () => {
  const antes = { fechas: true, habitacion: true, pago: false, datos: false };
  const ahora = { ...antes, pago: true };
  assert.equal(siguienteTramo(antes, ahora, ["fechas", "habitacion", "pago"]), null);
});
