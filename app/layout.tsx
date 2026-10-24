import type { Metadata } from "next";
import { ViewTransition } from "react";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { CargaFotos } from "@/components/providers/CargaFotos";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CromoSitio } from "@/components/layout/CromoSitio";
import { ContactoFab } from "@/components/layout/ContactoFab";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { BuscadorGlobal } from "@/components/layout/BuscadorGlobal";
import { CarritoHoja } from "@/components/layout/CarritoHoja";
import { jsonLdScript, buildTravelAgencyJsonLd } from "@/lib/seo/jsonld";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import { AdminEditToggle } from "@/components/admin/AdminEditToggle";
import { Analitica } from "@/components/analitica/Analitica";
import { SiteContentProvider } from "@/components/providers/SiteContentProvider";
import { getSiteContent } from "@/lib/site-content/server";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://destinoyeventoslotus360.com";

// Al terminar de cargar, si alguna hoja de /_next/static no tiene `sheet`
// (falló la descarga), recarga. Una sola recarga por hoja y por sesión: si esa
// misma hoja vuelve a fallar (bloqueador, red caída) no se recarga más. El tope
// anterior por tiempo (10 s) entraba en bucle cuando la página tardaba más de
// 10 s en cargar, y cada vuelta es un request al Worker. Sin sessionStorage no
// se recarga nunca.
const RECARGA_SI_FALTA_CSS = `(function(){function c(){var l=document.querySelectorAll('link[rel="stylesheet"][href*="/_next/static/"]');for(var i=0;i<l.length;i++){if(!l[i].sheet){var h=l[i].getAttribute("href");try{var v=sessionStorage.getItem("recarga-css")||"";if(v.indexOf("|"+h+"|")>=0)return;sessionStorage.setItem("recarga-css",(v.length>2000?"":v)+"|"+h+"|")}catch(e){return}location.reload();return}}}if(document.readyState==="complete")c();else addEventListener("load",c)})()`;

// Backstop de frescura, no la vía principal de actualización. La ruta normal
// es la purga on-demand (revalidatePath en app/api/admin/revalidate/route.ts),
// instantánea vía el tag cache de D1 + la cola de Durable Objects de OpenNext
// (ver open-next.config.ts). Este valor solo acota el daño cuando esa purga
// falla en silencio: los 11 call sites de revalidarSitioPublico() degradan a
// un aviso en pantalla, así que una purga fallida dejaría la página vencida
// para siempre -- que fue el bug real que motivó el force-dynamic anterior
// (era un parche a un síntoma de Netlify, no la causa real). 3600s y no 300s:
// ~360 re-renders/día en vez de ~4.300, contra un fallo que además ya se le
// avisa al admin.
export const revalidate = 3600;

// Las @font-face están en globals.css (ahí se explica por qué no next/font).
// Se precargan las cuatro (72 KB): sin esto el navegador las descubre recién
// al aplicar el CSS y el primer pintado sale con la de respaldo.
const FUENTES = [
  "/fonts/archivo-cond-latin-v1.woff2",
  "/fonts/figtree-latin-v1.woff2",
  "/fonts/space-mono-400-latin-v1.woff2",
  "/fonts/space-mono-700-latin-v1.woff2",
];

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
    <html lang="es-VE" suppressHydrationWarning className="h-full antialiased">
      {/* <link> directo y no preload() de react-dom: en páginas dinámicas
          (/cotizar) el hint viaja por el flight tras vaciar el <head> y el
          navegador no lo recibe a tiempo. */}
      <head>
        {FUENTES.map((href) => (
          <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />
        ))}
      </head>
      <body className="min-h-full flex flex-col bg-sand text-ink font-body">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(buildTravelAgencyJsonLd())}
        />
        {/* Cada deploy borra el CSS del build anterior. Al volver atrás, el
            navegador puede restaurar de su caché un HTML viejo que apunta a
            ese CSS (404) y la página queda sin estilos. Recarga una vez. */}
        <script dangerouslySetInnerHTML={{ __html: RECARGA_SI_FALTA_CSS }} />
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              <SiteContentProvider initialContent={siteContent}>
                <MotionProvider>
                  <CromoSitio><Navbar /></CromoSitio>
                  <div className="flex flex-1 flex-col pb-20 lg:pb-0">
                    {/* Las navegaciones son transiciones: solo el contenido
                        cruza, el cromo queda quieto. default="none" evita que
                        otros ViewTransition con nombre lo arrastren. */}
                    <ViewTransition update="pagina" default="none">
                      <div className="flex-1">{children}</div>
                    </ViewTransition>
                    <CromoSitio><Footer /></CromoSitio>
                  </div>
                  <CromoSitio>
                    <ContactoFab />
                    <BottomTabBar />
                    <CarritoHoja />
                    <BuscadorGlobal />
                  </CromoSitio>
                  <AdminEditToggle />
                  <Analitica />
                  <CargaFotos />
                </MotionProvider>
              </SiteContentProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
