import assert from "node:assert/strict";
import { test } from "node:test";
import type { Tarifa, TarifarioBloque } from "@/types/supabase";
import { calcularHospedaje, fechaValida, servicioHospedaje, validarContacto, type HotelParaCobrar, type SolicitudHospedaje } from "./calculo.ts";

const bloque = (b: Partial<TarifarioBloque> = {}): TarifarioBloque =>
  ({ id: 1, plan: null, base_precio: null, incluye: null, check_in: null, check_out: null, ocupacion: null, ninos: null, suplementos: null, minimo_noches: null, impuestos: null, otras: null, ...b }) as TarifarioBloque;

const fila = (t: Partial<Tarifa> & { id: number }): Tarifa =>
  ({ precio_texto: "", precio_desde_usd: null, vigencia_texto: null, vigente: true, moneda: "USD", ...t }) as Tarifa;

const HOY = "2027-01-10";
const estandar = fila({
  id: 10,
  habitacion: "STANDARD ROOM",
  plan: "TODO INCLUIDO",
  precios: { cdp: null, dbl: 100, sgl: 150, tpl: 100, chd_4_10: 50 },
  ventanas: [{ desde: "2027-02-01", hasta: "2027-03-31" }],
  tarifario_bloques: bloque({ ninos: { chd_desde: 4, chd_hasta: 10 } }),
});
const hotel: HotelParaCobrar = { id: 7, nombre: "Hotel Prueba", tarifas: [estandar] };
const sel = (o: Partial<SolicitudHospedaje> = {}): SolicitudHospedaje =>
  ({ productoId: 7, tarifaId: 10, desde: "2027-02-10", hasta: "2027-02-13", adultos: 2, edades: [], bebes: 0, ...o });

test("hospedaje de 3 noches en doble: total, descripción y servicio para la Edge Function", () => {
  const r = calcularHospedaje(hotel, sel(), [], HOY);
  assert.ok(r.ok);
  if (!r.ok) return;
  assert.equal(r.noches, 3);
  assert.ok(r.precio > 0 && Number.isFinite(r.precio));
  assert.equal(Math.round(r.precio * 100), r.precio * 100);
  assert.match(r.descripcion, /Hotel Prueba — STANDARD ROOM \(3 noches\)/);
  const s = servicioHospedaje(hotel, sel({ edades: [6], bebes: 1 }), r);
  assert.equal(s.tipo, "hospedaje");
  assert.equal(s.pax_ninos, 2);
  assert.equal(s.detalle.producto_id, "7");
  assert.equal(s.detalle.regimen, "TODO INCLUIDO");
});

test("fechas pasadas, salida antes de entrada y estadías de más de 30 noches se rechazan", () => {
  for (const o of [{ desde: "2027-01-05", hasta: "2027-01-08" }, { desde: "2027-02-13", hasta: "2027-02-10" }, { desde: "2027-02-01", hasta: "2027-03-15" }, { desde: "x", hasta: "y" }]) {
    const r = calcularHospedaje(hotel, sel(o), [], HOY);
    assert.ok(!r.ok && r.error === "fechas_invalidas", JSON.stringify(o));
  }
});

test("viajeros fuera de rango se rechazan", () => {
  for (const o of [{ adultos: 0 }, { adultos: 13 }, { edades: [1] }, { edades: [12] }, { bebes: 5 }, { adultos: 1.5 }]) {
    const r = calcularHospedaje(hotel, sel(o), [], HOY);
    assert.ok(!r.ok && r.error === "pasajeros_invalidos", JSON.stringify(o));
  }
});

test("tarifa que no está entre las vendibles del hotel no se cobra", () => {
  assert.ok(!calcularHospedaje(hotel, sel({ tarifaId: 999 }), [], HOY).ok);
  const apagada: HotelParaCobrar = { ...hotel, tarifas: [{ ...estandar, vigente: false }] };
  const r = calcularHospedaje(apagada, sel(), [], HOY);
  assert.ok(!r.ok && r.error === "tarifa_no_disponible");
});

test("stop sale bloquea y on request deriva al asesor; un bloqueo fuera de las noches no molesta", () => {
  const stop = calcularHospedaje(hotel, sel(), [{ desde: "2027-02-11", hasta: "2027-02-11", estado: "stop_sale" }], HOY);
  assert.ok(!stop.ok && stop.error === "sin_disponibilidad");
  const onReq = calcularHospedaje(hotel, sel(), [{ desde: "2027-02-10", hasta: "2027-02-12", estado: "on_request" }], HOY);
  assert.ok(!onReq.ok && onReq.error === "sujeto_a_confirmacion");
  // la salida (13) no es una noche dormida
  assert.ok(calcularHospedaje(hotel, sel(), [{ desde: "2027-02-13", hasta: "2027-02-20", estado: "stop_sale" }], HOY).ok);
});

test("noches sin tarifa no se cobran solas", () => {
  const sinTarifa = calcularHospedaje(hotel, sel({ desde: "2027-04-10", hasta: "2027-04-12" }), [], HOY);
  assert.ok(!sinTarifa.ok && sinTarifa.error === "precio_a_confirmar");
});

test("tarifa «EUR» se vende: mismo número que en dólares y viaja la tasa euro", () => {
  const usd = calcularHospedaje(hotel, sel(), [], HOY);
  const euros: HotelParaCobrar = { ...hotel, tarifas: [{ ...estandar, moneda: "EUR" }] };
  const e = calcularHospedaje(euros, sel(), [], HOY);
  assert.ok(usd.ok && e.ok);
  if (!usd.ok || !e.ok) return;
  assert.equal(usd.tasa, "USD");
  assert.equal(e.tasa, "EUR");
  assert.equal(e.precio, usd.precio);
  assert.equal(servicioHospedaje(euros, sel(), e).tasa, "EUR");
  assert.equal(servicioHospedaje(hotel, sel(), usd).tasa, "USD");
});

test("hotel con tarifas USD y EUR: la estadía usa solo la tasa de la fila elegida", () => {
  const abrilEur = fila({ ...estandar, id: 11, moneda: "EUR", ventanas: [{ desde: "2027-04-01", hasta: "2027-04-30" }] });
  const mixto: HotelParaCobrar = { ...hotel, tarifas: [estandar, abrilEur] };
  const abril = { desde: "2027-04-10", hasta: "2027-04-12" };
  const conUsd = calcularHospedaje(mixto, sel(abril), [], HOY);
  assert.ok(!conUsd.ok && conUsd.error === "precio_a_confirmar");
  const conEur = calcularHospedaje(mixto, sel({ ...abril, tarifaId: 11 }), [], HOY);
  assert.ok(conEur.ok && conEur.tasa === "EUR");
  const feb = calcularHospedaje(mixto, sel(), [], HOY);
  assert.ok(feb.ok && feb.tasa === "USD");
});

test("fechaValida rechaza fechas que no existen", () => {
  assert.ok(fechaValida("2027-02-28"));
  for (const f of ["2027-02-31", "2027-13-01", "27-02-10", "", null, 20270210]) assert.ok(!fechaValida(f), String(f));
});

test("un suplemento obligatorio que suma el asesor deriva a cotización (no se cobra incompleto)", () => {
  const navidad = fila({
    id: 20,
    habitacion: "STANDARD ROOM",
    precios: { cdp: null, dbl: 100, sgl: 150, tpl: 100 },
    ventanas: [{ desde: "2027-12-01", hasta: "2028-01-10" }],
    tarifario_bloques: bloque({ suplementos: [{ adt: 75, chd: 45, temporada: "SUPLEMENTO OBLIGATORIO: CENA DE NAVIDAD (24 DICIEMBRE)", obligatorio: true }] }),
  });
  const h: HotelParaCobrar = { id: 8, nombre: "Hotel Navidad", tarifas: [navidad] };
  const r = calcularHospedaje(h, sel({ productoId: 8, tarifaId: 20, desde: "2027-12-23", hasta: "2027-12-26" }), [], HOY);
  assert.ok(!r.ok && r.error === "sujeto_a_confirmacion");
  // sin la noche del 24 no aplica el suplemento
  assert.ok(calcularHospedaje(h, sel({ productoId: 8, tarifaId: 20, desde: "2027-12-26", hasta: "2027-12-28" }), [], HOY).ok);
});

test("el servicio incluye las edades de los niños", () => {
  const r = calcularHospedaje(hotel, sel({ edades: [5, 10], bebes: 1 }), [], HOY);
  assert.ok(r.ok);
  if (!r.ok) return;
  const s = servicioHospedaje(hotel, sel({ edades: [5, 10], bebes: 1 }), r);
  assert.equal(s.detalle.edades_ninos, "5,10");
  assert.equal(s.detalle.bebes, "1");
});

test("validarContacto", () => {
  const ok = { nombre: "Ana Pérez", telefono: "+58 414 123 4567", email: "ana@correo.com", riel: "zelle" };
  assert.equal(validarContacto(ok), null);
  assert.equal(validarContacto({ ...ok, nombre: "A" }), "nombre_invalido");
  assert.equal(validarContacto({ ...ok, telefono: "123" }), "telefono_invalido");
  assert.equal(validarContacto({ ...ok, email: "ana@correo" }), "email_invalido");
  assert.equal(validarContacto({ ...ok, riel: "tarjeta" }), "riel_invalido");
});
