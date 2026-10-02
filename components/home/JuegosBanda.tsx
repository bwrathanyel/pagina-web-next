import { Revelar } from "@/components/ui/Revelar";
import { Seccion } from "@/components/ui/Seccion";
import { Icono } from "@/components/ui/Icono";
import { clasesBoton } from "@/components/ui/Boton";
import { CLASE_ETIQUETA_SECCION, CLASE_TITULO_SECCION } from "@/components/ui/EncabezadoSeccion";

// Los 5 premios reales de la ruleta web (juegos_premios); no sumar ninguno acá
// sin que exista en el servidor.
const PREMIOS = [
  { nombre: "Descuento 2 %", detalle: "Cupón de 30 días" },
  { nombre: "Descuento 5 %", detalle: "Cupón de 30 días" },
  { nombre: "Gira otra vez", detalle: "Un giro más" },
  { nombre: "Cotización prioritaria", detalle: "Le atendemos primero" },
  { nombre: "Guía digital", detalle: "O fondo de pantalla" },
];

/** Aviso de los minijuegos de /juegos: banda dusk con los premios posibles como
 * campos de un pase (separados por la perforación). El CTA es un <a> y no un
 * Link porque /juegos es una route handler que responde 200 directo: la
 * navegación del cliente de Next no sabe resolverla. */
export function JuegosBanda() {
  return (
    <Seccion ritmo="densa">
      <Revelar>
        <div className="sobre-dusk grid gap-8 rounded-card bg-dusk p-6 text-dusk-text md:grid-cols-[1.1fr_1fr] md:items-center md:gap-12 md:p-10">
          <div>
            <h2 className={CLASE_TITULO_SECCION + " text-white"}>Juegue, supere 3 niveles y gire la ruleta</h2>
            <p className={CLASE_ETIQUETA_SECCION + " text-gold"}>Minijuegos Lotus 360</p>
            <p className="mt-4 max-w-md leading-7 text-dusk-text-soft">
              Elija uno de 6 juegos de habilidad desde su celular. Si supera los 3 niveles seguidos, gira la ruleta
              y puede llevarse uno de estos premios.
            </p>
            <a href="/juegos" className={clasesBoton({ variante: "firma", tamano: "md", className: "mt-6 w-fit" })}>
              <Icono nombre="destello" tamano={18} />
              <span>Jugar ahora</span>
              <Icono nombre="flecha-der" tamano={18} />
            </a>
          </div>

          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-dusk-text-soft">Premios posibles</p>
            <ul className="mt-3 border-t-2 border-dashed border-dusk-text/25">
              {PREMIOS.map((premio) => (
                <li
                  key={premio.nombre}
                  className="flex items-start gap-3 border-b-2 border-dashed border-dusk-text/25 py-3"
                >
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold leading-tight text-white md:text-xl">{premio.nombre}</p>
                    <p className="mt-0.5 text-sm text-dusk-text-soft">{premio.detalle}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs leading-5 text-dusk-text-soft">
              Premios sujetos a disponibilidad diaria. Un descuento por teléfono cada 30 días.
            </p>
          </div>
        </div>
      </Revelar>
    </Seccion>
  );
}
