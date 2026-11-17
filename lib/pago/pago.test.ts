import assert from "node:assert/strict";
import { test } from "node:test";
import { decidirComprobante, IMAGEN_MAX_BYTES, medidas, nombreCon, OBJETIVO_BYTES } from "./comprimir.ts";
import { escaparIcs, icsReserva, plegar } from "./ics.ts";
import { intervaloRefresco, textoCopiarTodo } from "./talon.ts";

const MB = 1024 * 1024;

test("comprobante: un pantallazo de 6 MB se comprime, no se rechaza", () => {
  assert.equal(decidirComprobante("image/png", 6 * MB), "comprimir");
  assert.equal(decidirComprobante("image/jpeg", OBJETIVO_BYTES), "tal_cual");
  assert.equal(decidirComprobante("image/webp", IMAGEN_MAX_BYTES + 1), "tamano");
});

test("comprobante: el PDF va tal cual hasta 5 MB", () => {
  assert.equal(decidirComprobante("application/pdf", 4 * MB), "tal_cual");
  assert.equal(decidirComprobante("application/pdf", 6 * MB), "tamano");
  assert.equal(decidirComprobante("image/heic", 1 * MB), "formato");
});

test("medidas: achica al lado mayor y nunca agranda", () => {
  assert.deepEqual(medidas(1170, 2532, 1600), { ancho: 739, alto: 1600 });
  assert.deepEqual(medidas(3000, 2000, 2000), { ancho: 2000, alto: 1333 });
  assert.deepEqual(medidas(800, 600, 1600), { ancho: 800, alto: 600 });
});

test("nombreCon cambia la extensión según lo que salió", () => {
  assert.equal(nombreCon("IMG_1234.PNG", "image/webp"), "IMG_1234.webp");
  assert.equal(nombreCon("captura", "image/jpeg"), "captura.jpg");
});

test("ics: día completo de entrada a salida, CRLF y sin comas sin escapar", () => {
  const ics = icsReserva({
    codigo: "LT-7Q2K",
    hotel: "Hotel Costa, Margarita",
    entrada: "2026-12-20",
    salida: "2026-12-23",
    ahora: new Date("2026-11-17T15:00:00Z"),
  });
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261220\r\n"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20261223\r\n"));
  assert.ok(ics.includes("UID:LT-7Q2K@destinoyeventoslotus360.com"));
  assert.ok(ics.includes("DTSTAMP:20261117T150000Z"));
  assert.ok(ics.includes("LOCATION:Hotel Costa\\, Margarita"));
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/[^\r]\n/.test(ics), "todas las líneas terminan en CRLF");
});

test("ics: sin salida o salida inválida, dura un día", () => {
  const ics = icsReserva({ codigo: "X1", hotel: null, entrada: "2026-12-31", salida: null });
  assert.ok(ics.includes("DTEND;VALUE=DATE:20270101"));
  assert.ok(ics.includes("SUMMARY:Reserva X1"));
});

test("ics: escapa y pliega a 75 octetos sin partir tildes", () => {
  assert.equal(escaparIcs("a;b,c\\d\ne"), "a\\;b\\,c\\\\d\\ne");
  const larga = "DESCRIPTION:" + "Habitación ".repeat(12);
  const plegada = plegar(larga);
  const enc = new TextEncoder();
  for (const l of plegada.split("\r\n")) assert.ok(enc.encode(l).length <= 75);
  assert.equal(plegada.replaceAll("\r\n ", ""), larga);
});

test("Copiar todo arma un bloque con monto, datos y concepto", () => {
  const t = textoCopiarTodo({
    titulo: "Pague por Pago Móvil",
    monto: "Bs. 1.234,56",
    datos: [{ etiqueta: "Teléfono", valor: "0414-0415685" }],
    codigo: "LT-7Q2K",
  });
  assert.equal(t, "Pague por Pago Móvil · Destino y Eventos Lotus 360\nMonto exacto: Bs. 1.234,56\nTeléfono: 0414-0415685\nConcepto: Reserva LT-7Q2K");
});

test("refresco: 1 min, luego 2, luego 5, sin corte", () => {
  assert.equal(intervaloRefresco(0), 60_000);
  assert.equal(intervaloRefresco(15 * 60_000), 120_000);
  assert.equal(intervaloRefresco(5 * 60 * 60_000), 300_000);
});
