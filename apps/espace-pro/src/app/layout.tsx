import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { EnregistrementSW } from "@/components/shell/enregistrement-sw";
import { SessionProvider, themeInitScript } from "@/lib/session";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Espace Pro", template: "%s | Espace Pro" },
  description: "La plateforme des équipes et du réseau Picard Serrures et Eliot.",
  applicationName: "Espace Pro",
  appleWebApp: { capable: true, title: "Espace Pro", statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/apple-touch-icon.png" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b2545",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-brand="picard" data-theme="light" className={archivo.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <SessionProvider>{children}</SessionProvider>
        <EnregistrementSW />
      </body>
    </html>
  );
}
