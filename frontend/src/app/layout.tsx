import { Geist } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./global.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body
        suppressHydrationWarning
        className={`${geist.variable} font-sans h-screen flex flex-col`}
      >
        <Header />
        <main className="flex flex-1 min-h-0 flex-col overflow-y-auto">{children}</main>
        <Footer />
        <Toaster theme="dark" position="bottom-right" />
      </body>
    </html>
  );
}
