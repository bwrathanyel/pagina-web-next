"use client";

import { useState } from "react";
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

export function HeaderControls({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const cantidad = useCarritoStore((s) => s.items.length);
  const { notificaciones, noLeidas, marcarTodoLeido, refrescar } = useNotificacionesChat();
  const [panelAbierto, setPanelAbierto] = useState(false);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => {
          refrescar();
          setPanelAbierto(true);
        }}
        aria-label={`Notificaciones${noLeidas > 0 ? `, ${noLeidas} sin leer` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand-2"
      >
        <BellIcon />
        {noLeidas > 0 ? (
          <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" aria-hidden="true" />
        ) : null}
      </button>
      {panelAbierto ? (
        <NotificacionesPanel
          notificaciones={notificaciones}
          onClose={() => setPanelAbierto(false)}
          onMarcarLeido={marcarTodoLeido}
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
      <Link
        href="/carrito"
        onClick={onNavigate}
        aria-label={`Carrito${cantidad > 0 ? `, ${cantidad} ítem(s)` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand-2"
      >
        <CartIcon />
        {cantidad > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-coral px-1 font-mono text-[0.6rem] font-bold text-white">
            {cantidad}
          </span>
        ) : null}
      </Link>
    </div>
  );
}
