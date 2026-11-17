import assert from "node:assert/strict";
import { test } from "node:test";
import { DESTINOS } from "./cotizador/estado.ts";
import { selloDestino } from "./arte.ts";

test("selloDestino: normaliza acentos y quita «Isla de »", () => {
  assert.equal(selloDestino("Isla de Margarita"), "margarita");
  assert.equal(selloDestino("Mérida"), "merida");
  assert.equal(selloDestino("Colonia Tovar"), "colonia-tovar");
  assert.equal(selloDestino("Los Roques"), "los-roques");
});

test("selloDestino: todos los DESTINOS tienen sello", () => {
  for (const d of DESTINOS) assert.ok(selloDestino(d), d);
});

test("selloDestino: desconocido o vacío es undefined", () => {
  assert.equal(selloDestino("Atlantis"), undefined);
  assert.equal(selloDestino(""), undefined);
});
