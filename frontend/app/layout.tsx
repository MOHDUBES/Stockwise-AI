import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { LayoutWrapper } from "@/components/layout/LayoutWrapper";
import { AuthProvider } from "@/components/AuthProvider";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "StockWise AI — Smart Inventory & Sales Decision Assistant",
    template: "%s | StockWise AI",
  },
  description:
    "AI-powered inventory intelligence for kirana stores and local retail shops. Make reorder and pricing decisions in seconds, not hours.",
  keywords: ["inventory management", "kirana store", "retail analytics", "AI reorder", "demand forecasting"],
  authors: [{ name: "StockWise AI" }],
  robots: "index, follow",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: "StockWise AI — Smart Inventory & Sales Decision Assistant",
    description: "Transform your daily reorder decisions from hours to seconds.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>
          <AuthProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
