"use client";

import { useState } from "react";
import type { ModalidadEmpleo } from "@/lib/empleo/postularEmpleo";
import { archivoABase64, enviarPostulacion, validarArchivoCV } from "@/lib/empleo/postularEmpleo";

const inputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-ink/15 bg-sand px-4 text-base text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/15";

const ROLES_PRESENCIAL = ["Asesor(a) / Ejecutivo(a) de Ventas", "Asistente Administrativo", "Agente de Boletería Aérea"];

function telefonoPareceValido(valor: string) {
  if (!/^[+\d\s().-]+$/.test(valor.trim())) return false;
  const digitos = valor.replace(/\D/g, "");
  return digitos.length >= 7 && digitos.length <= 15;
}

export function PostulacionForm({ modalidadInicial }: { modalidadInicial: ModalidadEmpleo }) {
  const [modalidad, setModalidad] = useState<ModalidadEmpleo>(modalidadInicial);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [rolInteres, setRolInteres] = useState(modalidadInicial === "presencial" ? ROLES_PRESENCIAL[0] : "Asesor de Ventas Freelance");
  const [mensaje, setMensaje] = useState("");
  const [cv, setCv] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function cambiarModalidad(nueva: ModalidadEmpleo) {
    setModalidad(nueva);
    setRolInteres(nueva === "presencial" ? ROLES_PRESENCIAL[0] : "Asesor de Ventas Freelance");
  }

  function elegirArchivo(file: File | null) {
    setError(null);
    if (!file) { setCv(null); return; }
    const problema = validarArchivoCV(file);
    if (problema === "formato") { setError("El CV debe ser PDF, JPG o PNG."); return; }
    if (problema === "tamano") { setError("El archivo no puede pesar más de 5MB."); return; }
    setCv(file);
  }

  async function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando) return;
    if (!telefonoPareceValido(telefono)) {
      setError("Escribe un número válido de 7 a 15 dígitos. Puedes usar formato 0412-1234567 o +58 412-1234567.");
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const cvBase64 = cv ? await archivoABase64(cv) : undefined;
      await enviarPostulacion({
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        modalidad,
        rolInteres,
        mensaje: mensaje.trim() || undefined,
        cvBase64,
        cvMime: cv?.type,
      });
      setEnviado(true);
    } catch (submitError) {
      const codigo = submitError instanceof Error ? submitError.message : "";
      setError(
        codigo === "cv_muy_grande"
          ? "El CV no puede pesar más de 5MB."
          : codigo === "cv_formato_invalido" || codigo === "cv_invalido"
            ? "No pudimos procesar el CV -- prueba con un PDF, JPG o PNG distinto."
            : codigo === "datos_invalidos"
              ? "Revisa el nombre y el teléfono antes de continuar."
              : "No pudimos enviar tu postulación. Inténtalo nuevamente en un momento.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-[28px] border border-seafoam/25 bg-card p-6 text-center shadow-[0_24px_70px_-38px_rgba(36,31,26,.5)] md:p-9">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-seafoam-bg text-2xl text-seafoam-text" aria-hidden="true">✓</span>
        <h3 className="font-display text-2xl font-semibold text-ink">¡Postulación enviada!</h3>
        <p className="mt-3 leading-7 text-ink-soft">
          Recibimos tus datos{cv ? " y tu CV" : ""}. Si tu perfil calza con lo que buscamos, te contactaremos por
          teléfono o correo -- ahí te compartimos todos los detalles de la vacante.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-[28px] border border-ink/10 bg-card p-6 shadow-[0_24px_70px_-38px_rgba(36,31,26,.45)] md:p-8">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-coral">Postulación</p>
      <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Cuéntanos de ti.</h2>

      <div className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-sand-2 p-1.5">
        {(["presencial", "freelance"] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => cambiarModalidad(valor)}
            className={`min-h-11 rounded-lg text-sm font-bold transition ${modalidad === valor ? "bg-coral text-white shadow" : "text-ink-soft"}`}
          >
            {valor === "presencial" ? "Presencial" : "Freelance"}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-ink sm:col-span-2">
          Nombre y apellido
          <input required autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Escribe tu nombre completo" />
        </label>
        <label className="text-sm font-bold text-ink">
          Teléfono
          <input required autoComplete="tel" inputMode="tel" value={telefono} onChange={(e) => { setTelefono(e.target.value); setError(null); }} className={inputClass} placeholder="Ej: 0412-1234567" />
        </label>
        <label className="text-sm font-bold text-ink">
          Correo opcional
          <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@correo.com" />
        </label>

        {modalidad === "presencial" ? (
          <label className="text-sm font-bold text-ink sm:col-span-2">
            Vacante de interés
            <select value={rolInteres} onChange={(e) => setRolInteres(e.target.value)} className={inputClass}>
              {ROLES_PRESENCIAL.map((rol) => <option key={rol} value={rol}>{rol}</option>)}
            </select>
          </label>
        ) : null}

        <label className="text-sm font-bold text-ink sm:col-span-2">
          {modalidad === "presencial" ? "Experiencia comprobable" : "Contanos tu experiencia y disponibilidad de turno"}
          <textarea
            rows={4}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className={`${inputClass} py-3`}
            placeholder={modalidad === "presencial" ? "Años de experiencia, empresas anteriores, lo que quieras contarnos" : "Ej: experiencia en ventas, prefiero turno nocturno, etc."}
          />
        </label>

        <label className="text-sm font-bold text-ink sm:col-span-2">
          Adjuntar CV (PDF, JPG o PNG, máx. 5MB)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
            className="mt-1.5 block w-full text-sm text-ink-soft file:mr-4 file:min-h-11 file:rounded-xl file:border-0 file:bg-sand-2 file:px-4 file:font-bold file:text-ink"
          />
        </label>
      </div>

      {error ? <p className="mt-5 rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert">{error}</p> : null}
      <button type="submit" disabled={enviando} className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-coral px-6 font-bold text-white shadow-[0_12px_28px_rgba(206,56,10,.18)] disabled:opacity-60">
        {enviando ? "Enviando…" : "Enviar postulación"}
      </button>
      <p className="mt-3 text-center text-xs leading-5 text-ink-soft">No compartas datos de pago ni contraseñas en este formulario.</p>
    </form>
  );
}
