"use client";

import { useCallback, useEffect, useState } from "react";
import { TurnstileWidget } from "@/components/pago/TurnstileWidget";
import { Boleto } from "@/components/ui/Boleto";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Archivo, Campo, Entrada } from "@/components/ui/Campo";
import { Esqueleto } from "@/components/ui/Esqueleto";
import { Icono } from "@/components/ui/Icono";
import { registrarEvento } from "@/lib/analitica/eventos";
import {
  archivoABase64,
  consultarEstado,
  declarar,
  formatearMonto,
  instructivoDe,
  validarComprobante,
  type PagoPublico,
  type RespuestaEstado,
} from "@/lib/pago/pagar";

const ERRORES: Record<string, string> = {
  falta_referencia: "Escriba el número de referencia del pago.",
  captcha_invalido: "No pudimos verificar que no es un robot. Recargue la página e inténtelo de nuevo.",
  comprobante_formato_invalido: "El comprobante debe ser PDF, JPG, PNG o WebP.",
  comprobante_muy_grande: "El comprobante no puede pesar más de 5MB.",
  comprobante_invalido: "No pudimos procesar el comprobante. Pruebe con otro archivo.",
  estado_no_declarable: "Este pago ya no admite una nueva declaración.",
  vencido: "El link de pago venció. Pídale a su asesor un link nuevo.",
  tiempo_agotado: "El servicio tardó demasiado en responder. Inténtelo de nuevo en un momento.",
};
const mensajeError = (codigo?: string) =>
  (codigo && ERRORES[codigo]) || "No pudimos registrar su pago. Inténtelo de nuevo en un momento.";

const ETIQUETA = "font-mono text-xs font-bold uppercase tracking-[0.14em] text-ink-soft";

function Estado({ titulo, texto, tono = "neutro" }: { titulo: string; texto: string; tono?: "ok" | "malo" | "neutro" }) {
  const color =
    tono === "ok" ? "bg-seafoam-bg text-seafoam-text"
      : tono === "malo" ? "bg-peligro-suave text-peligro"
        : "bg-sand-2 text-ink-soft";
  return (
    <div className="rounded-card border border-linea bg-card p-6 md:p-8" role={tono === "malo" ? "alert" : "status"}>
      <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-pill ${color}`} aria-hidden="true">
        <Icono nombre={tono === "ok" ? "check" : "alerta"} tamano={22} />
      </span>
      <h1 className="font-display text-3xl font-bold leading-tight text-ink">{titulo}</h1>
      <p className="mt-3 text-ink-soft">{texto}</p>
    </div>
  );
}

export function PagarCliente({ token }: { token: string }) {
  const [estado, setEstado] = useState<RespuestaEstado | null>(null);
  const [referencia, setReferencia] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [declarado, setDeclarado] = useState(false);

  useEffect(() => {
    let vivo = true;
    consultarEstado(token).then((r) => {
      if (!vivo) return;
      setEstado(r);
      if (r.ok) registrarEvento("abrir_pago", { meta: { estado: r.estado } });
    });
    return () => { vivo = false; };
  }, [token]);

  const recibirTurnstile = useCallback((t: string | null) => setTurnstileToken(t), []);

  function elegirArchivo(file: File | null) {
    setError(null);
    if (!file) { setArchivo(null); return; }
    const problema = validarComprobante(file);
    if (problema === "formato") { setError("El comprobante debe ser PDF, JPG, PNG o WebP."); return; }
    if (problema === "tamano") { setError("El comprobante no puede pesar más de 5MB."); return; }
    setArchivo(file);
  }

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando) return;
    if (!referencia.trim()) { setError("Escriba el número de referencia del pago."); return; }
    if (!turnstileToken) { setError("Complete la verificación de seguridad."); return; }

    setEnviando(true);
    setError(null);
    try {
      const comprobanteBase64 = archivo ? await archivoABase64(archivo) : undefined;
      const res = await declarar({
        token,
        referencia: referencia.trim(),
        turnstileToken,
        comprobanteBase64,
        comprobanteMime: archivo?.type,
      });
      if (res.ok) { registrarEvento("pago_declarado", { meta: { token } }); setDeclarado(true); return; }
      setError(mensajeError(res.error));
      setTurnstileToken(null); // el token de Turnstile es de un solo uso
    } catch {
      setError("No pudimos leer el comprobante. Pruebe con otro archivo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!estado) {
    return (
      <div aria-busy="true" className="flex flex-col gap-4">
        <span className="sr-only">Cargando el pago…</span>
        <Esqueleto className="h-64 rounded-card" />
        <Esqueleto className="h-12" />
        <Esqueleto className="h-12" />
      </div>
    );
  }

  if (!estado.ok) {
    return <Estado tono="malo" titulo="Link no válido" texto="Este link de pago no existe o ya no está disponible. Pídale a su asesor uno nuevo." />;
  }

  if (declarado || estado.estado === "pendiente_verificacion") {
    return (
      <Estado
        tono="ok"
        titulo="¡Recibimos su pago!"
        texto="Estamos verificando la transferencia. Apenas quede confirmada, su asesor le avisa. No necesita hacer nada más."
      />
    );
  }
  if (estado.estado === "verificado") {
    return <Estado tono="ok" titulo="Pago confirmado" texto="Este pago ya fue verificado. Gracias." />;
  }
  if (estado.estado === "vencido") {
    return <Estado tono="malo" titulo="El link venció" texto="Este link de pago expiró. Pídale a su asesor un link nuevo para completar el pago." />;
  }
  if (estado.estado === "rechazado") {
    return <Estado tono="malo" titulo="Pago rechazado" texto="No pudimos validar este pago. Comuníquese con su asesor para resolverlo." />;
  }
  if (estado.estado === "reembolsado") {
    return <Estado titulo="Pago reembolsado" texto="Este pago fue reembolsado. Si tiene dudas, escríbale a su asesor." />;
  }

  return <Formulario
    pago={estado}
    referencia={referencia}
    setReferencia={(v) => { setReferencia(v); setError(null); }}
    onArchivo={elegirArchivo}
    onTurnstile={recibirTurnstile}
    turnstileOk={Boolean(turnstileToken)}
    enviando={enviando}
    error={error}
    onSubmit={enviar}
  />;
}

function Formulario({
  pago, referencia, setReferencia, onArchivo, onTurnstile, turnstileOk, enviando, error, onSubmit,
}: {
  pago: PagoPublico;
  referencia: string;
  setReferencia: (v: string) => void;
  onArchivo: (f: File | null) => void;
  onTurnstile: (t: string | null) => void;
  turnstileOk: boolean;
  enviando: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}) {
  const ins = instructivoDe(pago.riel);
  const vence = new Date(pago.expira_en).toLocaleString("es-VE");

  return (
    <div className="flex flex-col gap-8">
      <Boleto
        tamanoTalon="7rem"
        talon={
          <div className="flex h-full flex-col justify-center px-5">
            <p className={ETIQUETA}>Monto a pagar</p>
            <p className="mt-1 font-mono text-3xl font-bold leading-none tabular-nums text-ink">
              {formatearMonto(pago.monto_centavos, pago.moneda)}
            </p>
            <p className="mt-2 text-xs text-ink-soft">
              {pago.moneda === "VES" && pago.tasa_usd_ves
                ? `Tasa: Bs ${pago.tasa_usd_ves} por USD, válida hasta el ${vence}.`
                : `Link válido hasta el ${vence}.`}
            </p>
            <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
          </div>
        }
      >
        <div className="p-6">
          <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">{ins.titulo}</h1>
          <p className={"mt-2 " + ETIQUETA}>{pago.tipo === "abono" ? "Abono / reserva" : "Pago total"}</p>

          {ins.datos.length > 0 ? (
            <dl className="mt-5 flex flex-col border-t border-dashed border-linea-fuerte">
              {ins.datos.map((d) => (
                <DatoCopiable key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} />
              ))}
            </dl>
          ) : null}
        </div>
      </Boleto>

      <section aria-labelledby="pasos-pago">
        <h2 id="pasos-pago" className="font-display text-2xl font-bold leading-tight text-ink">Cómo pagar</h2>
        <ol className="mt-4 flex flex-col gap-3">
          {ins.pasos.map((p, i) => (
            <li key={p} className="flex gap-3 text-ink-soft">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-sand-2 font-mono text-xs font-bold text-ink"
              >
                {i + 1}
              </span>
              <span className="pt-0.5">{p}</span>
            </li>
          ))}
        </ol>
      </section>

      <form onSubmit={onSubmit} className="flex flex-col gap-5 border-t border-linea pt-8">
        <h2 className="font-display text-2xl font-bold leading-tight text-ink">¿Ya pagó? Avísenos</h2>
        <Campo etiqueta="Número de referencia" requerido>
          {(a11y) => (
            <Entrada
              {...a11y}
              value={referencia}
              onChange={(e) => setReferencia(e.target.value)}
              placeholder="Ej: 001234567890"
              inputMode="numeric"
              autoComplete="off"
              className="font-mono tabular-nums"
            />
          )}
        </Campo>

        <Campo etiqueta="Comprobante" ayuda="Opcional. PDF, JPG, PNG o WebP, hasta 5 MB.">
          {(a11y) => (
            <Archivo {...a11y} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => onArchivo(e.target.files?.[0] ?? null)} />
          )}
        </Campo>

        <TurnstileWidget onToken={onTurnstile} />

        {error ? (
          <Aviso>{error}</Aviso>
        ) : null}

        <Boton type="submit" tamano="lg" ancho cargando={enviando} disabled={!turnstileOk}>
          Ya pagué, enviar comprobante
        </Boton>
        <p className="text-center text-sm text-ink-soft">
          Verificamos cada pago a mano. No comparta su clave ni los datos de su tarjeta en este formulario.
        </p>
      </form>
    </div>
  );
}

/** Fila de datos bancarios con botón de copiar: en el teléfono se paga desde
 * otra app, y transcribir una cédula o un número de cuenta es donde se falla. */
function DatoCopiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el valor sigue visible para copiarlo a mano.
    }
  }

  return (
    <div className="flex items-center gap-3 border-b border-dashed border-linea-fuerte py-2 last:border-b-0">
      <div className="min-w-0 flex-1">
        <dt className="text-sm text-ink-soft">{etiqueta}</dt>
        <dd className="break-words font-mono font-bold text-ink">{valor}</dd>
      </div>
      <button
        type="button"
        onClick={copiar}
        aria-label={copiado ? `${etiqueta} copiado` : `Copiar ${etiqueta}`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-soft transition-colors duration-150 hover:bg-sand-2 hover:text-ink"
      >
        <Icono nombre={copiado ? "check" : "copiar"} tamano={18} className={copiado ? "text-seafoam-text" : ""} />
      </button>
      <span className="sr-only" aria-live="polite">
        {copiado ? `${etiqueta} copiado` : ""}
      </span>
    </div>
  );
}
