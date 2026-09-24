"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCarritoStore } from "@/lib/carrito/store";
import { usePaneles } from "@/lib/layout/paneles";
import { useNotificacionesChat } from "@/lib/notificaciones/useNotificacionesChat";
import { NotificacionesPanel } from "@/components/layout/NotificacionesPanel";
import { BOTON_ICONO } from "@/components/layout/botonIcono";
import { Icono } from "@/components/ui/Icono";
import { Contador } from "@/components/ui/Insignia";

/** `compacto`: header móvil, solo buscar y carrito -- la campana (notificaciones
 * del chat IA) vive en el FAB unificado (ContactoFab) y la cuenta en la barra
 * inferior. Evita montar useNotificacionesChat/panel dos veces (móvil y
 * escritorio) cuando el móvil no los necesita. */
export function HeaderControls({
  onNavigate,
  compacto = false,
}: {
  onNavigate?: () => void;
  compacto?: boolean;
}) {
  const { user } = useAuth();
  const pathname = usePathname();
  const cantidad = useCarritoStore((s) => s.items.length);
  const abrirCarrito = usePaneles((s) => s.abrirCarrito);
  const abrirBuscador = usePaneles((s) => s.abrirBuscador);
  const notif = useNotificacionesChat();
  const [panelAbierto, setPanelAbierto] = useState(false);
  const campanaRef = useRef<HTMLButtonElement>(null);

  const etiquetaCarrito = `Carrito${cantidad > 0 ? `, ${cantidad} ${cantidad === 1 ? "elemento" : "elementos"}` : ""}`;

  const buscar = (
    <button
      type="button"
      onClick={abrirBuscador}
      aria-label="Buscar"
      aria-keyshortcuts="Control+K Meta+K"
      title="Buscar (Ctrl K)"
      className={BOTON_ICONO}
    >
      <Icono nombre="buscar" />
    </button>
  );

  // En /carrito el botón navega en vez de abrir la hoja: la página ya es el carrito.
  const contenidoCarrito = (
    <>
      <Icono nombre="carrito" />
      <Contador valor={cantidad} className="right-0.5 top-0.5" />
    </>
  );
  const carrito =
    pathname === "/carrito" ? (
      <Link href="/carrito" aria-label={etiquetaCarrito} aria-current="page" className={BOTON_ICONO}>
        {contenidoCarrito}
      </Link>
    ) : (
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          abrirCarrito();
        }}
        aria-label={etiquetaCarrito}
        aria-haspopup="dialog"
        className={BOTON_ICONO}
      >
        {contenidoCarrito}
      </button>
    );

  if (compacto) {
    return (
      <div className="flex items-center">
        {buscar}
        {carrito}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {buscar}
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
        className={BOTON_ICONO}
      >
        <span className={notif.noLeidas > 0 ? "animate-campana-balanceo block" : "block"}>
          <Icono nombre="campana" />
        </span>
        {notif.noLeidas > 0 ? (
          <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-pill bg-acento ring-2 ring-card" aria-hidden="true" />
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
      <Link href={user ? "/cuenta" : "/cuenta/login"} onClick={onNavigate} aria-label="Mi cuenta" className={BOTON_ICONO}>
        <Icono nombre="usuario" />
      </Link>
      {carrito}
    </div>
  );
}
