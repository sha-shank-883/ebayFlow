import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://ebayflow.ai"),
  title: {
    default: "eBay Flow AI - AI-Powered eBay Listing Management Platform",
    template: "%s | eBay Flow AI",
  },
  description: "Streamline your eBay selling business with AI-powered listing optimization, inventory management, order tracking, and analytics. Trusted by 10,000+ UK sellers.",
  keywords: ["eBay listing tool", "eBay management", "AI listing optimizer", "inventory management", "eBay analytics", "UK eBay seller", "eBay automation", "listing generator"],
  authors: [{ name: "eBay Flow AI" }],
  creator: "eBay Flow AI",
  publisher: "eBay Flow AI",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://ebayflow.ai",
    title: "eBay Flow AI - AI-Powered eBay Listing Management",
    description: "Streamline your eBay selling business with AI-powered listing optimization, inventory management, order tracking, and analytics.",
    siteName: "eBay Flow AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "eBay Flow AI - AI-Powered eBay Management Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "eBay Flow AI - AI-Powered eBay Listing Management",
    description: "Streamline your eBay selling business with AI-powered listing optimization, inventory management, order tracking, and analytics.",
    images: ["/og-image.png"],
    creator: "@ebayflowai",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
    other: [
      { rel: "icon", url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: "https://ebayflow.ai",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1c" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
              style: {
                borderRadius: "12px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
