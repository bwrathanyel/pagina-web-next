import assert from "node:assert/strict";
import { test } from "node:test";
import type { HotSale } from "@/types/supabase";
import { ninosGratisEn } from "./ninosGratis.ts";

const fila = (id: number, extra: Partial<HotSale>) =>
  ({
    id,
    moneda: "USD",
    precios: null,
    precio_texto: null,
    plan: null,
    nino_gratis: { cantidad: 1, edades: "0-3", hasta: "2026-12-20" },
    producto: { id: id * 10, nombre: `Hotel ${id}`, destino: "Isla de Margarita" },
    ...extra,
  }) as unknown as HotSale;

test("niño gratis: paquete de texto (LD Palm Beach) muestra su monto y unidad, sin tocar el piso", () => {
  const b = ninosGratisEn(
    [
      fila(1, { precio_texto: "03 días y 02 noches para 02 personas con 1 Niño Gratis: REF. 240.00 / Adulto Adicional: REF. 240.00" }),
      fila(2, { precios: { dbl: 55, sgl: 70 } }),
    ],
    "Isla de Margarita",
    new Date("2026-11-19T12:00:00-04:00"),
  );
  const palm = b?.hoteles.find((h) => h.id === 1);
  assert.equal(palm?.precio, "$240");
  assert.equal(palm?.unidad, "3 días y 2 noches para 2 personas");
  assert.equal(b?.hoteles.find((h) => h.id === 2)?.unidad, null);
  assert.equal(b?.desde, "$55");
  assert.match(palm?.href ?? "", /^\/cotizar\?.*&hotel=10&tarifa=1$/);
});
