"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useFavoritos } from "@/lib/favoritos/useFavoritos";

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M12 20.5s-7.5-4.6-10-9.3C0.3 7.7 1.8 4 5.5 4c2.1 0 3.6 1.1 4.5 2.3C10.9 5.1 12.4 4 14.5 4 18.2 4 19.7 7.7 18 11.2c-2.5 4.7-10 9.3-10 9.3z" />
    </svg>
  );
}

/** Overlay mobile-only sobre la foto principal: volver + favorito. En
 * desktop ya hay Navbar para volver, no se duplica. */
export function ProductoAccionesOverlay({
  tipo,
  id,
  nombre,
}: {
  tipo: "producto" | "promocion";
  id: number;
  nombre: string;
}) {
  const router = useRouter();
  const { esFavorito, toggle } = useFavoritos();
  const favorito = esFavorito(tipo, id);

  return (
    <div className="absolute inset-x-4 top-4 z-10 flex items-center justify-between lg:hidden">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Volver"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-md"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        onClick={async () => {
          const r = await toggle(tipo, id);
          if (r === "login-requerido") router.push("/cuenta/login");
        }}
        aria-label={favorito ? `Quitar ${nombre} de favoritos` : `Guardar ${nombre} en favoritos`}
        aria-pressed={favorito === true}
        className={"flex h-10 w-10 items-center justify-center rounded-full bg-black/35 backdrop-blur-md " + (favorito ? "text-coral-bright" : "text-white")}
      >
        <HeartIcon filled={favorito === true} />
      </button>
    </div>
  );
}

/** Footer sticky mobile-only con el CTA principal, arriba del bottom tab bar. */
export function ProductoFooterMobile({ cotizarHref }: { cotizarHref: string }) {
  return (
    <div
      className="fixed inset-x-0 bottom-24 z-30 border-t border-ink/10 bg-card/95 px-5 py-3 backdrop-blur-lg lg:hidden"
    >
      <Link
        href={cotizarHref}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-coral text-sm font-bold text-white"
      >
        <span aria-hidden="true">↗</span> Cotizar este plan
      </Link>
    </div>
  );
}
