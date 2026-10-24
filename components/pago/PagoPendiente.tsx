"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BarraFijaMovil } from "@/components/checkout/BarraFijaMovil";
import { ChipPlazo } from "@/components/checkout/ChipPlazo";
import { BotonCopiar, DatoCopiable } from "@/components/checkout/DatoCopiable";
import { Pasos } from "@/components/checkout/Pasos";
import { useEsEscritorio } from "@/components/checkout/useEsEscritorio";
import { TurnstileWidget } from "@/components/pago/TurnstileWidget";
import { ROTULO } from "@/components/reserva/PaseFechas";
import { Aviso } from "@/components/ui/Aviso";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { Archivo, Campo, Entrada } from "@/components/ui/Campo";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { registrarEvento } from "@/lib/analitica/eventos";
import { fechaHoraVenezuela, mensajePago, montoCentavos, montoParaCopiar, porcentajeIgtf } from "@/lib/checkout/formato";
import {
  archivoABase64,
  declarar,
  formatearMonto,
  instructivoDe,
  validarComprobante,
  type PagoPublico,
  type RielPago,
} from "@/lib/pago/pagar";
import { hospedajeDe, ResumenCompra } from "./ResumenCompra";

const ETIQUETA_REFERENCIA: Partial<Record<RielPago, string>> = {
  zelle: "Número de confirmación",
  binance: "TxID o número de orden",
};

/** Debajo del monto: qué incluye y con qué tasa se convirtió. «EUR» es tasa, no moneda: se paga en Bs. */
function notaMonto(pago: PagoPublico, igtf: string | null): string {
  const vence = fechaHoraVenezuela(pago.expira_en);
  if (pago.moneda === "VES") {
    const tasa = pago.tasa_usd_ves ? montoCentavos(Math.round(pago.tasa_usd_ves * 100), "VES") : null;
    const base =
      pago.tasa_tipo === "mixta"
        ? "Con las tasas del BCV (dólar y euro)"
        : tasa
          ? pago.tasa_tipo === "EUR" ? `Tasa euro del BCV: ${tasa}` : `Tasa del BCV: ${tasa} por US$ 1`
          : "A la tasa del BCV";
    return `${base}, válida hasta el ${vence}.`;
  }
  if (igtf) return `Incluye IGTF ${igtf.replace(".", ",")} %.`;
  return pago.reserva ? "" : `Link válido hasta el ${vence}.`;
}

/** Pago emitido: el boleto con el monto, los datos para pagar y el aviso «¿Ya pagó?». */
export function PagoPendiente({
  pago, token, onDeclarado, onVencer,
}: {
  pago: PagoPublico;
  token: string;
  onDeclarado: () => void;
  onVencer: () => void;
}) {
  const ins = instructivoDe(pago.riel);
  const reserva = pago.reserva ?? null;
  const hotel = reserva ? hospedajeDe(reserva)?.hotel ?? null : null;
  const igtf = reserva ? porcentajeIgtf(reserva.servicios) : null;
  const monto = formatearMonto(pago.monto_centavos, pago.moneda);
  const nota = notaMonto(pago, igtf);
  const escritorio = useEsEscritorio();

  // ---------- formulario «¿Ya pagó?» ----------
  const [referencia, setReferencia] = useState("");
  const [errorReferencia, setErrorReferencia] = useState<string | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileVuelta, setTurnstileVuelta] = useState(0);
  const [esperandoToken, setEsperandoToken] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refInput = useRef<HTMLInputElement>(null);
  const recibirTurnstile = useCallback((t: string | null) => setTurnstileToken(t), []);

  function elegirArchivo(input: HTMLInputElement) {
    setError(null);
    const file = input.files?.[0] ?? null;
    if (!file) { setArchivo(null); return; }
    const problema = validarComprobante(file);
    if (problema) {
      // Se vacía el campo: si quedara el nombre del archivo, parecería adjunto y no lo está.
      input.value = "";
      setArchivo(null);
      setError(mensajePago(problema === "formato" ? "comprobante_formato_invalido" : "comprobante_muy_grande"));
      return;
    }
    setArchivo(file);
  }

  async function enviarCon(tokenSeguridad: string) {
    setEnviando(true);
    setError(null);
    try {
      const comprobanteBase64 = archivo ? await archivoABase64(archivo) : undefined;
      const res = await declarar({
        token,
        referencia: referencia.trim(),
        turnstileToken: tokenSeguridad,
        comprobanteBase64,
        comprobanteMime: archivo?.type,
      });
      if (res.ok) {
        registrarEvento("pago_declarado", { meta: { token } });
        onDeclarado();
        return;
      }
      setError(mensajePago(res.error));
      setTurnstileToken(null); // el token de Turnstile es de un solo uso
      setTurnstileVuelta((v) => v + 1); // y el widget no se reinicia solo: se remonta para pedir otro
    } catch {
      // Solo puede fallar la lectura del archivo: declarar no lanza (la red cae como error "sin_red").
      setError("No pudimos leer el comprobante. Pruebe con otro archivo.");
    } finally {
      setEnviando(false);
    }
  }
  const enviarRef = useRef(enviarCon);
  enviarRef.current = enviarCon;

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enviando || esperandoToken) return;
    if (!referencia.trim()) {
      setErrorReferencia("Escriba el número de referencia del pago.");
      refInput.current?.focus();
      return;
    }
    // El botón nunca se apaga en silencio: sin token todavía, espera la verificación y envía solo.
    if (!turnstileToken) { setEsperandoToken(true); return; }
    void enviarCon(turnstileToken);
  }

  useEffect(() => {
    if (!esperandoToken || !turnstileToken) return;
    setEsperandoToken(false);
    void enviarRef.current(turnstileToken);
  }, [esperandoToken, turnstileToken]);

  // ---------- barra fija móvil: solo cuando «¿Ya pagó?» no está a la vista ----------
  const formRef = useRef<HTMLFormElement>(null);
  const [formEnVista, setFormEnVista] = useState(false);
  useEffect(() => {
    const el = formRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setFormEnVista(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function irAlFormulario() {
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    formRef.current?.scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "start" });
    refInput.current?.focus({ preventScroll: true });
  }

  // ---------- «Guarde este enlace» ----------
  const [enlace, setEnlace] = useState("");
  useEffect(() => setEnlace(window.location.href), []);

  const boleto = (
    <Boleto
      talonArriba
      tamanoTalon="8.5rem"
      talon={
        <div className="flex h-full flex-col justify-center gap-1.5 px-5 pt-1">
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 top-0 h-1" />
          <p className={ROTULO}>Monto exacto</p>
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-2xl font-bold leading-none tabular-nums text-ink sm:text-4xl">{monto}</p>
            <BotonCopiar valor={montoParaCopiar(pago.monto_centavos, pago.moneda)} que="el monto" />
          </div>
          {nota ? <p className="text-xs text-ink-soft">{nota}</p> : null}
        </div>
      }
    >
      {ins.datos.length > 0 ? (
        <dl className="flex flex-col px-5 py-2">
          {ins.datos.map((d) => (
            <DatoCopiable key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} />
          ))}
        </dl>
      ) : null}
    </Boleto>
  );

  const pasos = (
    <ol aria-label="Cómo pagar" className="flex flex-col gap-3">
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
  );

  const formulario = (
    <form
      ref={formRef}
      id="avisar"
      onSubmit={alEnviar}
      noValidate
      className="flex scroll-mt-20 flex-col gap-4 rounded-card border border-linea bg-card p-5"
    >
      <h2 className="font-display text-2xl font-bold leading-tight text-ink">¿Ya pagó? Avísenos</h2>
      <Campo etiqueta={ETIQUETA_REFERENCIA[pago.riel] ?? "Número de referencia"} requerido error={errorReferencia}>
        {(a11y) => (
          <Entrada
            {...a11y}
            ref={refInput}
            value={referencia}
            onChange={(e) => { setReferencia(e.target.value); setErrorReferencia(null); setError(null); }}
            placeholder="Ej: 001234567890"
            // Pago Móvil da referencias numéricas; Zelle y el TxID de Binance llevan letras.
            inputMode={pago.riel === "pago_movil" || pago.riel === "c2p" ? "numeric" : "text"}
            autoCapitalize="characters"
            spellCheck={false}
            autoComplete="off"
            className="font-mono tabular-nums"
          />
        )}
      </Campo>

      <Campo etiqueta="Captura del pago" ayuda="Recomendada: acelera la verificación. PDF, JPG, PNG o WebP, hasta 5 MB.">
        {(a11y) => <Archivo {...a11y} accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => elegirArchivo(e.target)} />}
      </Campo>

      <TurnstileWidget key={turnstileVuelta} onToken={recibirTurnstile} />

      {error ? <Aviso>{error}</Aviso> : null}

      <Boton type="submit" tamano="lg" ancho cargando={enviando || esperandoToken}>
        {esperandoToken ? "Verificando seguridad…" : enviando ? "Enviando…" : "Ya pagué"}
      </Boton>
      <p className="text-center text-sm text-ink-soft">
        Verificamos cada pago a mano. Nunca le pediremos claves ni datos de tarjeta.
      </p>
    </form>
  );

  const barra = (
    <BarraFijaMovil etiqueta="Monto y aviso de pago" visible={!formEnVista}>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className={ROTULO}>Monto exacto</p>
          <p className="truncate font-mono text-lg font-bold tabular-nums text-ink">{monto}</p>
        </div>
        <Boton type="button" tamano="md" onClick={irAlFormulario}>Ya pagué</Boton>
      </div>
    </BarraFijaMovil>
  );

  // Link de asesor (sin reserva detrás): una columna, sin pasos de la compra ni resumen.
  if (!reserva) {
    return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
        <header>
          <h1 className="font-display text-3xl font-bold leading-tight text-ink">{ins.titulo}</h1>
          <p className={ROTULO + " mt-2"}>{pago.tipo === "abono" ? "Abono / reserva" : "Pago total"}</p>
        </header>
        {boleto}
        {pasos}
        {formulario}
        {barra}
      </div>
    );
  }

  const textoWhatsapp = `Mi reserva ${reserva.codigo}${hotel ? ` en ${hotel}` : ""} con Destino y Eventos Lotus 360. Aquí pago y aviso: ${enlace}`;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start lg:gap-8 xl:gap-12">
      <div className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-3">
          <Pasos actual={2} className="lg:hidden" />
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight text-ink lg:text-4xl">{ins.titulo}</h1>
            <p className="mt-1 text-sm text-ink-soft">
              <span className="font-mono font-bold text-ink">{reserva.codigo}</span>
              {hotel ? ` · ${hotel}` : ""}
              <span className="hidden lg:inline"> · Paso 2 de 3</span>
            </p>
          </div>
          <div>
            <ChipPlazo hasta={pago.expira_en} onVencer={onVencer} />
          </div>
        </header>
        {boleto}
        {pasos}
      </div>

      <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
        <div className="lg:order-first">{formulario}</div>
        <ResumenCompra reserva={reserva} abierto={escritorio} />
        <section aria-labelledby="guardar-enlace" className="rounded-card border border-linea bg-card p-5">
          <h2 id="guardar-enlace" className="font-display text-lg font-bold leading-tight text-ink">Guarde este enlace</h2>
          <p className="mt-1 text-sm text-ink-soft">Si cierra esta página, con él vuelve a sus datos de pago.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <BotonCopiar valor={enlace} que="el enlace" />
            <Boton
              href={`https://wa.me/?text=${encodeURIComponent(textoWhatsapp)}`}
              variante="secundario"
              tamano="sm"
              iconoInicio={<WhatsAppIcon size={16} />}
            >
              Enviármelo por WhatsApp
            </Boton>
          </div>
        </section>
      </aside>
      {barra}
    </div>
  );
}
