import { Icono, type NombreIcono } from "@/components/ui/Icono";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";

// Escritorio (lg+): el centro de la cabecera de /reservar, entre el nombre del hotel y el total
// (pedido del dueño 2026-11-18, captura a 1366px: el hueco quedaba vacío). Lo que da confianza antes
// de pagar y el WhatsApp, que en escritorio no tenía lugar en la cabecera. Nada de fechas ni habitación:
// ya están en sus tramos justo debajo.

const CIRCULO = "flex h-9 w-9 shrink-0 items-center justify-center rounded-full";

function Sello({ icono, titulo, nota, className = "" }: { icono: NombreIcono; titulo: string; nota: string; className?: string }) {
  return (
    <li className={"flex min-w-0 items-center gap-2.5 px-4 " + className}>
      <span aria-hidden="true" className={CIRCULO + " bg-seafoam-bg text-seafoam-text"}>
        <Icono nombre={icono} tamano={18} />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="text-sm font-semibold text-ink">{titulo}</span>
        <span className="text-xs text-ink-soft">{nota}</span>
      </span>
    </li>
  );
}

export function SellosCabecera({
  horasCupo,
  wa,
  className = "",
}: {
  /** Horas que se guarda el cupo al crear la reserva (config del checkout); 0/null = no se muestra. */
  horasCupo: number | null;
  wa: { href: string; onClick: () => void };
  className?: string;
}) {
  return (
    <ul className={"flex min-w-0 items-center justify-evenly divide-x divide-linea " + className}>
      {horasCupo ? (
        <Sello icono="reloj" titulo="Le guardamos el cupo" nota={`${horasCupo} ${horasCupo === 1 ? "hora" : "horas"} para pagar`} />
      ) : null}
      <Sello icono="escudo" titulo="Pago revisado por una persona" nota="antes de confirmar su reserva" className="max-xl:hidden" />
      <li className="flex min-w-0 px-4">
        <a {...wa} target="_blank" rel="noopener noreferrer" className="group flex min-h-11 min-w-0 items-center gap-2.5 rounded-control">
          <span aria-hidden="true" className={CIRCULO + " bg-whatsapp text-white"}>
            <WhatsAppIcon size={18} />
          </span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="text-sm font-semibold text-ink group-hover:underline group-hover:underline-offset-4">¿Dudas? Escríbanos</span>
            <span className="text-xs text-ink-soft">un asesor por WhatsApp</span>
          </span>
        </a>
      </li>
    </ul>
  );
}
