import Image from "next/image";
import { FOTOS_DESTINO, portadaDestino } from "@/lib/promociones/fotosDestino";

const DEFECTO = FOTOS_DESTINO["los roques"][0];

/** Paisaje detrás del fondo liso del sitio, tapado al 85% por `sand`: en claro
 * aclara y en oscuro oscurece con el mismo token (pedido del dueño, 2026-10-25:
 * "más personalidad"). El de por defecto va en el layout; una página con
 * destino pone el suyo y globals.css oculta el defecto con :has(). Como
 * next/image es lazy, el oculto (display:none) no se descarga. */
export function FondoPaisaje({ destino, defecto }: { destino?: string | null; defecto?: boolean }) {
  const foto = defecto ? { url: `/destinos/${DEFECTO.archivo}.jpg` } : destino ? portadaDestino(destino) : undefined;
  if (!foto) return null;
  return (
    <div
      aria-hidden="true"
      {...(defecto ? { "data-fondo-defecto": "" } : { "data-fondo-pagina": "" })}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden [contain:strict]"
    >
      <Image src={foto.url} alt="" fill sizes="100vw" fetchPriority="low" className="object-cover" />
      <div className="absolute inset-0 bg-sand/85" />
    </div>
  );
}
