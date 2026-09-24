export const metadata = {
  title: "Política de privacidad | Destino y Eventos Lotus 360",
  description: "Cómo Destino y Eventos Lotus 360 recopila, usa y protege sus datos.",
};

export default function PrivacidadPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <h1 className="mb-5 font-display text-3xl font-semibold text-ink">Política de privacidad</h1>
      <div className="flex flex-col gap-5 leading-7 text-ink-soft">
        <p>
          Destino y Eventos Lotus 360 (&quot;Lotus 360&quot;) es una agencia de viajes venezolana. Esta
          página explica qué datos recopilamos cuando usa nuestro sitio web, nuestras redes
          sociales (Instagram, Facebook, TikTok) o nos escribe por WhatsApp, y cómo los usamos.
        </p>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Qué datos recopilamos</h2>
          <p>
            Cuando llena un formulario en el sitio, escribe por WhatsApp o conversa con
            nuestro asistente en Instagram/Facebook, podemos recopilar: su nombre, número de
            teléfono, el destino o servicio que le interesa, cantidad de personas, fecha
            estimada de viaje, y el contenido de la conversación (incluyendo mensajes de texto,
            notas de voz e imágenes que nos envíe, cuando aplica).
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Para qué los usamos</h2>
          <p>
            Usamos estos datos exclusivamente para ponerlo en contacto con uno de nuestros asesores de
            viaje, dar seguimiento a su solicitud y responderle con información sobre
            hoteles, paquetes y promociones. No vendemos ni compartimos sus datos con terceros
            para fines de publicidad ajenos a Lotus 360.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Redes sociales y APIs de terceros</h2>
          <p>
            Si nos sigue o interactúa con nosotros en Instagram, Facebook o TikTok, esas
            plataformas aplican también sus propias políticas de privacidad. Cuando usamos APIs
            oficiales de esas plataformas (por ejemplo, para leer métricas públicas de nuestras
            propias publicaciones), solo accedemos a datos de nuestra propia cuenta de negocio,
            nunca a datos privados de otros usuarios.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Dónde se guardan sus datos</h2>
          <p>
            Sus datos se almacenan en nuestro sistema interno de gestión, alojado sobre
            infraestructura de Supabase, con acceso restringido a nuestro equipo de asesores y
            administración.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-xl font-semibold text-ink">Contacto</h2>
          <p>
            Si quiere que eliminemos sus datos de nuestro sistema, o tiene alguna duda sobre
            esta política, escríbanos por WhatsApp o a nuestras redes sociales y lo
            gestionamos directamente.
          </p>
        </section>
      </div>
    </main>
  );
}
