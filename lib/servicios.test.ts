import assert from "node:assert/strict";
import { test } from "node:test";
import type { Producto, Tarifa } from "../types/supabase.ts";
import { datosExcursion, filaTraslado, precioDeServicio, suplementoRoques, textoNoIncluye } from "./servicios.ts";

const tarifa = (id: number, precios: Record<string, unknown>, extra: Partial<Tarifa> = {}): Tarifa =>
  ({ id, precio_texto: "", precio_desde_usd: null, vigencia_texto: null, vigente: true, moneda: "USD", precios, ...extra }) as unknown as Tarifa;
const producto = (tipo: Producto["tipo"], tarifas: Tarifa[]) => ({ tipo, tarifas }) as Pick<Producto, "tipo" | "tarifas">;

const COCHE = tarifa(82694, {
  base: "persona", adulto: 80, nino: 50, infante: 0, edad_nino: [4, 11], incluye_traslado: false,
  no_incluye: [{ concepto: "Tasa portuaria Coche", monto: 1.5, aplica: "por pasajero" }],
});

test("excursión: adulto, niño con edad, infante gratis y lo que no incluye", () => {
  const d = datosExcursion(COCHE)!;
  assert.deepEqual([d.adulto, d.nino, d.infante, d.edadNino], [80, 50, 0, "4-11 años"]);
  assert.equal(textoNoIncluye(d.noIncluye[0], d.moneda), "Tasa portuaria Coche $1.50 por pasajero");
  assert.equal(datosExcursion(tarifa(1, {})), null);
});

test("tarjeta de excursión: precio del adulto y el niño en la unidad", () => {
  const p = precioDeServicio(producto("excursion", [COCHE]))!;
  assert.deepEqual(p, { monto: "$80", unidad: "por adulto · niños $50 (4-11 años)", desde: false, corto: true });
});

test("traslado compartido: rango, monto y niño 50%", () => {
  const uno = filaTraslado(tarifa(1, { modalidad: "compartido", base: "persona", monto: 16.5, pax_min: 1, pax_max: 1, sentido: "OW", nino: "50%" }))!;
  const desdeDos = filaTraslado(tarifa(2, { modalidad: "compartido", base: "persona", monto: 8.25, pax_min: 2, pax_max: null, sentido: "OW", nino: "50%" }))!;
  assert.equal(uno.rango, "1 pasajero");
  assert.equal(desdeDos.rango, "Desde 2 pasajeros");
  assert.equal(desdeDos.unidad, "por persona");
  assert.equal(desdeDos.nino, "50%");
  assert.equal(uno.monto, 16.5);
});

test("tarjeta de traslado: la tarifa más baja, 'desde' si hay varias", () => {
  const t1 = tarifa(1, { modalidad: "compartido", base: "persona", monto: 16.5, pax_min: 1, pax_max: 1, sentido: "OW" });
  const t2 = tarifa(2, { modalidad: "compartido", base: "persona", monto: 8.25, pax_min: 2, pax_max: null, sentido: "OW" });
  assert.deepEqual(precioDeServicio(producto("traslado", [t1, t2])), { monto: "$8.25", unidad: "por persona, solo ida", desde: true, corto: true });
  const priv = tarifa(3, { modalidad: "privado", base: "unidad", monto: 44, pax_min: 1, pax_max: 3, sentido: "OW" });
  assert.equal(precioDeServicio(producto("traslado", [priv]))?.unidad, "por vehículo, solo ida");
});

test("a disposición: por horas y la hora extra no baja el 'desde'", () => {
  const h4 = tarifa(1, { modalidad: "disposicion", base: "horas", horas: 4, monto: 125 });
  const extra = tarifa(2, { modalidad: "disposicion", base: "horas", horas: 1, monto: 30, hora_extra: true });
  assert.equal(filaTraslado(h4)?.rango, "4 horas");
  assert.equal(filaTraslado(extra)?.rango, "Hora extra");
  const p = precioDeServicio(producto("traslado", [h4, extra]))!;
  assert.equal(p.monto, "$125");
  assert.equal(p.unidad, "por 4 horas");
});

test("Los Roques: suplementos por posada, cada uno en su moneda", () => {
  const kai = tarifa(9, { posada: "Kai", moneda: "USD", items: [{ concepto: "Traslado + cava del último día", monto: 70, por: "persona" }] }, { titulo: "Kai" });
  const s = suplementoRoques(kai)!;
  assert.equal(s.posada, "Kai");
  assert.deepEqual(s.items[0], { concepto: "Traslado + cava del último día", monto: 70, por: "persona" });
  const p = precioDeServicio(producto("traslado", [kai]))!;
  assert.equal(p.monto, "Según posada");
});
