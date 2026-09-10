import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PagarCliente } from "./PagarCliente";

// Un link de pago no se indexa ni se comparte en buscadores: es una
// credencial de un solo uso.
export const metadata: Metadata = {
  title: "Pagar",
  robots: { index: false, follow: false },
};

const TOKEN_RE = /^[0-9a-f]{64}$/;

export default async function PagarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!TOKEN_RE.test(token)) notFound();

  return (
    <main className="mx-auto max-w-lg px-5 py-8 pb-28 md:py-12 lg:pb-12">
      <PagarCliente token={token} />
    </main>
  );
}
