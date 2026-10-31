"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";
import { useAuth } from "@/components/providers/AuthProvider";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { Etiqueta } from "@/components/ui/Insignia";
import { fechaCorta, usd } from "@/lib/checkout/formato";
import { Avance, Encabezado } from "@/components/cuenta/PlanesUI";
import { listarPlanes, TEXTO_ESTADO, type PlanEstado } from "@/lib/planes/planes";

function TarjetaPlan({ plan }: { plan: PlanEstado }) {
  const est = TEXTO_ESTADO[plan.estado] ?? TEXTO_ESTADO.al_dia;
  return (
    <li>
      <Link
        href={`/cuenta/planes/${plan.plan_id}`}
        className="flex flex-col gap-3 rounded-card border border-linea bg-card p-5 transition-colors duration-150 hover:border-ink/35"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-lg font-bold text-ink">{plan.reserva_codigo ?? `Plan ${plan.plan_id}`}</p>
            {plan.viaje_inicio ? <p className="text-sm text-ink-soft">Viaje el {fechaCorta(plan.viaje_inicio)}</p> : null}
          </div>
          <Etiqueta tono={est.tono}>{est.texto}</Etiqueta>
        </div>
        <Avance plan={plan} />
        {plan.proxima ? (
          <p className="text-sm text-ink">
            Próxima: cuota {plan.proxima.n} de {plan.cuotas.length} ·{" "}
            <span className="font-mono font-bold tabular-nums">{usd(plan.proxima.monto_usd)}</span> · vence el {fechaCorta(plan.proxima.vence_el)}
          </p>
        ) : null}
      </Link>
    </li>
  );
}

function ListaPlanes() {
  const { user } = useAuth();
  const [planes, setPlanes] = useState<PlanEstado[] | null>(null);
  const [error, setError] = useState(false);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    if (!user) return;
    let vigente = true;
    listarPlanes(user.id).then(
      (p) => { if (vigente) setPlanes(p); },
      () => { if (vigente) setError(true); },
    );
    return () => { vigente = false; };
  }, [user, intento]);

  return (
    <main className="mx-auto max-w-3xl px-5 py-4 md:py-14">
      <Encabezado titulo="Mis planes de pago" volver="/cuenta" />
      {error ? (
        <div role="alert" className="flex flex-col items-start gap-4 py-10">
          <p className="text-ink">No pudimos cargar sus planes. Revise su conexión e intente de nuevo.</p>
          <Boton variante="secundario" onClick={() => { setError(false); setPlanes(null); setIntento((n) => n + 1); }}>
            Reintentar
          </Boton>
        </div>
      ) : planes === null ? (
        <p role="status" className="py-10 text-ink-soft">Cargando sus planes…</p>
      ) : planes.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-pill bg-acento-suave text-acento" aria-hidden="true">
            <Icono nombre="calendario" tamano={28} />
          </span>
          <p className="font-display text-2xl font-bold text-ink">No tiene planes de pago</p>
          <p className="max-w-xs text-ink-soft">
            Al reservar un hotel con su viaje a 65 días o más puede elegir pagar en cuotas. Sus planes aparecerán aquí.
          </p>
          <Boton href="/catalogo" className="mt-2" iconoFin={<Icono nombre="flecha-der" tamano={18} />}>
            Explorar el catálogo
          </Boton>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {planes.map((p) => <TarjetaPlan key={p.plan_id} plan={p} />)}
        </ul>
      )}
    </main>
  );
}

export default function PlanesPage() {
  return (
    <RequiereSesion>
      <ListaPlanes />
    </RequiereSesion>
  );
}
