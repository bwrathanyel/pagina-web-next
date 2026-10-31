import { PLAN_ABONOS_VERSION, POLITICA_CANCELACION } from "@/lib/checkout/politica";

export const metadata = {
  title: "Términos de servicio",
  description: "Condiciones de uso del sitio web de Destino y Eventos Lotus 360.",
  alternates: { canonical: "/terminos" },
};

// Índice de anclas: /reservar enlaza a #compra-directa, #cancelaciones y #plan-abonos. El texto de cada
// sección es el aprobado; aquí solo cambia la presentación.
const SECCIONES = [
  { id: "servicio", titulo: "Sobre el servicio" },
  ...(POLITICA_CANCELACION
    ? [
        { id: "compra-directa", titulo: "Compra directa en el sitio" },
        { id: "cancelaciones", titulo: "Cambios y cancelaciones" },
        { id: "plan-abonos", titulo: "Plan de abonos" },
      ]
    : []),
  { id: "formularios", titulo: "Formularios y contacto" },
  { id: "contenido", titulo: "Contenido" },
  { id: "contacto", titulo: "Contacto" },
];

const CLASE_SECCION = "scroll-mt-24 border-t border-linea pt-6";
const CLASE_H2 = "mb-3 font-display text-xl font-bold text-ink";

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <h1 className="font-display text-3xl font-bold text-ink md:text-4xl">Términos de servicio</h1>
      <p className="mt-4 leading-7 text-ink-soft">
        Este sitio (destinoyeventoslotus360.com) es operado por Destino y Eventos Lotus 360,
        agencia de viajes venezolana. Al usarlo, acepta estos términos.
      </p>

      <nav aria-label="Secciones" className="mt-6 flex flex-wrap gap-2">
        {SECCIONES.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex min-h-11 items-center rounded-pill border border-linea bg-card px-4 text-sm font-semibold text-ink transition-colors hover:border-linea-fuerte hover:text-acento"
          >
            {s.titulo}
          </a>
        ))}
      </nav>

      <div className="mt-8 flex flex-col gap-8 leading-7 text-ink-soft">
        <section id="servicio" className={CLASE_SECCION}>
          <h2 className={CLASE_H2}>Sobre el servicio</h2>
          <p>
            El sitio muestra información de hoteles, paquetes, excursiones y promociones que
            comercializa Lotus 360. Los precios, disponibilidad y vigencia de cada promoción
            son referenciales y están sujetos a confirmación directa con un asesor de viaje
            antes de cerrar cualquier compra
            {POLITICA_CANCELACION
              ? ", salvo en los hoteles que ofrecen compra directa (ver la sección siguiente). Todo lo demás se coordina por WhatsApp con un asesor humano."
              : ". El sitio en sí no procesa pagos ni reservas automáticas: toda solicitud se coordina por WhatsApp con un asesor humano."}
          </p>
        </section>

        {POLITICA_CANCELACION ? (
          <section id="compra-directa" className={CLASE_SECCION}>
            <h2 className={CLASE_H2}>Compra directa en el sitio</h2>
            <p>
              En los hoteles que lo indican puede reservar y pagar sin hablar con un asesor. El precio se
              calcula con el tarifario vigente al momento de la compra y se expresa en dólares (USD). Al
              confirmar, retenemos el cupo por un tiempo limitado (por lo general 24 horas si paga en dólares
              y 2 horas con Pago Móvil, en cuyo caso el monto en bolívares queda fijado con la tasa del día;
              el plazo exacto se le muestra al reservar) y usted indica por qué medio pagará: Zelle, Pago
              Móvil o Binance. Los pagos en divisas (Zelle y Binance) incluyen el Impuesto a las Grandes
              Transacciones Financieras (IGTF), que se le muestra como una línea aparte en el total antes
              de pagar; con Pago Móvil no se cobra.
            </p>
            <p className="mt-3">
              La reserva no queda confirmada hasta que una persona de nuestro equipo verifica el pago. Si
              el tiempo vence sin pago, liberamos el cupo y usted puede volver a reservar si hay
              disponibilidad. Cuando el pago queda verificado, le enviamos el localizador de su reserva al
              correo que indicó. Si paga y el tiempo ya venció, escríbanos con su comprobante y lo atendemos.
            </p>
          </section>
        ) : null}

        {POLITICA_CANCELACION ? (
          <section id="cancelaciones" className={CLASE_SECCION}>
            <h2 className={CLASE_H2}>Cambios y cancelaciones</h2>
            {POLITICA_CANCELACION.map((p) => (
              <p key={p} className="mb-3 last:mb-0">{p}</p>
            ))}
          </section>
        ) : null}

        {POLITICA_CANCELACION ? (
          <section id="plan-abonos" className={CLASE_SECCION}>
            <h2 className={CLASE_H2}>Plan de abonos</h2>
            <p>
              En la compra directa puede pagar su reserva en cuotas si el viaje sale dentro de 65 días o más.
              Para usarlo necesita una cuenta en el sitio y aceptar estas condiciones al reservar.
            </p>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5">
              <li>
                Paga el 40 % al reservar y el resto en 3 cuotas de 20 % cada una, a los 15, 30 y 45 días de la
                reserva. Las fechas exactas se le muestran antes de pagar y en «Mis planes de pago» de su cuenta.
              </li>
              <li>
                El precio queda fijo en dólares (USD) desde el día de la reserva. Si paga una cuota en bolívares,
                se convierte con la tasa del BCV del día en que paga. Las cuotas en divisas (Zelle y Binance)
                llevan el IGTF de esa cuota.
              </li>
              <li>Puede adelantar cuotas o pagar todo el saldo cuando quiera, sin recargo.</li>
              <li>
                Le recordamos cada cuota por correo y WhatsApp antes y el día del vencimiento. Si una cuota
                vence, tiene 5 días de gracia para pagarla. Pasado ese plazo la reserva se cancela y lo abonado
                no se devuelve.
              </li>
              <li>
                Si no puede viajar por una causa ajena a usted y a la agencia, lo abonado queda como crédito a
                su favor por 6 meses para usarlo en otra reserva.
              </li>
              <li>
                Solo nuestro equipo puede extender el vencimiento de una cuota, y nunca más allá de 20 días antes
                del viaje.
              </li>
              <li>La reserva queda confirmada cuando verificamos el pago de la primera cuota.</li>
            </ul>
            <p className="mt-3 text-sm">Versión de estas condiciones: {PLAN_ABONOS_VERSION}.</p>
          </section>
        ) : null}

        <section id="formularios" className={CLASE_SECCION}>
          <h2 className={CLASE_H2}>Formularios y contacto</h2>
          <p>
            Al llenar un formulario del sitio (contacto, cotizador, carrito) o escribirnos por
            WhatsApp/redes sociales, autoriza a Lotus 360 a comunicarse con usted para dar seguimiento
            a su solicitud, según lo descrito en nuestra{" "}
            <a href="/privacidad" className="font-semibold text-acento underline">política de privacidad</a>.
          </p>
        </section>

        <section id="contenido" className={CLASE_SECCION}>
          <h2 className={CLASE_H2}>Contenido</h2>
          <p>
            Las fotos, descripciones y precios publicados corresponden a los proveedores
            (hoteles, operadores turísticos) con los que trabaja Lotus 360, y pueden cambiar sin
            aviso previo. Ante cualquier duda sobre un servicio puntual, la información que da
            un asesor directamente prevalece sobre lo publicado en el sitio.
          </p>
        </section>

        <section id="contacto" className={CLASE_SECCION}>
          <h2 className={CLASE_H2}>Contacto</h2>
          <p>Para dudas sobre estos términos, escríbanos por WhatsApp o por nuestras redes sociales.</p>
        </section>
      </div>
    </main>
  );
}
