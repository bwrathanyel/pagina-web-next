import assert from "node:assert/strict";
import { test } from "node:test";
import { asesorAsignado, nombreDePila } from "./asesores.ts";

test("asesor del CRM que no está en la lista local: usa su WhatsApp", () => {
  assert.deepEqual(asesorAsignado("Maryori Sandoval", "+584120227485"), {
    nombre: "Maryori Sandoval",
    telefono: "584120227485",
  });
});

test("sin WhatsApp en la respuesta: respaldo por nombre en la lista local", () => {
  assert.equal(asesorAsignado("Ambar Arévalo", null)?.telefono, "584244900601");
});

test("sin número de ningún lado: null (el cotizador cae al corporativo)", () => {
  assert.equal(asesorAsignado("Judith López", ""), null);
  assert.equal(asesorAsignado(null, "+584120227485"), null);
});

test("nombre de pila", () => {
  assert.equal(nombreDePila("  Arquímedes Arévalo "), "Arquímedes");
});
