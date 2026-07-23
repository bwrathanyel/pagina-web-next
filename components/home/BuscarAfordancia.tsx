import Link from "next/link";

export function BuscarAfordancia() {
  return (
    <div className="px-5 pb-2 lg:hidden">
      <Link
        href="/buscar"
        className="flex min-h-12 items-center gap-3 rounded-full border border-ink/12 bg-card px-5 text-sm text-ink-soft"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" />
          <path d="M20 20l-4.5-4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        Buscar destinos, hoteles, paquetes…
      </Link>
    </div>
  );
}
