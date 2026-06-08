import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Landing Page Generator",
  description:
    "Generirajte landing stranice pomoću umjetne inteligencije - Diplomski rad",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="hr">
      <body>{children}</body>
    </html>
  );
}
