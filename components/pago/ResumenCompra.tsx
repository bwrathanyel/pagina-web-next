import { Icono } from "@/components/ui/Icono";
import { ROTULO } from "@/components/reserva/PaseFechas";
import { rangoFechas, separarCargos, usd } from "@/lib/checkout/formato";
import type { ReservaWeb, ServicioReserva } from "@/lib/pago/pagar";

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** «2 adultos · 1 niño». */
export function viajerosDe(s: Pick<ServicioReserva, "pax_adultos" | "pax_ninos">): string {
  const partes = [plural(s.pax_adultos ?? 0, "adulto", "adultos")];
  if (s.pax_ninos) partes.push(plural(s.pax_ninos, "niño", "niños"));
  return partes.join(" · ");
}

/** El hospedaje de la reserva (el primer servicio con hotel), para títulos y el sello. */
export function hospedajeDe(reserva: ReservaWeb): ServicioReserva | null {
  return separarCargos(reserva.servicios).principales[0] ?? null;
}

/** «Su reserva» plegable: el hospedaje con su monto y, aparte, los cargos (gestión web, IGTF).
 * Antes los cargos salían como servicios de «0 adulto(s)». Abierto de entrada en escritorio. */
export function ResumenCompra({ reserva, abierto = false }: { reserva: ReservaWeb; abierto?: boolean }) {
  const { principales, cargos } = separarCargos(reserva.servicios);
  return (
    <details
      // Al cruzar el corte de escritorio se vuelve a montar con el estado por defecto de ese tamaño.
      key={abierto ? "abierto" : "cerrado"}
      open={abierto || undefined}
      className="group rounded-card border border-linea bg-card"
    >
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">
          <span className="block font-display text-lg font-bold leading-tight text-ink">Su reserva</span>
          <span className="block text-sm text-ink-soft">
            <span className="font-mono font-bold text-ink">{reserva.codigo}</span> · Total {usd(reserva.total_usd)}
          </span>
        </span>
        <Icono
          nombre="chevron-abajo"
          tamano={20}
          className="text-ink-soft transition-transform duration-150 ease-salida group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>

      <div className="border-t border-dashed border-linea-fuerte px-5 pb-5 pt-4">
        <ul className="flex flex-col gap-3">
          {principales.map((s, i) => (
            <li key={i} className="flex items-start justify-between gap-4 text-sm">
              <span className="min-w-0">
                <span className="block font-bold text-ink">
                  {s.hotel ?? s.descripcion ?? "Servicio"}
                  {s.habitacion ? <span className="font-normal text-ink-soft"> · {s.habitacion}</span> : null}
                </span>
                <span className="block text-ink-soft">
                  <span className="font-mono">{rangoFechas(s.fecha_inicio, s.fecha_fin)}</span> · {viajerosDe(s)}
                </span>
              </span>
              <span className="shrink-0 font-mono font-bold tabular-nums text-ink">{usd(s.precio_usd)}</span>
            </li>
          ))}
          {cargos.map((s, i) => (
            <li key={`c${i}`} className="flex items-baseline justify-between gap-4 text-sm text-ink-soft">
              <span className="min-w-0">{s.descripcion ?? "Cargo"}</span>
              <span className="shrink-0 font-mono tabular-nums">{usd(s.precio_usd)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 flex items-baseline justify-between gap-4 border-t border-linea pt-3">
          <span className={ROTULO}>Total</span>
          <span className="font-mono text-lg font-bold tabular-nums text-ink">{usd(reserva.total_usd)}</span>
        </p>
      </div>
    </details>
  );
}
