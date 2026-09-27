import assert from "node:assert/strict";
import { test } from "node:test";
import { ofertasHoteles } from "./ofertas.ts";

const promo = (precios: Record<string, string | number | null>, edades: string | null) =>
  ({
    id: 1,
    titulo: "Promo niños",
    precio_texto: null,
    precio_desde_usd: 60,
    vigencia_texto: null,
    precios,
    moneda: "USD",
    ninos_gratis_cantidad: null,
    incluye_tags: [],
    producto: { id: 10, tipo: "hotel", nombre: "Hotel Prueba", destino: "Margarita", producto_fotos: [] },
    nino_gratis: { cantidad: 1, edades, hasta: null, label: "", detalle: null, txt: "" },
  }) as unknown as Parameters<typeof ofertasHoteles>[0][number];

test("promo niños: 2do niño toma la tarifa chd más barata y las edades se leen 'a'", () => {
  const [o] = ofertasHoteles([promo({ dbl: 60, chd_4_10: "US$ 25", chd_2_3: 18 }, "4 - 10")]);
  assert.ok(o);
  assert.equal(o.ninosGratisCantidad, 1);
  assert.equal(o.precioNino?.replace(/[^\d.]/g, ""), "18");
  assert.equal(o.ninosGratisEdades, "4 a 10");
});

test("promo niños sin tarifa chd: el asesor confirma", () => {
  const [o] = ofertasHoteles([promo({ dbl: 60 }, null)]);
  assert.equal(o.precioNino, null);
  assert.equal(o.ninosGratisEdades, null);
});
