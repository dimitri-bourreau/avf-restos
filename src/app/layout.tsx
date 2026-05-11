/**
 * Layout principal de l'application
 * Gère la structure HTML, les métadonnées et les styles globaux
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Carte des Restaurants AVF",
  description: "Visualisation des restaurants sur une carte Google Maps",
  keywords: ["restaurant", "carte", "AVF", "Google Maps"],
  authors: [{ name: "AVF" }],
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
  // Open Graph pour le partage sur les réseaux sociaux
  openGraph: {
    title: "Carte des Restaurants AVF",
    description: "Visualisation des restaurants sur une carte Google Maps",
    url: "https://avf-restos-map.vercel.app",
    siteName: "AVF Restaurants",
    type: "website",
  },
  // Favicon
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  // Manifest pour PWA
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.className} antialiased`}>
        <header className="bg-gradient-to-r from-blue-700 to-blue-900 text-white">
          <div className="container mx-auto px-4 py-4">
            <h1 className="text-2xl md:text-3xl font-bold">
              Carte des Restaurants AVF
            </h1>
            <p className="text-blue-100 mt-1">
              Visualisation des restaurants sur Google Maps
            </p>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6 md:py-8">{children}</main>
        <footer className="bg-gray-800 text-white text-center py-4 mt-8">
          <p className="text-gray-400 text-sm">
            Données provenantes de Google Sheets | API Google Maps
          </p>
        </footer>
      </body>
    </html>
  );
}
