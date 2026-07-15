import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatButton } from "@/components/layout/WhatsAppFloatButton";
import { jsonLdScript, buildTravelAgencyJsonLd } from "@/lib/seo/jsonld";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminEditToggle } from "@/components/admin/AdminEditToggle";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

const fraunces = localFont({
  src: "./fonts/fraunces-latin.woff2",
  variable: "--font-display",
  weight: "600 700",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: "Times New Roman",
});

const figtree = localFont({
  src: "./fonts/figtree-latin.woff2",
  variable: "--font-body",
  weight: "400 700",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});

const spaceMono = localFont({
  src: [
    { path: "./fonts/space-mono-400-latin.woff2", weight: "400" },
    { path: "./fonts/space-mono-700-latin.woff2", weight: "700" },
  ],
  variable: "--font-mono",
  display: "swap",
  fallback: ["Courier New", "monospace"],
});

const TITLE = "Destino y Eventos Lotus 360 · Agencia de Viajes en Venezuela";
const DESCRIPTION =
  "Agencia de viajes en Venezuela especializada en hospedaje, boletería aérea, full days, tours y experiencias corporativas.";

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
      suppressHydrationWarning
      className={`${fraunces.variable} ${figtree.variable} ${spaceMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-sand text-ink font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(buildTravelAgencyJsonLd())}
        />
        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
            <WhatsAppFloatButton />
            <AdminEditToggle />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
