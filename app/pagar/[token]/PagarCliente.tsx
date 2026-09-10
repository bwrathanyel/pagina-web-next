"use client";

import { useCallback, useEffect, useState } from "react";
import { TurnstileWidget } from "@/components/pago/TurnstileWidget";
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

const inputClass =
  "mt-1.5 min-h-12 w-full rounded-xl border border-ink/15 bg-sand px-4 text-base text-ink outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/15";

const ERRORES: Record<string, string> = {
  falta_referencia: "Escribe el número de referencia del pago.",
  captcha_invalido: "No pudimos verificar que no eres un robot. Recarga la página e inténtalo de nuevo.",
  comprobante_formato_invalido: "El comprobante debe ser PDF, JPG, PNG o WebP.",
  comprobante_muy_grande: "El comprobante no puede pesar más de 5MB.",
  comprobante_invalido: "No pudimos procesar el comprobante. Prueba con otro archivo.",
  estado_no_declarable: "Este pago ya no admite una nueva declaración.",
  vencido: "El link de pago venció. Pídele a tu asesor un link nuevo.",
  tiempo_agotado: "El servicio tardó demasiado en responder. Inténtalo de nuevo en un momento.",
};
const mensajeError = (codigo?: string) =>
  (codigo && ERRORES[codigo]) || "No pudimos registrar tu pago. Inténtalo de nuevo en un momento.";

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border border-ink/10 bg-card p-6 shadow-[0_24px_70px_-38px_rgba(36,31,26,.45)] md:p-8">
      {children}
    </div>
  );
}

function Aviso({ titulo, texto, tono = "neutro" }: { titulo: string; texto: string; tono?: "ok" | "malo" | "neutro" }) {
  const color =
    tono === "ok" ? "bg-seafoam-bg text-seafoam-text"
      : tono === "malo" ? "bg-coral/10 text-coral"
        : "bg-sand-2 text-ink-soft";
  return (
    <Marco>
      <span className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${color}`} aria-hidden="true">
        {tono === "ok" ? "✓" : tono === "malo" ? "!" : "•"}
      </span>
      <h1 className="text-center font-display text-2xl font-semibold text-ink">{titulo}</h1>
      <p className="mt-3 text-center leading-7 text-ink-soft">{texto}</p>
    </Marco>
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
    if (!referencia.trim()) { setError("Escribe el número de referencia del pago."); return; }
    if (!turnstileToken) { setError("Completa la verificación de seguridad."); return; }

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
      setError("No pudimos leer el comprobante. Prueba con otro archivo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!estado) {
    return <Marco><p className="text-center text-ink-soft">Cargando…</p></Marco>;
  }

  if (!estado.ok) {
    return <Aviso tono="malo" titulo="Link no válido" texto="Este link de pago no existe o ya no está disponible. Pídele a tu asesor uno nuevo." />;
  }

  if (declarado || estado.estado === "pendiente_verificacion") {
    return (
      <Aviso
        tono="ok"
        titulo="¡Recibimos tu pago!"
        texto="Estamos verificando la transferencia. Apenas quede confirmada, tu asesor te avisa. No necesitas hacer nada más."
      />
    );
  }
  if (estado.estado === "verificado") {
    return <Aviso tono="ok" titulo="Pago confirmado" texto="Este pago ya fue verificado. Gracias." />;
  }
  if (estado.estado === "vencido") {
    return <Aviso tono="malo" titulo="El link venció" texto="Este link de pago expiró. Pídele a tu asesor un link nuevo para completar el pago." />;
  }
  if (estado.estado === "rechazado") {
    return <Aviso tono="malo" titulo="Pago rechazado" texto="No pudimos validar este pago. Comunícate con tu asesor para resolverlo." />;
  }
  if (estado.estado === "reembolsado") {
    return <Aviso titulo="Pago reembolsado" texto="Este pago fue reembolsado. Si tienes dudas, escríbele a tu asesor." />;
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
  const vence = new Date(pago.expira_en);

  return (
    <Marco>
      <p className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-coral">
        {pago.tipo === "abono" ? "Abono / Reserva" : "Pago total"}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink">{ins.titulo}</h1>

      <div className="mt-5 rounded-2xl bg-sand-2 px-5 py-4">
        <p className="text-sm text-ink-soft">Monto a pagar</p>
        <p className="font-display text-3xl font-semibold text-ink">{formatearMonto(pago.monto_centavos, pago.moneda)}</p>
        {pago.moneda === "VES" && pago.tasa_usd_ves ? (
          <p className="mt-1 text-xs text-ink-soft">Tasa aplicada: Bs {pago.tasa_usd_ves} por USD. Válida hasta el {vence.toLocaleString("es-VE")}.</p>
        ) : (
          <p className="mt-1 text-xs text-ink-soft">Link válido hasta el {vence.toLocaleString("es-VE")}.</p>
        )}
      </div>

      {ins.datos.length > 0 ? (
        <dl className="mt-4 divide-y divide-ink/10 rounded-2xl border border-ink/10">
          {ins.datos.map((d) => (
            <div key={d.etiqueta} className="flex items-center justify-between gap-3 px-4 py-3">
              <dt className="text-sm text-ink-soft">{d.etiqueta}</dt>
              <dd className="text-right text-sm font-bold text-ink">{d.valor}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <ol className="mt-4 flex list-decimal flex-col gap-2 pl-5 text-sm leading-6 text-ink-soft">
        {ins.pasos.map((p) => <li key={p}>{p}</li>)}
      </ol>

      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-5">
        <label className="text-sm font-bold text-ink">
          Número de referencia
          <input
            required
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
            className={inputClass}
            placeholder="Ej: 001234567890"
            inputMode="numeric"
          />
        </label>

        <label className="text-sm font-bold text-ink">
          Adjuntar comprobante (PDF, JPG, PNG o WebP, máx. 5MB)
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => onArchivo(e.target.files?.[0] ?? null)}
            className="mt-1.5 block w-full text-sm text-ink-soft file:mr-4 file:min-h-11 file:rounded-xl file:border-0 file:bg-sand-2 file:px-4 file:font-bold file:text-ink"
          />
        </label>

        <TurnstileWidget onToken={onTurnstile} />

        {error ? <p className="rounded-xl bg-coral/10 px-4 py-3 text-sm font-semibold text-coral" role="alert">{error}</p> : null}

        <button
          type="submit"
          disabled={enviando || !turnstileOk}
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-coral px-6 font-bold text-white shadow-[0_12px_28px_rgba(206,56,10,.18)] disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Ya pagué, enviar comprobante"}
        </button>
        <p className="text-center text-xs leading-5 text-ink-soft">
          Verificamos cada pago manualmente. No compartas tu clave ni datos de tu tarjeta en este formulario.
        </p>
      </form>
    </Marco>
  );
}
