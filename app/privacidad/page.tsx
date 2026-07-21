export const metadata = {
  title: "Política de privacidad | Destino y Eventos Lotus 360",
  description: "Cómo Destino y Eventos Lotus 360 recopila, usa y protege tus datos.",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="mb-6 font-display text-3xl font-semibold text-ink">Política de privacidad</h1>
      <div className="flex flex-col gap-5 text-ink-soft">
        <p>
          Destino y Eventos Lotus 360 ("Lotus 360") es una agencia de viajes venezolana. Esta
          página explica qué datos recopilamos cuando usás nuestro sitio web, nuestras redes
          sociales (Instagram, Facebook, TikTok) o nos escribís por WhatsApp, y cómo los usamos.
        </p>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Qué datos recopilamos</h2>
          <p>
            Cuando llenás un formulario en el sitio, escribís por WhatsApp o conversás con
            nuestro asistente en Instagram/Facebook, podemos recopilar: tu nombre, número de
            teléfono, el destino o servicio que te interesa, cantidad de personas, fecha
            estimada de viaje, y el contenido de la conversación (incluyendo mensajes de texto,
            notas de voz e imágenes que nos envíes, cuando aplica).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Para qué los usamos</h2>
          <p>
            Usamos estos datos exclusivamente para conectarte con uno de nuestros asesores de
            viaje, darte seguimiento a tu solicitud, y responderte con información sobre
            hoteles, paquetes y promociones. No vendemos ni compartimos tus datos con terceros
            para fines de publicidad ajenos a Lotus 360.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Redes sociales y APIs de terceros</h2>
          <p>
            Si nos seguís o interactuás con nosotros en Instagram, Facebook o TikTok, esas
            plataformas aplican también sus propias políticas de privacidad. Cuando usamos APIs
            oficiales de esas plataformas (por ejemplo, para leer métricas públicas de nuestras
            propias publicaciones), solo accedemos a datos de nuestra propia cuenta de negocio,
            nunca a datos privados de otros usuarios.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Dónde se guardan tus datos</h2>
          <p>
            Tus datos se almacenan en nuestro sistema interno (CRM), alojado sobre
            infraestructura de Supabase, con acceso restringido a nuestro equipo de asesores y
            administración.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Contacto</h2>
          <p>
            Si querés que eliminemos tus datos de nuestro sistema, o tenés alguna duda sobre
            esta política, escribinos por WhatsApp o a nuestras redes sociales y lo
            gestionamos directamente.
          </p>
        </section>
      </div>
    </main>
  );
}
