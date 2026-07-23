"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { AsistenteVirtualPanel } from "@/components/layout/AsistenteVirtualPanel";
import { tieneFooterStickyPropio } from "@/lib/layout/rutasConFooterSticky";

export function AsistenteVirtualButton() {
  const [abierto, setAbierto] = useState(false);
  const pathname = usePathname();
  const conFooterSticky = tieneFooterStickyPropio(pathname);

  return (
    <>
      <nav aria-label="Asistente virtual">
        <div
          className={
            "fixed right-5 z-40 lg:bottom-24 " + (conFooterSticky ? "bottom-60" : "bottom-40")
          }
          style={{
            marginBottom: "env(safe-area-inset-bottom)",
            marginRight: "env(safe-area-inset-right)",
          }}
        >
          <button
            type="button"
            onClick={() => setAbierto(true)}
            aria-label="Hablar con Lotus, el asistente virtual"
            title="Hablar con Lotus, el asistente virtual"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-seafoam text-white shadow-[0_10px_28px_-8px_rgba(62,130,125,0.55)]"
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.2-3.6A7.96 7.96 0 0 1 4 12z"
                fill="currentColor"
              />
              <path
                d="M17.5 3.5l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7.7-1.6z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </nav>
      {abierto && <AsistenteVirtualPanel onClose={() => setAbierto(false)} />}
    </>
  );
}
