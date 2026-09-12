import type { Metadata } from "next";
import { PaginaEnlaces } from "@/components/bio/PaginaEnlaces";

export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function PaginaInstagram() {
  return <PaginaEnlaces red="instagram" />;
}
