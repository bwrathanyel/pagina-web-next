import type { Metadata } from "next";
import { Fraunces, Figtree, Space_Mono } from "next/font/google";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatButton } from "@/components/layout/WhatsAppFloatButton";
import { jsonLdScript, buildTravelAgencyJsonLd } from "@/lib/seo/jsonld";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const figtree = Figtree({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const TITLE = "Destino y Eventos Lotus 360 · Agencia de Viajes en Venezuela";
const DESCRIPTION =
  "Tu agencia de viajes #1 en Carabobo. Hospedaje, boletería aérea, full days, tours y eventos corporativos en Venezuela. ¡Escápate con nosotros!";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s | Lotus 360",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  icons: { icon: "/logo-lotus360.png", apple: "/logo-lotus360.png" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Destino y Eventos Lotus 360",
    images: [{ url: "/logo-lotus360.png", width: 512, height: 512, alt: "Logo Lotus 360" }],
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo-lotus360.png"],
  },
  other: {
    "geo.region": "VE-G",
    "geo.placename": "Valencia, Carabobo",
    "geo.position": "10.1820;-68.0034",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es-VE"
      className={`${fraunces.variable} ${figtree.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sand text-ink font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(buildTravelAgencyJsonLd())}
        />
        <Navbar />
        <div className="flex-1">{children}</div>
        <Footer />
        <WhatsAppFloatButton />
      </body>
    </html>
  );
}
