"use client";

import { useCallback, useEffect, useState } from "react";

const HISTORIAL_KEY = "lotus360_chat_historial";
const VISTAS_KEY = "lotus360_notificaciones_vistas";
/** El evento nativo "storage" no dispara en la misma pestaña que escribe --
 * AsistenteVirtualPanel dispara este evento custom además de guardar en
 * localStorage, así el badge de la campana se actualiza sin recargar
 * (hallazgo real, auditoría 2026-07-23). */
export const CHAT_ACTUALIZADO_EVENTO = "lotus360-chat-actualizado";

interface MensajeIA {
  texto: string;
  opcion_titulo?: string | null;
}

export interface NotificacionChat {
  id: number;
  texto: string;
  opcionTitulo: string | null;
  leida: boolean;
}

function leerHistorialIA(): MensajeIA[] {
  if (typeof window === "undefined") return [];
  try {
    const guardado = localStorage.getItem(HISTORIAL_KEY);
    if (!guardado) return [];
    const mensajes = JSON.parse(guardado) as { rol: string; texto: string; opcion_titulo?: string | null }[];
    return mensajes.filter((m) => m.rol === "ia" && m.texto);
  } catch {
    return [];
  }
}

/** Notificaciones reales derivadas del historial del chat "Lotus IA" que ya
 * se guarda en localStorage (ver AsistenteVirtualPanel) -- sin backend/tabla
 * nueva, sin datos inventados. "Vistas" es simplemente cuántas respuestas de
 * IA ya se marcaron como leídas, persistido aparte. */
export function useNotificacionesChat() {
  const [notificaciones, setNotificaciones] = useState<NotificacionChat[]>([]);

  const recalcular = useCallback(() => {
    const ia = leerHistorialIA();
    const vistas = Number(localStorage.getItem(VISTAS_KEY) ?? "0");
    const lista: NotificacionChat[] = ia
      .map((m, i) => ({
        id: i,
        texto: m.texto,
        opcionTitulo: m.opcion_titulo ?? null,
        leida: i < vistas,
      }))
      .reverse();
    setNotificaciones(lista);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    recalcular();
    window.addEventListener("storage", recalcular);
    window.addEventListener(CHAT_ACTUALIZADO_EVENTO, recalcular);
    return () => {
      window.removeEventListener("storage", recalcular);
      window.removeEventListener(CHAT_ACTUALIZADO_EVENTO, recalcular);
    };
  }, [recalcular]);

  const marcarTodoLeido = useCallback(() => {
    const total = leerHistorialIA().length;
    localStorage.setItem(VISTAS_KEY, String(total));
    recalcular();
  }, [recalcular]);

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return { notificaciones, noLeidas, marcarTodoLeido, refrescar: recalcular };
}
