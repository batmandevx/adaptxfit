import type { Metadata, Viewport } from "next";
import { Sora, Inter, IBM_Plex_Mono, Atkinson_Hyperlegible } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import SwRegister from "@/lib/offline/sw-register";
import PwaInstall from "@/components/features/pwa-install";

/* Clinical Aurora typography (design.md §6.1) */
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["500", "600"],
});

const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
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
    { media: "(prefers-color-scheme: light)", color: "#F4F8F5" },
    { media: "(prefers-color-scheme: dark)", color: "#07110F" },
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
        className={`${sora.variable} ${inter.variable} ${plexMono.variable} ${atkinson.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
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
