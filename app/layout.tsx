import type { Metadata } from "next";
import localFont from "next/font/local";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { WhatsAppFloatButton } from "@/components/layout/WhatsAppFloatButton";
import { jsonLdScript, buildTravelAgencyJsonLd } from "@/lib/seo/jsonld";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { AdminEditToggle } from "@/components/admin/AdminEditToggle";
import { SiteContentProvider } from "@/components/providers/SiteContentProvider";
import { getSiteContent } from "@/lib/site-content/server";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

// Fuerza SSR en cada visita para todo el árbol de rutas: el ISR estático de
// Netlify se quedó sirviendo contenido vencido indefinidamente (Cache-Status
// "hit; fwd=stale" minutos después del revalidate de 300s, confirmado con
// curl en producción) — las ediciones de catálogo/contenido nunca llegaban
// al público. Coste: sin caché estático por página; aceptado por prioridad
// de correctitud sobre performance en este sitio.
export const dynamic = "force-dynamic";

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
    template: "%s | Destino y Eventos Lotus 360",
  },
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  // Los íconos los generan las convenciones de archivo de Next (app/favicon.ico,
  // app/icon.png 192x192 múltiplo de 48 para cumplir el requisito de favicon de
  // Google, app/apple-icon.png). No declarar icons aquí para no emitir un
  // <link rel="icon"> duplicado apuntando a un PNG de 1024px (no múltiplo de 48,
  // que hacía que Google mostrara el globo genérico en vez del logo).
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: "Destino y Eventos Lotus 360",
    images: [
      {
        url: "/logo-lotus360-transparent.png",
        width: 1024,
        height: 1024,
        alt: "Logo de Destino y Eventos Lotus 360",
      },
    ],
    locale: "es_VE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/logo-lotus360-transparent.png"],
  },
  other: {
    "geo.region": "VE-G",
    "geo.placename": "Valencia, Carabobo",
    "geo.position": "10.1820;-68.0034",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();

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
            <SiteContentProvider initialContent={siteContent}>
              <Navbar />
              <div className="flex-1">{children}</div>
              <Footer />
              <WhatsAppFloatButton />
              <AdminEditToggle />
            </SiteContentProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
