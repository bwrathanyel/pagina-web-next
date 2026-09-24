"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useMemo, useState } from "react";
import { SolicitudLista } from "@/components/leads/SolicitudLista";
import { Boleto, TalonPrecio } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { Aviso } from "@/components/ui/Aviso";
import { AreaTexto, Campo, Entrada, Selector } from "@/components/ui/Campo";
import { Icono } from "@/components/ui/Icono";
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
    if (telefono.trim() && !telefonoPareceValido(telefono)) {
      setError("Revise el teléfono: debe tener de 7 a 15 dígitos, por ejemplo 0412-1234567 o +58 412-1234567.");
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
        "✅ *Confirmar disponibilidad y precio final. ¡Gracias!*",
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
      setError(codigo === "tiempo_agotado"
        ? "El sistema tardó demasiado en responder. No se registró la solicitud; espere unos segundos e inténtelo nuevamente."
        : codigo === "servicio_no_disponible"
          ? "El servicio no está disponible temporalmente. Sus datos no se perdieron; inténtelo nuevamente en un momento."
          : codigo === "datos_invalidos"
            ? "Revise el nombre y el teléfono antes de continuar."
            : "No pudimos registrar su solicitud. Inténtelo nuevamente en un momento.");
    } finally {
      setEnviando(false);
    }
  }

  if (confirmacion) {
    return (
      <div className="mx-auto max-w-xl">
        <SolicitudLista
          nivel="h1"
          waHref={confirmacion.whatsappHref}
          detalle="Solicitud registrada"
          titulo={confirmacion.numero ? `Cotización #${confirmacion.numero}` : "Cotización recibida"}
        >
          <p>
            La atiende {confirmacion.asesor}, que verificará disponibilidad y tarifa. WhatsApp es opcional: la solicitud
            ya quedó registrada.
          </p>
          <dl className="mt-5 grid gap-4 border-t border-dashed border-linea-fuerte pt-5 sm:grid-cols-2">
            <Dato termino="Opción" valor={opcion.nombre} />
            <Dato termino="Viajeros" valor={confirmacion.resumen.viajeros} />
            <Dato termino="Fechas" valor={confirmacion.resumen.fechas} />
            {confirmacion.resumen.telefono ? <Dato termino="Teléfono" valor={confirmacion.resumen.telefono} /> : null}
          </dl>
        </SolicitudLista>
        <Link
          href={opcion.volverHref}
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-semibold text-acento underline-offset-4 hover:underline"
        >
          <Icono nombre="flecha-izq" tamano={18} />
          Volver a la opción
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start lg:gap-12">
      <aside className="lg:sticky lg:top-[calc(var(--offset-sticky,0px)+1.5rem)]">
        <Boleto
          tamanoTalon="5.25rem"
          talon={
            <TalonPrecio
              precio={opcion.precio}
              codigo={opcion.destino}
              nota={opcion.vigenciaTexto ? `Vigencia: ${opcion.vigenciaTexto}` : null}
            />
          }
        >
          <div className="relative aspect-[16/10] bg-sand-2">
            {opcion.foto ? (
              <Image
                src={opcion.foto}
                alt=""
                fill
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="object-cover"
                loading="eager"
                fetchPriority="high"
              />
            ) : null}
          </div>
          <div className="p-5">
            <h1 className="font-display text-3xl font-bold leading-tight text-ink">{opcion.nombre}</h1>
            <p className="mt-2 font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">Opción elegida</p>
            {opcion.clase === "promocion" ? (
              <p className="mt-4 text-sm text-ink-soft">
                <span className="font-semibold text-ink">Niños gratis:</span>{" "}
                {opcion.ninosGratis > 0 ? opcion.ninosGratis : "No indicado"}
              </p>
            ) : null}
          </div>
        </Boleto>
      </aside>

      <form onSubmit={enviar} className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">Cuéntenos quiénes viajan</h2>
          <p className="mt-2 text-ink-soft">
            La opción ya está elegida. Con estos datos un asesor confirma disponibilidad.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Campo etiqueta="Nombre y apellido" requerido className="sm:col-span-2">
            {(a11y) => (
              <Entrada {...a11y} autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            )}
          </Campo>
          <Campo etiqueta="Teléfono" ayuda="Opcional. Formato 0412-1234567 o +58 412-1234567.">
            {(a11y) => (
              <Entrada
                {...a11y}
                type="tel"
                autoComplete="tel"
                inputMode="tel"
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
          <Campo etiqueta={opcion.esHotel ? "Fecha de entrada" : "Fecha de viaje"} requerido>
            {(a11y) => (
              <Entrada
                {...a11y}
                type="date"
                min={hoy}
                max={opcion.vigenciaFin ?? undefined}
                value={fechaEntrada}
                onChange={(e) => {
                  setFechaEntrada(e.target.value);
                  if (fechaSalida && fechaSalida <= e.target.value) setFechaSalida("");
                }}
              />
            )}
          </Campo>
          <Campo
            etiqueta={opcion.esHotel ? "Fecha de salida" : "Fecha de regreso"}
            ayuda={opcion.esHotel ? undefined : "Opcional."}
            requerido={opcion.esHotel}
          >
            {(a11y) => (
              <Entrada
                {...a11y}
                type="date"
                min={fechaEntrada ? sumarDias(fechaEntrada, 1) : hoy}
                max={opcion.vigenciaFin ?? undefined}
                value={fechaSalida}
                onChange={(e) => setFechaSalida(e.target.value)}
              />
            )}
          </Campo>
          <Cantidad etiqueta="Adultos" unidad="adulto" valor={adultos} min={1} max={50} onCambio={setAdultos} />
          <Cantidad etiqueta="Niños" unidad="niño" valor={ninos} min={0} max={8} onCambio={cambiarNinos} />
          {edades.map((edad, indice) => (
            <Campo key={indice} etiqueta={`Edad del niño ${indice + 1}`} requerido>
              {(a11y) => (
                <Selector
                  {...a11y}
                  value={edad}
                  onChange={(e) =>
                    setEdades((actuales) => actuales.map((valor, i) => (i === indice ? Number(e.target.value) : valor)))
                  }
                >
                  {EDADES.map((n) => (
                    <option key={n} value={n}>
                      {n === 0 ? "Menos de 1 año" : `${n} ${n === 1 ? "año" : "años"}`}
                    </option>
                  ))}
                </Selector>
              )}
            </Campo>
          ))}
          <Campo etiqueta="Solicitudes especiales" ayuda="Habitaciones, alimentación, una celebración o cualquier detalle útil." className="sm:col-span-2">
            {(a11y) => <AreaTexto {...a11y} rows={3} value={notas} onChange={(e) => setNotas(e.target.value)} />}
          </Campo>
        </div>

        <section className="rounded-card bg-seafoam-bg p-5" aria-live="polite" aria-labelledby="total-estadia">
          <p id="total-estadia" className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-seafoam-text">
            Total de la estadía
          </p>
          {totalEstimado != null ? (
            <>
              <p className="mt-2 font-mono text-3xl font-bold tabular-nums text-ink">
                ${totalEstimado.toFixed(2)} USD
              </p>
              <p className="mt-2 text-sm text-ink-soft">
                {viajerosPagos} {viajerosPagos === 1 ? "viajero" : "viajeros"} con tarifa × {noches}{" "}
                {noches === 1 ? "noche" : "noches"} × ${opcion.precioUnitarioUsd?.toFixed(2)}.{" "}
                {opcion.ninosGratis > 0
                  ? `${Math.min(ninos, opcion.ninosGratis)} ${Math.min(ninos, opcion.ninosGratis) === 1 ? "niño incluido" : "niños incluidos"} sin cargo.`
                  : ""}
              </p>
            </>
          ) : opcion.calculoPrecio === "persona_noche" ? (
            <>
              <p className="mt-2 text-xl font-bold text-ink">Elija entrada y salida</p>
              <p className="mt-1 text-sm text-ink-soft">El total se calcula solo según noches, adultos y niños.</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-xl font-bold text-ink">Total por confirmar</p>
              <p className="mt-1 text-sm text-ink-soft">
                Esta opción no tiene una tarifa única por persona y noche: el asesor le calcula el total exacto.
              </p>
            </>
          )}
          <p className="mt-3 border-t border-dashed border-seafoam-text/30 pt-3 text-xs text-ink-soft">
            Monto referencial, sujeto a edades, acomodación, disponibilidad y condiciones finales de la promoción.
          </p>
        </section>

        {promocionVencida ? (
          <Aviso tono="info">La vigencia de esta promoción ya terminó. Puede volver al catálogo y elegir otra opción.</Aviso>
        ) : null}
        {error ? <Aviso>{error}</Aviso> : null}

        <div>
          <Boton type="submit" tamano="lg" ancho cargando={enviando} disabled={promocionVencida}>
            Enviar solicitud
          </Boton>
          <p className="mt-3 text-center text-sm text-ink-soft">No pedimos cédula ni datos de pago en este formulario.</p>
        </div>
      </form>
    </div>
  );
}

const EDADES = Array.from({ length: 18 }, (_, n) => n);

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft">{termino}</dt>
      <dd className="mt-1 font-semibold text-ink">{valor}</dd>
    </div>
  );
}

/** Selector de cantidad con el pulgar: − valor +, objetivos de 44px. */
function Cantidad({
  etiqueta,
  unidad,
  valor,
  min,
  max,
  onCambio,
}: {
  etiqueta: string;
  unidad: string;
  valor: number;
  min: number;
  max: number;
  onCambio: (valor: number) => void;
}) {
  const id = useId();
  const boton =
    "flex h-11 w-11 items-center justify-center rounded-control text-ink transition-colors duration-150 hover:bg-sand-2 disabled:pointer-events-none disabled:opacity-40";
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-1.5">
      <span id={id} className="text-sm font-semibold text-ink">
        {etiqueta}
      </span>
      <div className="flex min-h-12 items-center justify-between rounded-control border border-linea-fuerte bg-card p-0.5">
        <button type="button" onClick={() => onCambio(Math.max(min, valor - 1))} disabled={valor <= min} aria-label={`Quitar un ${unidad}`} className={boton}>
          <Icono nombre="menos" />
        </button>
        <output aria-live="polite" className="font-mono text-lg font-bold tabular-nums text-ink">
          {valor}
        </output>
        <button type="button" onClick={() => onCambio(Math.min(max, valor + 1))} disabled={valor >= max} aria-label={`Agregar un ${unidad}`} className={boton}>
          <Icono nombre="suma" />
        </button>
      </div>
    </div>
  );
}
