"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCheckoutConfig } from "@/components/checkout/useCheckoutConfig";
import { Avance, Encabezado } from "@/components/cuenta/PlanesUI";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Aviso } from "@/components/ui/Aviso";
import { Boton } from "@/components/ui/Boton";
import { Etiqueta } from "@/components/ui/Insignia";
import type { Riel } from "@/lib/checkout/calculo";
import { fechaCorta, usd } from "@/lib/checkout/formato";
import { hoyCaracas } from "@/lib/cotizador/cotizacionRapida";
import { emitirPago, esAbierto, estadoPlan, TEXTO_ESTADO, type EstadoCuota, type PlanEstado } from "@/lib/planes/planes";

const RIELES: { id: Riel; titulo: string; moneda: string }[] = [
  { id: "zelle", titulo: "Zelle", moneda: "Dólares" },
  { id: "pago_movil", titulo: "Pago Móvil", moneda: "Bolívares" },
  { id: "binance", titulo: "Binance", moneda: "USDT" },
];

const TEXTO_CUOTA: Record<EstadoCuota, { texto: string; tono: "acento" | "ambar" | "seafoam" | "neutro" }> = {
  pagada: { texto: "Pagada", tono: "seafoam" },
  proxima: { texto: "Próxima", tono: "ambar" },
  pendiente: { texto: "Pendiente", tono: "neutro" },
  vencida: { texto: "Vencida", tono: "acento" },
};

function DetallePlan() {
  const { user } = useAuth();
  const router = useRouter();
  const { config } = useCheckoutConfig();
  const id = Number(useParams<{ id: string }>().id);
  const [plan, setPlan] = useState<PlanEstado | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [riel, setRiel] = useState<Riel | "">("");
  const [enviando, setEnviando] = useState<"proxima" | "saldo" | null>(null);
  const [errorPago, setErrorPago] = useState<string | null>(null);
  const [enRevision, setEnRevision] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!user || !Number.isInteger(id) || id <= 0) return;
    let vigente = true;
    estadoPlan(id).then(
      (p) => { if (vigente) setPlan(p); },
      () => { if (vigente) setError(true); },
    );
    return () => { vigente = false; };
  }, [user, id, intento]);

  const recargar = () => {
    setError(false);
    setPlan(undefined);
    setIntento((n) => n + 1);
  };

  async function pagar(que: "proxima" | "saldo") {
    if (!plan || enviando) return;
    if (!riel) {
      setErrorPago("Elija con qué va a pagar.");
      return;
    }
    setEnviando(que);
    setErrorPago(null);
    const r = await emitirPago(plan.plan_id, que, riel);
    if ("token" in r && r.enVerificacion) {
      setEnRevision(r.token);
      setEnviando(null);
      return;
    }
    if ("token" in r) {
      router.push(`/pagar/${r.token}`);
      return; // el botón sigue «cargando» mientras navega
    }
    setErrorPago(r.error);
    setEnviando(null);
    // El plan pudo cambiar (se cerró, se pagó): se vuelve a leer para no dejar botones viejos.
    estadoPlan(plan.plan_id).then((p) => p && setPlan(p), () => {});
  }

  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p className="text-ink">No pudimos cargar el plan. Revise su conexión e intente de nuevo.</p>
        <Boton variante="secundario" onClick={recargar}>Reintentar</Boton>
      </div>
    );
  }
  if (plan === undefined && Number.isInteger(id) && id > 0) return <p role="status" className="py-10 text-ink-soft">Cargando el plan…</p>;
  if (!plan) return <Aviso tono="info">No encontramos ese plan en su cuenta.</Aviso>;

  const est = TEXTO_ESTADO[plan.estado] ?? TEXTO_ESTADO.al_dia;
  const abierto = esAbierto(plan);
  const hoy = hoyCaracas();
  const igtf = (config?.igtf_pct ?? 0) > 0 && (riel === "zelle" || riel === "binance");

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4 rounded-card border border-linea bg-card p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-lg font-bold text-ink">{plan.reserva_codigo ?? `Plan ${plan.plan_id}`}</p>
            {plan.viaje_inicio ? <p className="text-sm text-ink-soft">Viaje el {fechaCorta(plan.viaje_inicio)}</p> : null}
          </div>
          <Etiqueta tono={est.tono}>{est.texto}</Etiqueta>
        </div>
        <Avance plan={plan} />
        {abierto ? (
          <p className="text-sm text-ink">
            Saldo pendiente: <span className="font-mono font-bold tabular-nums">{usd(plan.saldo_usd)}</span>
          </p>
        ) : null}
        {(plan.estado === "atrasado" || plan.estado === "en_mora") && plan.proxima ? (
          <Aviso tono="error">
            La cuota {plan.proxima.n} venció el {fechaCorta(plan.proxima.vence_el)}.{" "}
            {plan.estado === "atrasado" && plan.proxima.limite_gracia >= hoy
              ? `Páguela hasta el ${fechaCorta(plan.proxima.limite_gracia)} o la reserva se cancela y lo abonado no se devuelve.`
              : "Pasó el plazo de gracia: escríbanos por WhatsApp para revisar su reserva."}
          </Aviso>
        ) : null}
      </section>

      <section aria-labelledby="t-cuotas" className="flex flex-col gap-3">
        <h2 id="t-cuotas" className="font-display text-xl font-bold text-ink">Cuotas</h2>
        <ol className="overflow-hidden rounded-card border border-linea bg-card">
          {plan.cuotas.map((c) => {
            const t = TEXTO_CUOTA[c.estado];
            return (
              <li key={c.n} className="flex items-center gap-3 border-b border-linea px-4 py-3 last:border-b-0">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    Cuota {c.n} <span className="font-normal text-ink-soft">({c.porcentaje} %)</span>
                  </p>
                  <p className="text-sm text-ink-soft">
                    {c.n === 1 ? "Al reservar" : `Vence el ${fechaCorta(c.vence_el)}`}
                    {c.extendida ? " · extendida" : ""}
                  </p>
                </div>
                <span className="font-mono font-bold tabular-nums text-ink">{usd(c.monto_usd)}</span>
                <Etiqueta tono={t.tono}>{t.texto}</Etiqueta>
              </li>
            );
          })}
        </ol>
      </section>

      {abierto && plan.saldo_usd > 0 && !plan.propio ? (
        <Aviso tono="info">Este plan es de otro usuario: solo su dueño puede pagarlo desde la web.</Aviso>
      ) : abierto && plan.saldo_usd > 0 && config?.activo === false ? (
        <Aviso tono="info">Los pagos en línea están pausados por ahora. Escríbanos por WhatsApp y le ayudamos.</Aviso>
      ) : abierto && plan.saldo_usd > 0 ? (
        <section aria-labelledby="t-pagar" className="flex flex-col gap-4 rounded-card border border-linea bg-card p-5">
          <h2 id="t-pagar" className="font-display text-xl font-bold text-ink">Pagar</h2>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-semibold text-ink">Método de pago</legend>
            <div className="grid grid-cols-3 gap-2">
              {RIELES.map((r) => (
                <label
                  key={r.id}
                  className="flex min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-card border border-linea bg-card px-2 py-2 text-center transition-colors duration-150 hover:border-ink/35 has-[:checked]:border-acento has-[:checked]:bg-acento-suave has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-acento/20"
                >
                  <input type="radio" name="riel" value={r.id} checked={riel === r.id} onChange={() => setRiel(r.id)} className="sr-only" />
                  <span className="text-sm font-bold text-ink">{r.titulo}</span>
                  <span className="text-xs text-ink-soft">{r.moneda}</span>
                </label>
              ))}
            </div>
            <p aria-live="polite" className="min-h-5 text-sm text-ink-soft">
              {riel === "pago_movil"
                ? "En bolívares a la tasa del BCV del día en que paga. Sin IGTF."
                : igtf
                  ? `Se suma ${config?.igtf_pct} % de IGTF sobre lo que pague.`
                  : ""}
            </p>
          </fieldset>
          {errorPago ? <Aviso tono="error">{errorPago}</Aviso> : null}
          {enRevision ? (
            <Aviso tono="info">
              <span className="block">Ya tiene un pago de este plan en revisión. Cuando lo verifiquemos podrá pagar lo siguiente.</span>
              <Boton href={`/pagar/${enRevision}`} variante="secundario" tamano="sm" className="mt-2">
                Ver ese pago
              </Boton>
            </Aviso>
          ) : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            {plan.proxima && plan.proxima.monto_usd < plan.saldo_usd ? (
              <Boton type="button" onClick={() => pagar("proxima")} cargando={enviando === "proxima"} disabled={enviando !== null}>
                Pagar cuota {plan.proxima.n} · {usd(plan.proxima.monto_usd)}
              </Boton>
            ) : null}
            <Boton
              type="button"
              variante={plan.proxima && plan.proxima.monto_usd < plan.saldo_usd ? "secundario" : "primario"}
              onClick={() => pagar("saldo")}
              cargando={enviando === "saldo"}
              disabled={enviando !== null}
            >
              Pagar todo el saldo · {usd(plan.saldo_usd)}
            </Boton>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export default function PlanDetallePage() {
  return (
    <RequiereSesion>
      <main className="mx-auto max-w-3xl px-5 py-4 md:py-14">
        <Encabezado titulo="Plan de pago" volver="/cuenta/planes" />
        <DetallePlan />
      </main>
    </RequiereSesion>
  );
}
