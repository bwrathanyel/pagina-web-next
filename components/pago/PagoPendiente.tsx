"use client";

import { useEffect, useRef, useState } from "react";
import { BarraFijaMovil } from "@/components/checkout/BarraFijaMovil";
import { BotonCopiar } from "@/components/checkout/DatoCopiable";
import { Pasos } from "@/components/checkout/Pasos";
import { useEsEscritorio } from "@/components/checkout/useEsEscritorio";
import { ROTULO } from "@/components/reserva/PaseFechas";
import { Boton } from "@/components/ui/Boton";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { formatearMonto, instructivoDe, type PagoConRiel } from "@/lib/pago/pagar";
import { AvisoPago } from "./AvisoPago";
import { ContactoReserva } from "./EstadosPago";
import { hospedajeDe, ResumenCompra } from "./ResumenCompra";
import { PasosPago, TalonPago } from "./TalonPago";
import { useAvisoPago } from "./useAvisoPago";

/** «Guarde este enlace»: si el navegador de Instagram se cierra, es lo único que devuelve al pago. */
function GuardarEnlace({ id, enlace, texto, className = "" }: { id: string; enlace: string; texto: string; className?: string }) {
  return (
    <section aria-labelledby={id} className={"rounded-card border border-linea bg-card p-5 " + className}>
      <h2 id={id} className="font-display text-lg font-bold leading-tight text-ink">Guarde este enlace</h2>
      <p className="mt-1 text-sm text-ink-soft">Si cierra esta página, con él vuelve a sus datos de pago.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <BotonCopiar valor={enlace} que="el enlace" />
        <Boton
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          variante="secundario"
          tamano="sm"
          iconoInicio={<WhatsAppIcon size={16} />}
        >
          Enviármelo por WhatsApp
        </Boton>
      </div>
    </section>
  );
}

/** Pago emitido: el talón con el monto y los datos para pagar, y el aviso «¿Ya pagó?».
 *  `onCambiarMetodo`: link sin método fijo, donde el cliente eligió `pago.riel` y puede volver atrás. */
export function PagoPendiente({
  pago, token, onDeclarado, onVencer, onCambiarMetodo,
}: {
  pago: PagoConRiel;
  token: string;
  onDeclarado: () => void;
  onVencer: () => void;
  onCambiarMetodo?: () => void;
}) {
  const ins = instructivoDe(pago.riel);
  const reserva = pago.reserva ?? null;
  const hotel = reserva ? hospedajeDe(reserva)?.hotel ?? null : null;
  const monto = formatearMonto(pago.monto_centavos, pago.moneda);
  const plan = reserva?.plan ?? null;
  const rotuloPlan = plan
    ? plan.que === "saldo"
      ? "Saldo del plan de abonos"
      : plan.cuota_n
        ? `Cuota ${plan.cuota_n} de ${plan.cuotas_total} · Plan de abonos`
        : "Plan de abonos"
    : null;
  const escritorio = useEsEscritorio();
  const aviso = useAvisoPago({ token, riel: pago.riel, rielElegido: Boolean(onCambiarMetodo), onDeclarado });

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
    aviso.refInput.current?.focus({ preventScroll: true });
  }

  const [enlace, setEnlace] = useState("");
  useEffect(() => setEnlace(window.location.href), []);

  const talon = <TalonPago pago={pago} ins={ins} onVencer={onVencer} />;
  const formulario = <AvisoPago aviso={aviso} riel={pago.riel} formRef={formRef} />;
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
          {onCambiarMetodo ? (
            <Boton type="button" variante="secundario" tamano="sm" className="mt-3" onClick={onCambiarMetodo}>
              Cambiar método de pago
            </Boton>
          ) : null}
        </header>
        {talon}
        <PasosPago ins={ins} />
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
            {rotuloPlan ? <p className={ROTULO + " mt-2"}>{rotuloPlan}</p> : null}
          </div>
        </header>
        {talon}
        {/* En el teléfono va antes que nada más: es lo que salva el pago si se cierra Instagram. */}
        <GuardarEnlace id="guardar-enlace-movil" enlace={enlace} texto={textoWhatsapp} className="lg:hidden" />
        <PasosPago ins={ins} />
        <ContactoReserva codigo={reserva.codigo} hotel={hotel} />
      </div>

      <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
        {formulario}
        <ResumenCompra reserva={reserva} abierto={escritorio} />
        <GuardarEnlace id="guardar-enlace" enlace={enlace} texto={textoWhatsapp} className="max-lg:hidden" />
      </aside>
      {barra}
    </div>
  );
}
