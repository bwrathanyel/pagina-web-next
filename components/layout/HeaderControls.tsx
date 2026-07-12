"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { useCarritoStore } from "@/lib/carrito/store";

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

export function HeaderControls({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useAuth();
  const cantidad = useCarritoStore((s) => s.items.length);

  return (
    <div className="flex items-center gap-1">
      <Link
        href={user ? "/cuenta" : "/cuenta/login"}
        onClick={onNavigate}
        aria-label="Mi cuenta"
        className="flex h-11 w-11 items-center justify-center rounded-full text-dusk-text"
      >
        <UserIcon />
      </Link>
      <Link
        href="/carrito"
        onClick={onNavigate}
        aria-label={`Carrito${cantidad > 0 ? `, ${cantidad} ítem(s)` : ""}`}
        className="relative flex h-11 w-11 items-center justify-center rounded-full text-dusk-text"
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
