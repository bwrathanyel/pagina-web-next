import assert from "node:assert/strict";
import { test } from "node:test";
import { mapaSlugs, slugHotel } from "./slugHotel.ts";

test("slug sin tildes, en minúsculas y con guiones", () => {
  assert.equal(slugHotel("Margarita Village"), "margarita-village");
  assert.equal(slugHotel("  Hotel Cala Margarita (Todo Incluido) "), "hotel-cala-margarita-todo-incluido");
  assert.equal(slugHotel("Posada Las Alejandras Coral"), "posada-las-alejandras-coral");
  assert.equal(slugHotel("Hesperia Playa El Agua"), "hesperia-playa-el-agua");
  assert.equal(slugHotel("Sunsol Ísla & Spa"), "sunsol-isla-y-spa");
  assert.equal(slugHotel("***"), "");
});

test("slugs repetidos llevan el id; los únicos quedan limpios", () => {
  const m = mapaSlugs([
    { id: 1, nombre: "Margarita Village" },
    { id: 2, nombre: "Hotel Sol" },
    { id: 3, nombre: "hotel  sol" },
    { id: 4, nombre: "???" },
  ]);
  assert.equal(m.porId.get(1), "margarita-village");
  assert.equal(m.porId.get(2), "hotel-sol-2");
  assert.equal(m.porId.get(3), "hotel-sol-3");
  assert.equal(m.porId.get(4), "4");
  assert.equal(m.porSlug.get("margarita-village"), 1);
  assert.equal(m.porSlug.get("hotel-sol"), undefined);
});
