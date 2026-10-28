import type { Metadata } from "next";

// Páginas privadas del usuario: sin esto heredaban index + canonical del home.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
