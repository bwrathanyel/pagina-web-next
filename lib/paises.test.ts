import assert from "node:assert/strict";
import { test } from "node:test";
import { buscarPais, separarTelefono, telefonoInternacional } from "./paises.ts";

test("separa un número venezolano con o sin +", () => {
  assert.deepEqual(separarTelefono("+584141234567"), { iso: "ve", numero: "4141234567" });
  assert.deepEqual(separarTelefono("584141234567"), { iso: "ve", numero: "4141234567" });
});

test("ida y vuelta con telefonoInternacional", () => {
  const s = separarTelefono("+573001234567");
  assert.ok(s);
  assert.equal(telefonoInternacional(buscarPais(s.iso), s.numero), "+573001234567");
});

test("vacío, corto o de un país fuera de la lista: null", () => {
  assert.equal(separarTelefono(""), null);
  assert.equal(separarTelefono("+58414"), null);
  assert.equal(separarTelefono("+8861234567890"), null);
});
