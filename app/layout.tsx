import type { Metadata } from "next";
import "./globals.css";
import { Playfair_Display, Allura, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const allura = Allura({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-allura",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TraceEye | Food traceability",
  description: "Verified food supply-chain intelligence",
  icons: { icon: "/images/favicon.png", shortcut: "/images/favicon.png", apple: "/images/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${playfair.variable} ${allura.variable} ${inter.variable}`}>
      <body>
        {children}
      </body>
    </html>
  );
}
