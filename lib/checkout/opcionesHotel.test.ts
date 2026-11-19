import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa, TarifarioBloque } from "@/types/supabase";
import { calcularHospedaje, type HotelParaCobrar } from "./calculo.ts";
import { precioMasBajo } from "./opcionesHotel.ts";

const bloque = (b: Partial<TarifarioBloque> = {}): TarifarioBloque =>
  ({ id: 1, plan: null, base_precio: null, incluye: null, check_in: null, check_out: null, ocupacion: null, ninos: null, suplementos: null, minimo_noches: null, impuestos: null, otras: null, ...b }) as TarifarioBloque;

const fila = (t: Partial<Tarifa> & { id: number }): Tarifa =>
  ({
    precio_texto: "",
    precio_desde_usd: null,
    vigencia_texto: null,
    vigente: true,
    moneda: "USD",
    plan: "DESAYUNO",
    ventanas: [{ desde: "2027-02-01", hasta: "2027-03-31" }],
    tarifario_bloques: bloque(),
    ...t,
  }) as Tarifa;

const HOY = "2027-01-10";
const sinFotos = () => false;
const viaje = { desde: "2027-02-10", hasta: "2027-02-13", adultos: 2, edades: [], bebes: 0 };
const estandar = fila({ id: 10, habitacion: "STANDARD", precios: { dbl: 100, sgl: 150 } });
const suite = fila({ id: 11, habitacion: "SUITE", precios: { dbl: 200, sgl: 250 } });
const flyer = fila({ id: 12, habitacion: "PLAN NAVIDAD", plan: "TODO INCLUIDO", precio_texto: "03 días y 02 noches para 02 personas con 1 Niño…" });
const hotel: HotelParaCobrar = { id: 7, nombre: "Hotel Prueba", tarifas: [suite, estandar, flyer] };
const precio = (id: number) => {
  const r = calcularHospedaje(hotel, { productoId: 7, tarifaId: id, ...viaje }, [], HOY);
  assert.ok(r.ok);
  return r.ok ? r.precio : NaN;
};

test("la habitación más barata con precio para ese viaje, con el mismo total que cobra /reservar", () => {
  const r = precioMasBajo(hotel, sinFotos, viaje, [], HOY);
  assert.deepEqual(r, { ok: true, tarifaId: 10, precio: precio(10), noches: 3 });
});

test("con habitaciones con fotos, solo cuentan esas (las que /reservar muestra)", () => {
  const r = precioMasBajo(hotel, (t) => t.id === 11, viaje, [], HOY);
  assert.ok(r.ok && r.tarifaId === 11 && r.precio === precio(11));
});

test("sin precio para esas fechas: a confirmar; con stop sale: sin cupo", () => {
  assert.deepEqual(precioMasBajo({ ...hotel, tarifas: [flyer] }, sinFotos, viaje, [], HOY), { ok: false, sinCupo: false });
  const fuera = precioMasBajo(hotel, sinFotos, { ...viaje, desde: "2027-06-10", hasta: "2027-06-12" }, [], HOY);
  assert.equal(fuera.ok, false);
  const stop = precioMasBajo(hotel, sinFotos, viaje, [{ desde: "2027-02-01", hasta: "2027-02-28", estado: "stop_sale" }], HOY);
  assert.deepEqual(stop, { ok: false, sinCupo: true });
});
