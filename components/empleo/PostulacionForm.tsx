"use client";

import { useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { AreaTexto, Archivo, Campo, Entrada, Selector } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
import type { ModalidadEmpleo } from "@/lib/empleo/postularEmpleo";
import { archivoABase64, enviarPostulacion, validarArchivoCV } from "@/lib/empleo/postularEmpleo";

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
      setError("Revise el teléfono: debe tener de 7 a 15 dígitos, por ejemplo 0412-1234567 o +58 412-1234567.");
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
            ? "No pudimos procesar el CV. Pruebe con un PDF, JPG o PNG distinto."
            : codigo === "datos_invalidos"
              ? "Revise el nombre y el teléfono antes de continuar."
              : "No pudimos enviar su postulación. Inténtelo nuevamente en un momento.",
      );
    } finally {
      setEnviando(false);
    }
  }

  if (enviado) {
    return (
      <div className="rounded-card border border-linea bg-card p-6 md:p-8" role="status">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-pill bg-seafoam-bg text-seafoam-text" aria-hidden="true">
          <Icono nombre="check" tamano={22} />
        </span>
        <h3 className="font-display text-3xl font-bold leading-tight text-ink">Postulación enviada</h3>
        <p className="mt-3 text-ink-soft">
          Recibimos sus datos{cv ? " y su CV" : ""}. Si su perfil calza con lo que buscamos, le escribimos por teléfono o
          correo con todos los detalles de la vacante.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-6 rounded-card border border-linea bg-card p-6 md:p-8">
      <fieldset>
        <legend className="mb-1.5 text-sm font-semibold text-ink">Modalidad</legend>
        <div className="grid grid-cols-2 gap-1 rounded-control bg-sand-2 p-1">
          {(["presencial", "freelance"] as const).map((valor) => (
            <label
              key={valor}
              className={
                "flex min-h-11 cursor-pointer items-center justify-center rounded-control text-sm font-semibold text-ink-soft transition-colors duration-150 hover:text-ink " +
                "has-[:checked]:bg-acento has-[:checked]:text-sobre-acento has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20"
              }
            >
              <input
                type="radio"
                name="modalidad"
                value={valor}
                checked={modalidad === valor}
                onChange={() => cambiarModalidad(valor)}
                className="sr-only"
              />
              {valor === "presencial" ? "Presencial" : "Freelance"}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <Campo etiqueta="Nombre y apellido" requerido className="sm:col-span-2">
          {(a11y) => <Entrada {...a11y} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />}
        </Campo>
        <Campo etiqueta="Teléfono" requerido>
          {(a11y) => (
            <Entrada
              {...a11y}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              placeholder="0412-1234567"
              value={telefono}
              onChange={(e) => {
                setTelefono(e.target.value);
                setError(null);
              }}
            />
          )}
        </Campo>
        <Campo etiqueta="Correo" ayuda="Opcional.">
          {(a11y) => (
            <Entrada {...a11y} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          )}
        </Campo>

        {modalidad === "presencial" ? (
          <Campo etiqueta="Vacante de interés" className="sm:col-span-2">
            {(a11y) => (
              <Selector {...a11y} value={rolInteres} onChange={(e) => setRolInteres(e.target.value)}>
                {ROLES_PRESENCIAL.map((rol) => (
                  <option key={rol} value={rol}>
                    {rol}
                  </option>
                ))}
              </Selector>
            )}
          </Campo>
        ) : null}

        <Campo
          etiqueta={modalidad === "presencial" ? "Experiencia comprobable" : "Su experiencia y disponibilidad de turno"}
          ayuda={
            modalidad === "presencial"
              ? "Años de experiencia, empresas anteriores, lo que desee contarnos."
              : "Por ejemplo: experiencia en ventas, prefiero el turno nocturno."
          }
          className="sm:col-span-2"
        >
          {(a11y) => <AreaTexto {...a11y} rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />}
        </Campo>

        <Campo etiqueta="CV" ayuda="Opcional. PDF, JPG o PNG, hasta 5 MB." className="sm:col-span-2">
          {(a11y) => <Archivo {...a11y} accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)} />}
        </Campo>
      </div>

      {error ? <Aviso>{error}</Aviso> : null}
      <div>
        <Boton type="submit" tamano="lg" ancho cargando={enviando}>
          Enviar postulación
        </Boton>
        <p className="mt-3 text-center text-sm text-ink-soft">No comparta datos de pago ni contraseñas en este formulario.</p>
      </div>
    </form>
  );
}
