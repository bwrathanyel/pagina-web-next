"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { armarMensajes } from "@/lib/leads/buildCotizacion";
import { crearLeadCRM } from "@/lib/leads/ingestWebLead";
import { asesorPorNombre, elegirAsesor } from "@/lib/asesores";
import { esInstagramInApp } from "@/lib/utils/procedencia";

interface CotizacionOpcion {
  clase: "producto" | "promocion";
  id: number;
  nombre: string;
  destino: string | null;
  precio: string;
  precioUnitarioUsd: number | null;
  calculoPrecio: "persona_noche" | null;
  ninosGratis: number;
  vigenciaTexto: string | null;
  vigenciaFin: string | null;
  foto: string | null;
  esHotel: boolean;
  volverHref: string;
}

interface Confirmacion {
  numero: number | null;
  asesor: string;
  whatsappHref: string;
  resumen: {
    fechas: string;
    viajeros: string;
    telefono: string;
  };
}

const inputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-ink/15 bg-sand px-4 text-base text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/15";

function fechaLegible(valor: string) {
  if (!valor) return "Por definir";
  return new Intl.DateTimeFormat("es-VE", { dateStyle: "long", timeZone: "UTC" }).format(
    new Date(`${valor}T00:00:00Z`),
  );
}

function sumarDias(valor: string, dias: number) {
  if (!valor) return "";
  const fecha = new Date(`${valor}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

function contarNoches(entrada: string, salida: string) {
  if (!entrada || !salida || salida <= entrada) return 0;
  return Math.round((Date.parse(`${salida}T00:00:00Z`) - Date.parse(`${entrada}T00:00:00Z`)) / 86_400_000);
}

function telefonoPareceValido(valor: string) {
  if (!/^[+\d\s().-]+$/.test(valor.trim())) return false;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}

export function CotizacionOpcionForm({ opcion }: { opcion: CotizacionOpcion }) {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [fechaEntrada, setFechaEntrada] = useState("");
  const [fechaSalida, setFechaSalida] = useState("");
  const [adultos, setAdultos] = useState(2);
  const [ninos, setNinos] = useState(0);
  const [edades, setEdades] = useState<number[]>([]);
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);

  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const noches = useMemo(() => contarNoches(fechaEntrada, fechaSalida), [fechaEntrada, fechaSalida]);
  const ninosPagos = Math.max(0, ninos - opcion.ninosGratis);
  const viajerosPagos = adultos + ninosPagos;
  const totalEstimado = opcion.calculoPrecio === "persona_noche" && opcion.precioUnitarioUsd != null && noches > 0
    ? viajerosPagos * noches * opcion.precioUnitarioUsd
    : null;
  const promocionVencida = Boolean(opcion.vigenciaFin && opcion.vigenciaFin < hoy);

  function cambiarNinos(cantidad: number) {
    const segura = Math.max(0, Math.min(cantidad, 8));
    setNinos(segura);
    setEdades((actuales) => Array.from({ length: segura }, (_, indice) => actuales[indice] ?? 5));
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    if (!telefonoPareceValido(telefono)) {
      setError("Escribe un número válido de 7 a 15 dígitos. Puedes usar formato 0412-1234567 o +58 412-1234567.");
      return;
    }
    if (fechaSalida && fechaEntrada && fechaSalida <= fechaEntrada) {
      setError("La fecha de salida debe ser posterior a la fecha de entrada.");
      return;
    }
    if (opcion.vigenciaFin && (fechaEntrada > opcion.vigenciaFin || fechaSalida > opcion.vigenciaFin)) {
      setError(`La estadía debe terminar, como máximo, el ${fechaLegible(opcion.vigenciaFin)}.`);
      return;
    }

    setEnviando(true);
    setError(null);
    const viajeros = `${adultos} adulto(s)${ninos ? ` y ${ninos} niño(s)` : ""}`;
    const fechas = opcion.esHotel
      ? `${fechaLegible(fechaEntrada)} al ${fechaLegible(fechaSalida)}`
      : fechaSalida
        ? `${fechaLegible(fechaEntrada)} al ${fechaLegible(fechaSalida)}`
        : fechaLegible(fechaEntrada);
    const edadesTexto = ninos ? edades.map((edad) => `${edad} año(s)`).join(", ") : "No aplica";
    const consulta = [
      `Cotización web de ${opcion.clase} #${opcion.id}`,
      `Opción: ${opcion.nombre}`,
      `Fechas: ${fechas}`,
      `Viajeros: ${viajeros}`,
      totalEstimado != null ? `Total referencial calculado: $${totalEstimado.toFixed(2)} USD` : "",
      ninos ? `Edades de niños: ${edadesTexto}` : "",
      email ? `Correo: ${email}` : "",
      notas ? `Notas: ${notas}` : "",
    ]
      .filter(Boolean)
      .join(" | ");

    try {
      const resultado = await crearLeadCRM({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        destino: opcion.destino ?? opcion.nombre,
        personas: viajeros,
        consulta,
      });
      const asesor = asesorPorNombre(resultado.asesor) ?? elegirAsesor();
      const { emoji, texto } = armarMensajes(
        opcion.clase === "promocion"
          ? "🔥 *COTIZACIÓN DE PROMOCIÓN - DESTINO Y EVENTOS LOTUS 360*"
          : "🌴 *COTIZACIÓN DE VIAJE - DESTINO Y EVENTOS LOTUS 360*",
        [
          resultado.lead_id ? ["🔖", `*Solicitud:* #${resultado.lead_id}`] : null,
          ["👤", `*Nombre:* ${nombre.trim()}`],
          ["📍", `*Opción:* ${opcion.nombre}`],
          opcion.destino ? ["🧭", `*Destino:* ${opcion.destino}`] : null,
          ["📅", `*Fechas:* ${fechas}`],
          ["👥", `*Viajeros:* ${viajeros}`],
          ninos ? ["👶", `*Edades:* ${edadesTexto}`] : null,
          notas ? ["📝", `*Notas:* ${notas}`] : null,
        ],
        "✅ *La solicitud ya fue registrada en el CRM.*",
      );
      const mensaje = esInstagramInApp() ? texto : emoji;
      setConfirmacion({
        numero: resultado.lead_id ?? null,
        asesor: asesor.nombre,
        whatsappHref: `https://wa.me/${asesor.telefono}?text=${encodeURIComponent(mensaje)}`,
        resumen: { fechas, viajeros, telefono: telefono.trim() },
      });
    } catch (submitError) {
      const codigo = submitError instanceof Error ? submitError.message : "";
      setError(codigo === "crm_timeout"
        ? "El CRM tardó demasiado en responder. No se registró la solicitud; espera unos segundos e inténtalo nuevamente."
        : codigo === "crm_no_disponible"
          ? "El CRM no está disponible temporalmente. Tus datos no se perdieron; inténtalo nuevamente en un momento."
          : codigo === "datos_invalidos"
            ? "Revisa el nombre y el teléfono antes de continuar."
            : "No pudimos registrar la solicitud en el CRM. Inténtalo nuevamente en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmacion) {
    return (
      <section className="rounded-[28px] border border-seafoam/25 bg-card p-6 shadow-[0_24px_70px_-38px_rgba(36,31,26,.5)] md:p-9">
        <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-seafoam-bg text-2xl text-seafoam-text" aria-hidden="true">
          ✓
        </span>
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-seafoam-text">
          Solicitud registrada
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink md:text-4xl">
          {confirmacion.numero ? `Cotización #${confirmacion.numero}` : "Cotización recibida"}
        </h1>
        <p className="mt-3 leading-7 text-ink-soft">
          Un asesor verificará disponibilidad y tarifa. Tu solicitud ya llegó al CRM y fue asignada a {confirmacion.asesor}.
        </p>

        <dl className="my-7 grid gap-3 rounded-2xl bg-sand-2 p-5 text-sm sm:grid-cols-2">
          <div><dt className="text-ink-soft">Opción</dt><dd className="mt-1 font-bold text-ink">{opcion.nombre}</dd></div>
          <div><dt className="text-ink-soft">Viajeros</dt><dd className="mt-1 font-bold text-ink">{confirmacion.resumen.viajeros}</dd></div>
          <div><dt className="text-ink-soft">Fechas</dt><dd className="mt-1 font-bold text-ink">{confirmacion.resumen.fechas}</dd></div>
          <div><dt className="text-ink-soft">Teléfono</dt><dd className="mt-1 font-bold text-ink">{confirmacion.resumen.telefono}</dd></div>
        </dl>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={confirmacion.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-whatsapp px-6 font-bold text-white">
            Continuar por WhatsApp
          </a>
          <Link href={opcion.volverHref} className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-ink/15 px-6 font-bold text-ink">
            Volver a la opción
          </Link>
        </div>
        <p className="mt-4 text-xs leading-5 text-ink-soft">WhatsApp es opcional: tu solicitud ya fue enviada correctamente.</p>
      </section>
    );
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[.78fr_1.22fr] lg:items-start">
      <aside className="overflow-hidden rounded-[28px] border border-ink/10 bg-card lg:sticky lg:top-28">
        <div className="relative aspect-[16/10] bg-sand-2">
          {opcion.foto ? <Image src={opcion.foto} alt={opcion.nombre} fill sizes="(min-width: 1024px) 36vw, 100vw" className="object-cover" priority /> : null}
        </div>
        <div className="p-6">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.14em] text-coral">Cotizando esta opción</p>
          <h1 className="mt-2 font-display text-2xl font-semibold leading-tight text-ink">{opcion.nombre}</h1>
          {opcion.destino ? <p className="mt-2 text-ink-soft">{opcion.destino}</p> : null}
          <p className="mt-4 rounded-xl bg-seafoam-bg px-4 py-3 text-sm font-bold text-seafoam-text">{opcion.precio}</p>
          {opcion.vigenciaTexto ? <p className="mt-3 text-sm leading-6 text-ink-soft"><strong className="text-ink">Vigencia:</strong> {opcion.vigenciaTexto}</p> : null}
          {opcion.clase === "promocion" ? <p className="mt-2 text-sm leading-6 text-ink-soft"><strong className="text-ink">Niños gratis:</strong> {opcion.ninosGratis > 0 ? opcion.ninosGratis : "No indicado"}</p> : null}
        </div>
      </aside>

      <form onSubmit={enviar} className="rounded-[28px] border border-ink/10 bg-card p-6 shadow-[0_24px_70px_-38px_rgba(36,31,26,.45)] md:p-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-coral">Solicitud de cotización</p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Cuéntanos quiénes viajan.</h2>
        <p className="mt-2 text-sm leading-6 text-ink-soft">La opción ya está seleccionada. Solo necesitamos los datos esenciales para que un asesor confirme disponibilidad.</p>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-ink sm:col-span-2">Nombre y apellido<input required autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Escribe tu nombre completo" /></label>
          <label className="text-sm font-bold text-ink">Teléfono<input required autoComplete="tel" inputMode="tel" value={telefono} onChange={(e) => { setTelefono(e.target.value); setError(null); }} className={inputClass} placeholder="Ej: 0412-1234567 o +58 412-1234567" /><span className="mt-1.5 block text-xs font-normal leading-5 text-ink-soft">Aceptamos formato nacional o internacional.</span></label>
          <label className="text-sm font-bold text-ink">Correo opcional<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@correo.com" /></label>
          <label className="text-sm font-bold text-ink">{opcion.esHotel ? "Fecha de entrada" : "Fecha de viaje"}<input required type="date" min={hoy} max={opcion.vigenciaFin ?? undefined} value={fechaEntrada} onChange={(e) => { setFechaEntrada(e.target.value); if (fechaSalida && fechaSalida <= e.target.value) setFechaSalida(""); }} className={inputClass} /></label>
          <label className="text-sm font-bold text-ink">{opcion.esHotel ? "Fecha de salida" : "Regreso opcional"}<input required={opcion.esHotel} type="date" min={fechaEntrada ? sumarDias(fechaEntrada, 1) : hoy} max={opcion.vigenciaFin ?? undefined} value={fechaSalida} onChange={(e) => setFechaSalida(e.target.value)} className={inputClass} /></label>
          <label className="text-sm font-bold text-ink">Adultos<input required type="number" min={1} max={50} value={adultos} onChange={(e) => setAdultos(Number(e.target.value))} className={inputClass} /></label>
          <label className="text-sm font-bold text-ink">Niños<input type="number" min={0} max={8} value={ninos} onChange={(e) => cambiarNinos(Number(e.target.value))} className={inputClass} /></label>
          {edades.map((edad, indice) => (
            <label key={indice} className="text-sm font-bold text-ink">Edad del niño {indice + 1}<input required type="number" min={0} max={17} value={edad} onChange={(e) => setEdades((actuales) => actuales.map((valor, i) => (i === indice ? Number(e.target.value) : valor)))} className={inputClass} /></label>
          ))}
          <label className="text-sm font-bold text-ink sm:col-span-2">Solicitudes especiales<textarea rows={4} value={notas} onChange={(e) => setNotas(e.target.value)} className={`${inputClass} py-3`} placeholder="Habitaciones, alimentación, celebración o cualquier detalle útil" /></label>
        </div>

        <section className="mt-6 rounded-2xl border border-seafoam/25 bg-seafoam-bg p-5" aria-live="polite">
          <p className="font-mono text-[0.68rem] font-bold uppercase tracking-[0.12em] text-seafoam-text">Total de la estadía</p>
          {totalEstimado != null ? (
            <><p className="mt-2 font-display text-3xl font-semibold text-ink">${totalEstimado.toFixed(2)} USD</p><p className="mt-2 text-sm leading-6 text-ink-soft">{viajerosPagos} viajero(s) con tarifa × {noches} {noches === 1 ? "noche" : "noches"} × ${opcion.precioUnitarioUsd?.toFixed(2)}. {opcion.ninosGratis > 0 ? `${Math.min(ninos, opcion.ninosGratis)} niño(s) incluidos sin cargo.` : ""}</p></>
          ) : opcion.calculoPrecio === "persona_noche" ? (
            <><p className="mt-2 text-xl font-bold text-ink">Selecciona entrada y salida</p><p className="mt-1 text-sm leading-6 text-ink-soft">El total se actualizará automáticamente según noches, adultos y niños.</p></>
          ) : (
            <><p className="mt-2 text-xl font-bold text-ink">Total por confirmar</p><p className="mt-1 text-sm leading-6 text-ink-soft">Esta opción no tiene una tarifa única por persona y noche; el asesor calculará el total exacto.</p></>
          )}
          <p className="mt-3 border-t border-seafoam/25 pt-3 text-xs leading-5 text-ink-soft">Monto referencial sujeto a edades, acomodación, disponibilidad y condiciones finales de la promoción.</p>
        </section>

        {promocionVencida ? <p className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral">La vigencia estructurada de esta promoción ya finalizó. Puedes volver al catálogo para elegir otra opción.</p> : null}

        {error ? <p className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert">{error}</p> : null}
        <button type="submit" disabled={enviando || promocionVencida} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-coral px-6 font-bold text-white shadow-[0_12px_28px_rgba(206,56,10,.18)] disabled:opacity-60">
          {enviando ? "Registrando solicitud…" : "Finalizar cotización"}
        </button>
        <p className="mt-3 text-center text-xs leading-5 text-ink-soft">No solicitamos cédula ni datos de pago en este formulario.</p>
      </form>
    </div>
  );
}
