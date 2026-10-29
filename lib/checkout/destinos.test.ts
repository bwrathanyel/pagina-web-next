import assert from "node:assert/strict";
import { test } from "node:test";
import { esDestinoCompraDirecta } from "./destinos.ts";

test("compra directa solo en Margarita, con cualquier escritura del tarifario", () => {
  for (const d of ["Margarita", "Isla Margarita", "ISLA DE MARGARITA", " margarita "]) assert.equal(esDestinoCompraDirecta(d), true, d);
  for (const d of ["Mérida", "Los Roques", "", null, undefined]) assert.equal(esDestinoCompraDirecta(d), false, String(d));
});
