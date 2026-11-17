"use client";

import { ChipPlazo } from "@/components/checkout/ChipPlazo";
import { BotonCopiar, DatoCopiable } from "@/components/checkout/DatoCopiable";
import { ROTULO } from "@/components/reserva/PaseFechas";
import { Boleto } from "@/components/ui/Boleto";
import { MontoTablero } from "@/components/ui/MontoTablero";
import { fechaHoraVenezuela, montoCentavos, montoParaCopiar, porcentajeIgtf, usd } from "@/lib/checkout/formato";
import { formatearMonto, type InstructivoRiel, type PagoConRiel } from "@/lib/pago/pagar";
import { textoCopiarTodo } from "@/lib/pago/talon";

/** Debajo del monto: el equivalente, qué incluye y con qué tasa se convirtió. «EUR» es tasa, no moneda: se paga en Bs. */
function notaMonto(pago: PagoConRiel, igtf: string | null): string {
  const vence = fechaHoraVenezuela(pago.expira_en);
  if (pago.moneda === "VES") {
    const tasa = pago.tasa_usd_ves ? montoCentavos(Math.round(pago.tasa_usd_ves * 100), "VES") : null;
    const base =
      pago.tasa_tipo === "mixta"
        ? "Con las tasas del BCV (dólar y euro)"
        : tasa
          ? pago.tasa_tipo === "EUR" ? `Tasa aplicada (base BCV euro, con IVA si la tarifa lo lleva): ${tasa} por US$ 1` : `Tasa del BCV: ${tasa} por US$ 1`
          : "A la tasa del BCV";
    const equivalente = pago.monto_usd_centavos ? `Equivale a ${montoCentavos(pago.monto_usd_centavos, "USD")}. ` : "";
    return `${equivalente}${base}, válida hasta el ${vence}.`;
  }
  if (igtf) return `Incluye IGTF ${igtf.replace(".", ",")} %.`;
  return pago.reserva ? "" : `Link válido hasta el ${vence}.`;
}

/** El talón de pago: monto exacto con su plazo arriba y, debajo de la perforación,
 *  los datos de la cuenta de ese riel con «Copiar todo». */
export function TalonPago({ pago, ins, onVencer }: { pago: PagoConRiel; ins: InstructivoRiel; onVencer: () => void }) {
  const reserva = pago.reserva ?? null;
  const plan = reserva?.plan ?? null;
  const igtf = reserva ? porcentajeIgtf(reserva.servicios) : null;
  const monto = formatearMonto(pago.monto_centavos, pago.moneda);
  // En un plan el IGTF es solo de esta cuota y todavía no es un servicio de la reserva: lo informa el plan.
  const nota = plan && plan.igtf_usd > 0 && pago.moneda !== "VES" ? `Incluye IGTF de esta cuota: ${usd(plan.igtf_usd)}.` : notaMonto(pago, igtf);
  const lineas = (nota ? 1 : 0) + (plan ? 1 : 0);

  return (
    <Boleto
      talonArriba
      tamanoTalon={`${7.75 + lineas * 1.5}rem`}
      talon={
        <div className="flex h-full flex-col justify-center gap-1.5 px-5 pt-1">
          <span aria-hidden="true" className="franja-marca absolute inset-x-0 top-0 h-1" />
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className={ROTULO}>Monto exacto</p>
            {/* «Cupo retenido» es de la compra web; el link del asesor dice su vigencia en la nota. */}
            {reserva ? <ChipPlazo hasta={pago.expira_en} onVencer={onVencer} /> : null}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 font-mono text-3xl font-bold leading-none tabular-nums text-ink sm:text-4xl">
              <MontoTablero texto={monto} convertir={false} />
            </p>
            <BotonCopiar valor={montoParaCopiar(pago.monto_centavos, pago.moneda)} que="el monto" />
          </div>
          {nota ? <p className="text-xs text-ink-soft">{nota}</p> : null}
          {plan ? (
            <p className="text-xs text-ink">
              Saldo después de este pago: <span className="font-mono font-bold tabular-nums">{usd(plan.saldo_despues_usd)}</span>
            </p>
          ) : null}
        </div>
      }
    >
      {ins.datos.length > 0 ? (
        <div className="flex flex-col px-5 pb-4 pt-2">
          <dl className="flex flex-col">
            {ins.datos.map((d) => (
              <DatoCopiable key={d.etiqueta} etiqueta={d.etiqueta} valor={d.valor} />
            ))}
          </dl>
          <BotonCopiar
            valor={textoCopiarTodo({ titulo: ins.titulo, monto, datos: ins.datos, codigo: reserva?.codigo })}
            que="todos los datos"
            texto="Copiar todo"
            className="mt-2 self-start"
          />
        </div>
      ) : null}
    </Boleto>
  );
}

/** Tres pasos fijos; el detalle del primero sale del instructivo del riel. */
export function PasosPago({ ins }: { ins: InstructivoRiel }) {
  // Tarjeta y efectivo no se pagan desde acá: su único paso es hablar con el asesor.
  const pasos =
    ins.datos.length === 0
      ? ins.pasos.map((p) => ({ titulo: p, detalle: null as string | null }))
      : [
          { titulo: "Pague en su banco", detalle: ins.pasos[0] ?? null },
          { titulo: "Suba el comprobante", detalle: "Escriba la referencia y adjunte la captura en «¿Ya pagó?»." },
          { titulo: "Le confirmamos", detalle: "Una persona revisa su pago y el localizador aparece en esta misma página." },
        ];
  return (
    <ol aria-label="Cómo pagar" className="flex flex-col gap-3">
      {pasos.map((p, i) => (
        <li key={p.titulo} className="flex gap-3">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-sand-2 font-mono text-xs font-bold text-ink"
          >
            {i + 1}
          </span>
          <span className="pt-0.5">
            <span className={"block " + (p.detalle ? "font-semibold text-ink" : "text-ink-soft")}>{p.titulo}</span>
            {p.detalle ? <span className="block text-sm text-ink-soft">{p.detalle}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
