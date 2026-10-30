"use client";

import { useRouter } from "next/navigation";
import { MenuCuenta } from "@/components/cuenta/MenuCuenta";
import { RequiereSesion } from "@/components/cuenta/RequiereSesion";

export default function CuentaPage() {
  const router = useRouter();
  return (
    <RequiereSesion>
      <main className="mx-auto max-w-md px-5 py-10 md:py-16">
        <MenuCuenta
          titulo="Mi cuenta"
          onSalir={() => {
            router.push("/");
            router.refresh();
          }}
        />
      </main>
    </RequiereSesion>
  );
}
