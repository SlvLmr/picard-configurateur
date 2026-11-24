import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: "Ma Porte — Picard Serrures",
  description:
    "Configurez votre porte blindée Picard Serrures sur mesure. Personnalisez chaque détail et projetez-vous chez vous.",
  metadataBase: new URL("https://maporte.picard-serrures.com"),
  openGraph: {
    title: "Ma Porte — Picard Serrures",
    description:
      "Le configurateur premium des portes blindées Picard Serrures.",
    type: "website",
    locale: "fr_FR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
