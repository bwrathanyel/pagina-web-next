import assert from "node:assert/strict";
import { test } from "node:test";
import { ofertaParaEstadia, ofertasHoteles } from "./ofertas.ts";

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

test("flyer que no cubre las fechas: la tarjeta toma la tarifa usada y sin regalo", () => {
  const [o] = ofertasHoteles([promo({ dbl: 60 }, "4 - 10")]);
  assert.equal(ofertaParaEstadia(o, null), o);
  assert.equal(ofertaParaEstadia(o, { id: 1, titulo: "Otra" }), o);
  const v = ofertaParaEstadia(o, { id: 2, titulo: "TEMPORADA BAJA", plan: "TODO INCLUIDO" });
  assert.equal(v.tarifaId, 1);
  assert.equal(v.titulo, "TEMPORADA BAJA");
  assert.equal(v.todoIncluido, true);
  assert.equal(v.ninosGratis, false);
  assert.equal(v.ninosGratisCantidad, 0);
  assert.equal(v.ninosGratisEdades, null);
});

test("promo niños sin tarifa chd: el asesor confirma", () => {
  const [o] = ofertasHoteles([promo({ dbl: 60 }, null)]);
  assert.equal(o.precioNino, null);
  assert.equal(o.ninosGratisEdades, null);
});

test("paquete de texto con niño gratis (LD Palm Beach) no le gana a la tarifa normal del hotel", () => {
  const paquete = { ...promo({}, "4-10"), id: 120929, precios: null, precio_desde_usd: null, precio_texto: "03 días y 02 noches para 02 personas con 1 Niño Gratis: REF. 240.00" };
  const normal = { ...promo({ dbl: 75, sgl: 95 }, null), id: 121008, nino_gratis: null };
  const [o] = ofertasHoteles([paquete, normal] as unknown as Parameters<typeof ofertasHoteles>[0]);
  assert.equal(o.tarifaId, 121008);
  assert.equal(o.ninosGratis, false);
  assert.equal(o.precio?.monto, "$75");
});
