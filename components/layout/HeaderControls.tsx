"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCarritoStore } from "@/lib/carrito/store";
import { useNotificacionesChat } from "@/lib/notificaciones/useNotificacionesChat";
import { NotificacionesPanel } from "@/components/layout/NotificacionesPanel";

function UserIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="9" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2 3h2l2.6 12.6a2 2 0 0 0 2 1.4h8.8a2 2 0 0 0 2-1.6L21 7H6" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

/** `soloCarrito`: usado en el header móvil desde el rediseño 2026-08-14 --
 * campana (notificaciones del chat IA) y cuenta se sacaron de ahí porque ya
 * viven en el FAB unificado (ContactoFab) y en el bottom tab bar
 * respectivamente. Evita montar useNotificacionesChat/panel dos veces
 * (móvil y desktop) cuando el móvil ya no los necesita. */
export function HeaderControls({
  onNavigate,
  soloCarrito = false,
}: {
  onNavigate?: () => void;
  soloCarrito?: boolean;
}) {
  const { user } = useAuth();
  const cantidad = useCarritoStore((s) => s.items.length);
  const notif = useNotificacionesChat();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [rebotando, setRebotando] = useState(false);
  const campanaRef = useRef<HTMLButtonElement>(null);
  const cantidadPrevRef = useRef(cantidad);

  // Rebote solo cuando la cantidad sube (no en cada re-render ni al bajar).
  useEffect(() => {
    if (cantidad > cantidadPrevRef.current) {
      setRebotando(true);
      const t = setTimeout(() => setRebotando(false), 400);
      cantidadPrevRef.current = cantidad;
      return () => clearTimeout(t);
    }
    cantidadPrevRef.current = cantidad;
  }, [cantidad]);

  const carrito = (
    <Link
      href="/carrito"
      onClick={onNavigate}
      aria-label={`Carrito${cantidad > 0 ? `, ${cantidad} ítem(s)` : ""}`}
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand-2"
    >
      <span className={rebotando ? "motion-safe:animate-carrito-rebote block" : "block"}>
        <CartIcon />
      </span>
      {cantidad > 0 ? (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[0.6rem] font-bold text-white">
          {cantidad}
        </span>
      ) : null}
    </Link>
  );

  if (soloCarrito) {
    return <div className="flex items-center gap-1">{carrito}</div>;
  }

  return (
    <div className="flex items-center gap-1">
      <button
        ref={campanaRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={panelAbierto}
        onClick={() => {
          notif.refrescar();
          setPanelAbierto(true);
        }}
        aria-label={`Notificaciones${notif.noLeidas > 0 ? `, ${notif.noLeidas} sin leer` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand-2"
      >
        <span className={notif.noLeidas > 0 ? "motion-safe:animate-campana-balanceo block" : "block"}>
          <BellIcon />
        </span>
        {notif.noLeidas > 0 ? (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" aria-hidden="true" />
        ) : null}
      </button>
      {panelAbierto ? (
        <NotificacionesPanel
          notificaciones={notif.notificaciones}
          onClose={() => setPanelAbierto(false)}
          onMarcarLeido={notif.marcarTodoLeido}
          anclaRef={campanaRef}
        />
      ) : null}
      <Link
        href={user ? "/cuenta" : "/cuenta/login"}
        onClick={onNavigate}
        aria-label="Mi cuenta"
        className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand-2"
      >
        <UserIcon />
      </Link>
      {carrito}
    </div>
  );
}
