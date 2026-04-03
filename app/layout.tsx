import type { Metadata } from "next";
import { Cinzel } from "next/font/google";
import { GeistMono, GeistSans } from "geist/font";
import "./globals.css";
import { AuroraBackground } from "@/components/background/aurora";
import { ParticleField } from "@/components/background/particle-field";

const geistSans = GeistSans;
const geistMono = GeistMono;

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Person dos crias ",
  description: "Monte partidas personalizadas de League of Legends com estilo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="bg-[#070a14] text-neutral-foreground">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} antialiased min-h-screen`}
      >
        {/* overflow-x-hidden: animações não criam barra horizontal; fundo vem do body + Aurora */}
        <div className="relative flex min-h-dvh flex-col overflow-x-hidden">
          <AuroraBackground />
          <ParticleField density={28} />
          <main className="relative z-10 flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
