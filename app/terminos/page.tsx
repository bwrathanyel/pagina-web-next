export const metadata = {
  title: "Términos de servicio | Destino y Eventos Lotus 360",
  description: "Condiciones de uso del sitio web de Destino y Eventos Lotus 360.",
};

export default function TerminosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <h1 className="mb-5 font-display text-3xl font-semibold text-ink">Términos de servicio</h1>
      <div className="flex flex-col gap-5 leading-7 text-ink-soft">
        <p>
          Este sitio (destinoyeventoslotus360.com) es operado por Destino y Eventos Lotus 360,
          agencia de viajes venezolana. Al usarlo, aceptás estos términos.
        </p>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Sobre el servicio</h2>
          <p>
            El sitio muestra información de hoteles, paquetes, excursiones y promociones que
            comercializa Lotus 360. Los precios, disponibilidad y vigencia de cada promoción
            son referenciales y están sujetos a confirmación directa con un asesor de viaje
            antes de cerrar cualquier compra. El sitio en sí no procesa pagos ni reservas
            automáticas -- toda solicitud se coordina por WhatsApp con un asesor humano.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Formularios y contacto</h2>
          <p>
            Al llenar un formulario del sitio (contacto, cotizador, carrito) o escribirnos por
            WhatsApp/redes sociales, autorizás a Lotus 360 a contactarte para darte seguimiento
            a tu solicitud, según lo descrito en nuestra{" "}
            <a href="/privacidad" className="underline">política de privacidad</a>.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Contenido</h2>
          <p>
            Las fotos, descripciones y precios publicados corresponden a los proveedores
            (hoteles, operadores turísticos) con los que trabaja Lotus 360, y pueden cambiar sin
            aviso previo. Ante cualquier duda sobre un servicio puntual, la información que da
            un asesor directamente prevalece sobre lo publicado en el sitio.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Contacto</h2>
          <p>Para dudas sobre estos términos, escríbenos por WhatsApp o nuestras redes sociales.</p>
        </section>
      </div>
    </main>
  );
}
