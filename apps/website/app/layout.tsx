import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nexora-tech.pt"),

  title: {
    default: "Nexora Tech | Inteligência Artificial, Automação e Software",
    template: "%s | Nexora Tech",
  },

  description:
    "A Nexora Tech desenvolve soluções de inteligência artificial, automação e software personalizado para ajudar empresas a simplificar processos, aumentar a produtividade e crescer com tecnologia.",

  keywords: [
    "Nexora Tech",
    "inteligência artificial",
    "IA para empresas",
    "automação empresarial",
    "software personalizado",
    "desenvolvimento web",
    "assistentes virtuais",
    "chatbots",
    "transformação digital",
    "Portugal",
  ],

  authors: [
    {
      name: "Nexora Tech",
      url: "https://nexora-tech.pt",
    },
  ],

  creator: "Nexora Tech",
  publisher: "Nexora Tech",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  alternates: {
    canonical: "https://nexora-tech.pt",
  },

  openGraph: {
    type: "website",
    locale: "pt_PT",
    url: "https://nexora-tech.pt",
    siteName: "Nexora Tech",
    title:
      "Nexora Tech | Inteligência Artificial, Automação e Software",
    description:
      "Soluções de inteligência artificial, automação e software personalizado para empresas.",
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Nexora Tech | Inteligência Artificial, Automação e Software",
    description:
      "Soluções de inteligência artificial, automação e software personalizado para empresas.",
  },

  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-PT"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}