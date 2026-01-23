import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { SITE_CONFIG } from "@/lib/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: `Kids Football Training Luton & Bedfordshire | ${SITE_CONFIG.name}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  keywords: [
    "kids football",
    "children football coaching",
    "youth football",
    "football training Luton",
    "football coaching Bedfordshire",
    "after school football club",
    "holiday football camp",
    "half term football",
    "kids sports Luton",
    "children activities Bedfordshire",
  ],
  authors: [{ name: SITE_CONFIG.name }],
  creator: SITE_CONFIG.name,
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://takethenextstep121.co.uk",
    siteName: SITE_CONFIG.name,
    title: `Kids Football Training Luton & Bedfordshire | ${SITE_CONFIG.name}`,
    description: SITE_CONFIG.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `Kids Football Training Luton & Bedfordshire | ${SITE_CONFIG.name}`,
    description: SITE_CONFIG.description,
  },
  robots: {
    index: true,
    follow: true,
  },
  metadataBase: new URL("https://takethenextstep121.co.uk"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SportsActivityLocation",
              name: SITE_CONFIG.name,
              description: SITE_CONFIG.description,
              url: "https://takethenextstep121.co.uk",
              telephone: SITE_CONFIG.phone,
              email: SITE_CONFIG.email,
              address: {
                "@type": "PostalAddress",
                addressLocality: "Luton",
                addressRegion: "Bedfordshire",
                addressCountry: "GB",
              },
              geo: {
                "@type": "GeoCoordinates",
                latitude: "51.8787",
                longitude: "-0.4200",
              },
              areaServed: [
                {
                  "@type": "City",
                  name: "Luton",
                },
                {
                  "@type": "City",
                  name: "Barton-le-Clay",
                },
                {
                  "@type": "City",
                  name: "Silsoe",
                },
              ],
              priceRange: "££",
              openingHours: "Mo-Fr 15:00-18:00",
              sameAs: [SITE_CONFIG.facebook, SITE_CONFIG.instagram],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-white font-sans antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
