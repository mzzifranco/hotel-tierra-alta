import type { Metadata } from "next";
import { PT_Serif } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const ptSerif = PT_Serif({
  variable: "--font-main",
  subsets: ["latin"],
  weight: ["400","700"],
});

export const metadata: Metadata = {
  title: "Hotel Tierra Alta",
  description: "Sistema de gestión hotelera",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${ptSerif.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}