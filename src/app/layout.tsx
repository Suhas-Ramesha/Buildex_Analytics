import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Buildex - AI that helps you build, not copy",
  description: "An interactive AI-powered IDE that teaches you to code — step by step, concept by concept.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        <Navbar />
        <main className="flex-1">
          {children}
        </main>
        <footer className="py-8 text-center text-white/50 text-sm border-t border-white/10 mt-auto">
          Built at MVJ College of Engineering, Bengaluru — Dept. of AI & ML
        </footer>
      </body>
    </html>
  );
}
