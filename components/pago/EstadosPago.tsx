import type { ReactNode } from "react";
import { Pasos } from "@/components/checkout/Pasos";
import { ROTULO } from "@/components/reserva/PaseFechas";
import { Boleto } from "@/components/ui/Boleto";
import { Boton } from "@/components/ui/Boton";
import { Icono } from "@/components/ui/Icono";
import { WhatsAppIcon } from "@/components/ui/icons/WhatsAppIcon";
import { registrarEvento } from "@/lib/analitica/eventos";
import { antesDeVenezuela, horaVenezuela, rangoFechas } from "@/lib/checkout/formato";
import type { ReservaWeb } from "@/lib/pago/pagar";
import { whatsappHref } from "@/lib/whatsapp";
import { hospedajeDe, viajerosDe } from "./ResumenCompra";

const TONO = {
  ok: "bg-seafoam-bg text-seafoam-text",
  malo: "bg-peligro-suave text-peligro",
  neutro: "bg-sand-2 text-ink-soft",
} as const;

/** Estado de una sola tarjeta: link no válido, sin red, vencido, rechazado, y los links de asesor. */
export function EstadoSimple({
  titulo, texto, tono = "neutro", accion,
}: { titulo: string; texto: ReactNode; tono?: keyof typeof TONO; accion?: ReactNode }) {
  return (
    <div className="rounded-card border border-linea bg-card p-6 md:p-8" role={tono === "malo" ? "alert" : "status"}>
      <span className={`mb-5 flex h-12 w-12 items-center justify-center rounded-pill ${TONO[tono]}`} aria-hidden="true">
        <Icono nombre={tono === "ok" ? "check" : "alerta"} tamano={22} />
      </span>
      <h1 className="font-display text-3xl font-bold leading-tight text-ink">{titulo}</h1>
      <p className="mt-3 text-ink-soft">{texto}</p>
      {accion ? <div className="mt-6">{accion}</div> : null}
    </div>
  );
}

/** Compra directa: cuando algo no sale, el siguiente paso es WhatsApp con el código a la mano. */
export function BotonWhatsapp({ codigo, motivo }: { codigo: string; motivo: string }) {
  return (
    <Boton
      href={whatsappHref(`Hola, necesito ayuda con mi reserva ${codigo}. ${motivo}`)}
      onClick={() => registrarEvento("click_whatsapp", { ruta: "/pagar", meta: { origen: "pagar", motivo, codigo } })}
      variante="whatsapp"
      tamano="lg"
      ancho
      iconoInicio={<WhatsAppIcon size={20} />}
    >
      Escribirnos por WhatsApp
    </Boton>
  );
}

function Encabezado({ paso, titulo, texto }: { paso: 2 | 3; titulo: string; texto: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <Pasos actual={paso} />
      <h1 className="font-display text-3xl font-bold leading-tight text-ink md:text-4xl">{titulo}</h1>
      <p className="text-ink-soft">{texto}</p>
    </header>
  );
}

/** Cuerpo del boleto de los estados: lo que se compró. */
function DatosViaje({ reserva }: { reserva: ReservaWeb }) {
  const h = hospedajeDe(reserva);
  if (!h) return null;
  return (
    <div className="flex flex-col gap-4 p-5">
      <div>
        <p className="font-display text-lg font-bold leading-tight text-ink">{h.hotel ?? h.descripcion}</p>
        {h.habitacion ? <p className="text-sm text-ink-soft">{h.habitacion}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className={ROTULO}>Fechas</p>
          <p className="font-mono text-sm font-bold text-ink">{rangoFechas(h.fecha_inicio, h.fecha_fin)}</p>
        </div>
        <div>
          <p className={ROTULO}>Viajeros</p>
          <p className="text-sm font-semibold text-ink">{viajerosDe(h)}</p>
        </div>
      </div>
    </div>
  );
}

type Hito = { titulo: string; detalle?: string; estado: "hecho" | "ahora" | "luego" };

function LineaDeTiempo({ hitos }: { hitos: Hito[] }) {
  return (
    <ol aria-label="Estado de su reserva" className="flex flex-col px-5 pb-5">
      {hitos.map((h, i) => (
        <li key={h.titulo} aria-current={h.estado === "ahora" ? "step" : undefined} className="flex gap-3">
          <span className="flex flex-col items-center" aria-hidden="true">
            <span
              className={
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-pill " +
                (h.estado === "hecho"
                  ? "bg-seafoam-bg text-seafoam-text"
                  : h.estado === "ahora"
                    ? "bg-ambar-suave text-ambar"
                    : "border border-linea-fuerte text-ink-soft")
              }
            >
              {h.estado === "hecho" ? (
                <Icono nombre="check" tamano={14} />
              ) : (
                <span className={"h-2 w-2 rounded-pill " + (h.estado === "ahora" ? "bg-ambar" : "bg-linea-fuerte")} />
              )}
            </span>
            {i < hitos.length - 1 ? <span className="w-px flex-1 bg-linea-fuerte" /> : null}
          </span>
          <span className={"min-w-0 pb-4 " + (i === hitos.length - 1 ? "pb-0" : "")}>
            <span className={"block text-sm " + (h.estado === "luego" ? "font-semibold text-ink-soft" : "font-bold text-ink")}>
              {h.titulo}
              {h.estado === "hecho" ? <span className="sr-only"> (hecho)</span> : null}
            </span>
            {h.detalle ? <span className="block text-sm text-ink-soft">{h.detalle}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** Talón con el código de la reserva (verificando) o el localizador con el sello (confirmada). */
function TalonCodigo({ rotulo, codigo, sello = false }: { rotulo: string; codigo: string; sello?: boolean }) {
  return (
    <div className="flex h-full items-center gap-3 px-5 pb-1">
      <div className="min-w-0 flex-1">
        <p className={ROTULO}>{rotulo}</p>
        <p className={"font-mono font-bold leading-tight tabular-nums text-ink " + (sello ? "text-4xl" : "text-2xl")}>{codigo}</p>
      </div>
      {sello ? (
        <span
          className={
            "shrink-0 -rotate-6 rounded-control border-2 border-current px-2.5 py-1 font-mono text-sm font-bold uppercase tracking-widest text-seafoam-text " +
            "animate-globo-entrar motion-reduce:animate-none"
          }
        >
          Confirmada
        </span>
      ) : null}
      <span aria-hidden="true" className="franja-marca absolute inset-x-0 bottom-0 h-1" />
    </div>
  );
}

/** Aviso de pago enviado: nada está confirmado hasta que una persona lo verifica. */
export function Verificando({ reserva }: { reserva: ReservaWeb }) {
  const antes = antesDeVenezuela(reserva.verificar_antes_de);
  const hora = horaVenezuela(reserva.declarado_en);
  return (
    <div className="flex flex-col gap-6" role="status">
      <Encabezado
        paso={2}
        titulo="Recibimos su aviso de pago"
        texto={
          <>
            Una persona de nuestro equipo lo verifica {antes || "de 8:00 am a 8:00 pm"} (hora de Venezuela). Le enviaremos el
            localizador al correo que indicó. No necesita hacer nada más.
          </>
        }
      />
      <Boleto tamanoTalon="6rem" talon={<TalonCodigo rotulo="Código de reserva" codigo={reserva.codigo} />}>
        <DatosViaje reserva={reserva} />
        <LineaDeTiempo
          hitos={[
            { titulo: "Reserva creada", estado: "hecho" },
            { titulo: "Aviso de pago enviado", detalle: hora ? `${hora} (hora de Venezuela)` : undefined, estado: "hecho" },
            { titulo: "Verificación de su pago", detalle: antes ? `${antes.charAt(0).toUpperCase()}${antes.slice(1)}` : undefined, estado: "ahora" },
            { titulo: "Localizador por correo", estado: "luego" },
          ]}
        />
      </Boleto>
    </div>
  );
}

/** Pago verificado: el boleto se sella. */
export function Confirmada({ reserva }: { reserva: ReservaWeb }) {
  return (
    <div className="flex flex-col gap-6" role="status">
      <Encabezado
        paso={3}
        titulo="¡Su reserva está confirmada!"
        texto="Le enviamos los detalles al correo que indicó. Si no ve el correo, revise Spam o Promociones."
      />
      <Boleto tamanoTalon="7rem" talon={<TalonCodigo rotulo="Localizador" codigo={reserva.codigo} sello />}>
        <DatosViaje reserva={reserva} />
      </Boleto>
    </div>
  );
}
