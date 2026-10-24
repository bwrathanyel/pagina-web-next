import assert from "node:assert/strict";
import { test } from "node:test";
import {
  antesDeVenezuela, fechaCorta, fechaHoraVenezuela, horaAmPm, horaVenezuela, mensajePago, mensajeReserva,
  montoCentavos, montoParaCopiar, plazoRestante, porcentajeIgtf, rangoFechas, separarCargos, usd,
} from "./formato.ts";

test("montoCentavos agrupa miles y usa coma decimal en las tres monedas", () => {
  assert.equal(montoCentavos(123456, "USD"), "US$ 1.234,56");
  assert.equal(montoCentavos(883396, "VES"), "Bs 8.833,96");
  assert.equal(montoCentavos(31827, "USDT"), "USDT 318,27");
  assert.equal(montoCentavos(300000, "USD"), "US$ 3.000,00");
  assert.equal(montoCentavos(123456789, "VES"), "Bs 1.234.567,89");
  assert.equal(montoCentavos(5, "USD"), "US$ 0,05");
});

test("usd redondea a centavos y coincide con montoCentavos", () => {
  assert.equal(usd(1234.56), "US$ 1.234,56");
  assert.equal(usd(318.265), montoCentavos(31827, "USD"));
  assert.equal(usd(103), "US$ 103,00");
});

test("montoParaCopiar: punto para Zelle/Binance, coma para Bs, sin miles", () => {
  assert.equal(montoParaCopiar(31827, "USD"), "318.27");
  assert.equal(montoParaCopiar(31827, "USDT"), "318.27");
  assert.equal(montoParaCopiar(883396, "VES"), "8833,96");
  assert.equal(montoParaCopiar(300000, "USD"), "3000.00");
});

test("horas en zona de Venezuela (UTC-4), sin depender del navegador", () => {
  assert.equal(horaVenezuela("2026-10-22T19:45:00Z"), "3:45 pm");
  assert.equal(horaVenezuela("2026-10-22T04:05:00Z"), "12:05 am");
  assert.equal(horaVenezuela("2026-10-22T16:00:00Z"), "12:00 pm");
  assert.equal(fechaHoraVenezuela("2026-10-23T02:30:00Z"), "22 oct, 10:30 pm");
  assert.equal(horaVenezuela("no es fecha"), "");
  assert.equal(horaVenezuela(null), "");
});

test("antesDeVenezuela dice solo la hora si es hoy en Venezuela, y el día si no", () => {
  const ahora = Date.parse("2026-10-22T14:00:00Z"); // 10:00 am en Caracas
  assert.equal(antesDeVenezuela("2026-10-22T19:45:00Z", ahora), "antes de las 3:45 pm");
  // 02:30 UTC del 23 = 10:30 pm del 22 en Caracas: sigue siendo hoy.
  assert.equal(antesDeVenezuela("2026-10-23T02:30:00Z", ahora), "antes de las 10:30 pm");
  assert.equal(antesDeVenezuela("2026-10-23T13:00:00Z", ahora), "antes del 23 oct a las 9:00 am");
  assert.equal(antesDeVenezuela(null, ahora), "");
});

test("horaAmPm de la ventana de atención", () => {
  assert.equal(horaAmPm(8, 8), "8:00 am");
  assert.equal(horaAmPm(20, 20), "8:00 pm");
  assert.equal(horaAmPm(undefined, 20), "8:00 pm");
  assert.equal(horaAmPm(12, 8), "12:00 pm");
  assert.equal(horaAmPm(0, 8), "12:00 am");
});

test("fechas cortas y rangos", () => {
  assert.equal(fechaCorta("2027-05-12"), "12 may");
  assert.equal(rangoFechas("2027-05-12", "2027-05-15"), "12 al 15 may");
  assert.equal(rangoFechas("2027-04-28", "2027-05-02"), "28 abr al 2 may");
  assert.equal(rangoFechas("2027-12-30", "2028-01-02"), "30 dic al 2 ene");
  assert.equal(rangoFechas("2027-05-12", null), "12 may");
});

test("plazoRestante", () => {
  assert.equal(plazoRestante(23 * 3600 + 41 * 60 + 5), "23 h 41 min");
  assert.equal(plazoRestante(12 * 60 + 30), "12 min");
  assert.equal(plazoRestante(30), "menos de 1 min");
  assert.equal(plazoRestante(0), "0 min");
});

test("mensajeReserva prefiere el código y nunca devuelve tuteo del cálculo", () => {
  assert.equal(mensajeReserva("fechas_invalidas", "Elige la fecha de entrada y de salida."), "Elija la fecha de entrada y de salida.");
  assert.match(mensajeReserva("fechas_invalidas", "La estadía máxima por compra directa es de 30 noches."), /30 noches/);
  assert.doesNotMatch(mensajeReserva("sujeto_a_confirmacion", "Esas fechas están sujetas a confirmación del hotel: un asesor te cotiza."), /\bte\b/);
  assert.match(mensajeReserva("sujeto_a_confirmacion", "Esas fechas llevan un suplemento obligatorio del hotel que suma un asesor: te cotiza."), /suplemento/);
  assert.doesNotMatch(mensajeReserva("pasajeros_invalidos", "Indica de 1 a 12 viajeros, con al menos un adulto."), /Indica\b/);
  assert.match(mensajeReserva("precio_a_confirmar", "En esas fechas el hotel pide un mínimo de 3 noches."), /mínimo de 3/);
  assert.match(mensajeReserva("captcha_invalido"), /Reintentar/);
  assert.match(mensajeReserva("codigo_desconocido"), /Sus datos siguen aquí/);
});

test("mensajePago cubre red y captcha", () => {
  assert.match(mensajePago("captcha_invalido"), /Reintentar/);
  assert.match(mensajePago("sin_red"), /conexión/);
  assert.match(mensajePago(undefined), /aviso de pago/);
});

test("separarCargos aparta gestión web e IGTF del hospedaje", () => {
  const hotel = { tipo: "hospedaje", descripcion: null, hotel: "Hotel Mar" };
  const gestion = { tipo: "otro", descripcion: "Cargo por gestión web (2%)", hotel: null };
  const igtf = { tipo: "otro", descripcion: "IGTF (3%)", hotel: null };
  const r = separarCargos([hotel, gestion, igtf]);
  assert.deepEqual(r.principales, [hotel]);
  assert.deepEqual(r.cargos, [gestion, igtf]);
  assert.equal(porcentajeIgtf([hotel, gestion, igtf]), "3");
  assert.equal(porcentajeIgtf([hotel, gestion]), null);
});
