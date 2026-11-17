import { test } from "node:test";
import assert from "node:assert/strict";
import { convertirPrecioTexto } from "./convertirPrecio.ts";
import { formatearPrecioCliente, formatearPrecioDesde, textoEnDolares } from "./formatoPrecio.ts";

test("$ y € van a la misma tasa (euro) y el IVA solo si se pide", () => {
  assert.equal(convertirPrecioTexto("$100", 50), "Bs 5.000,00");
  assert.equal(convertirPrecioTexto("€100", 50), "Bs 5.000,00");
  assert.equal(convertirPrecioTexto("$215", 100, true), "Bs 24.940,00");
  assert.equal(convertirPrecioTexto("DBL $115 / CPL €185", 10), "DBL Bs 1.150,00 / CPL Bs 1.850,00");
});

test("sin tasa no inventa bolívares", () => {
  assert.equal(convertirPrecioTexto("$100", null, true), "$100");
});

test("al cliente todo en $ con el número de BT", () => {
  assert.equal(textoEnDolares("€286 por persona"), "$286 por persona");
  assert.equal(textoEnDolares("EUR 286"), "USD 286");
  assert.equal(formatearPrecioCliente("DBL € 120"), "doble $120");
  assert.equal(formatearPrecioDesde(286), "$286");
});
