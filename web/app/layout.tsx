import type { Metadata } from "next";
import { Fraunces, Inter, Caveat } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import Providers from "@/components/Providers";
import AuthGate from "@/components/AuthGate";
import GlobalHeader from "@/components/ui/GlobalHeader";
import "./globals.css";

const GA_ID = "G-KX96VHY57L";
const IS_PROD = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-hand",
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://worldexpressions.app"),
  title: "World Expressions",
  description: "Every language has its own madness.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "World Expressions",
    description: "Every language has its own madness.",
    url: "https://worldexpressions.app",
    siteName: "World Expressions",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <AuthGate />
          <GlobalHeader />
          {children}
        </Providers>
        <Analytics />
        {IS_PROD && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
