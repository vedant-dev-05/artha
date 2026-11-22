import type { Metadata, Viewport } from "next";
import { Afacad_Flux, Instrument_Sans, Spline_Sans_Mono } from "next/font/google";
import "./globals.css";

const display = Afacad_Flux({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = Spline_Sans_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Artha — Your goals, with a plan",
    template: "%s · Artha",
  },
  description:
    "Artha is a goal-first personal finance companion. Turn aspirations into a realistic monthly plan, track progress, and adapt as life changes.",
  applicationName: "Artha",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F9FAF6",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
