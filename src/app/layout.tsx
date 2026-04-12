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
  title: "StudyBuddy - AI Study Planner",
  description: "The smartest way to organize your learning.",
};

import { Providers } from "@/components/Providers";
import { Footer } from "@/components/Footer";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex flex-col min-h-screen">
        <Providers>
          <div className="flex-1 flex flex-col">
            {children}
          </div>
          <Footer />
          <Toaster position="top-right" theme="dark" closeButton richColors />
        </Providers>
      </body>
    </html>
  );
}
