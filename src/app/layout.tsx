import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SITE_URL } from "@/lib/site";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Frutificar Digital — Cursos, IA e gestão para a cafeicultura",
    template: "%s | Frutificar Digital",
  },
  description:
    "Plataforma de educação e gestão para cafeicultores: cursos de café, chat com técnico IA especialista, diagnóstico de solo por imagem, lives, podcasts e gestão da propriedade. Planos a partir de R$ 47/mês.",
  keywords: [
    "cafeicultura",
    "curso de café",
    "gestão rural",
    "diagnóstico de solo",
    "IA agrícola",
    "manejo de pragas",
    "agronomia",
    "produtor rural",
  ],
  applicationName: "Frutificar Digital",
  authors: [{ name: "Frutificar Digital" }],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: SITE_URL,
    siteName: "Frutificar Digital",
    title: "Frutificar Digital — Do plantio à xícara, conhecimento de ponta",
    description:
      "Cursos, IA especialista em café, diagnóstico de solo e gestão da propriedade — em três planos que crescem com você.",
    // A imagem OG é gerada por src/app/opengraph-image.tsx (convenção do Next).
  },
  twitter: {
    card: "summary_large_image",
    title: "Frutificar Digital",
    description: "Educação e gestão para a cafeicultura brasileira.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0b2a1a",
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${jakarta.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
