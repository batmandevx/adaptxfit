import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SwRegister from "@/lib/offline/sw-register";
import PwaInstall from "@/components/features/pwa-install";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdaptiFit - AI Adaptive Fitness & Rehabilitation",
  description: "Personalized rehabilitation and fitness for people with disabilities, injured soldiers, and Paralympic athletes. AI motion tracking, mood monitoring, and smart nutrition.",
  keywords: ["adaptive fitness", "rehabilitation", "AI fitness", "disability", "Paralympic", "injury recovery"],
  authors: [{ name: "AdaptiFit Team" }],
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AdaptiFit",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1c" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          {/* Offline-first PWA: SW registration + install/offline UX */}
          <SwRegister />
          <PwaInstall />
        </ThemeProvider>
      </body>
    </html>
  );
}
