import Image from "next/image";
import { CREDITOS_FOTOS_DESTINO } from "@/lib/promociones/creditosFotosDestino";

export const metadata = {
  title: "Créditos fotográficos | Destino y Eventos Lotus 360",
  description: "Autores, fuentes y licencias de nuestra selección de fotografías de destinos.",
};

export default function CreditosFotograficosPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-8 md:py-12">
      <h1 className="mb-5 font-display text-3xl font-bold text-ink">Créditos fotográficos</h1>
      <p className="mb-8 leading-7 text-ink-soft">
        Estas fotografías de destinos se publican con las licencias indicadas junto a cada imagen.
        Las versiones del sitio se han redimensionado y comprimido; su encuadre puede variar según
        la pantalla. Las adaptaciones se ofrecen bajo la misma licencia que el original.
      </p>
      <ul className="space-y-6">
        {CREDITOS_FOTOS_DESTINO.map((foto) => (
          <li key={foto.archivo} className="overflow-hidden rounded-card border border-linea bg-card">
            <div className="relative aspect-video">
              <Image src={`/destinos/${foto.archivo}.jpg`} alt={foto.alt} fill sizes="(min-width: 768px) 720px, 100vw" className="object-cover" />
            </div>
            <div className="space-y-2 p-5 leading-7 text-ink-soft">
              <h2 className="font-display text-xl font-bold text-ink">{foto.titulo}</h2>
              <p>
                Fotografía: <a href={foto.autorUrl} className="text-acento underline underline-offset-4">{foto.autor}</a>.
                {" "}<a href={foto.fuente} className="text-acento underline underline-offset-4">Ver fuente y fotografía original</a>.
              </p>
              <p>
                Licencia: <a href={foto.licenciaUrl} rel="license" className="text-acento underline underline-offset-4">{foto.licencia}</a>.
              </p>
              <p className="text-sm">
                Adaptación de Lotus 360: redimensionado, compresión y encuadre para web.
              </p>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
