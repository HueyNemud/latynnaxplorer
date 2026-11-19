import type { Metadata } from "next";
import { Fira_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Fira Sans, pour ses vraies petites capitales (sujets) ; hébergée avec le site par next/font,
// exposée en variable CSS (--font dans globals.css)
const fira = Fira_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600"],
  style: ["normal", "italic"],
  variable: "--font-fira",
});

export const metadata: Metadata = { title: "latynnaxplorer" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={fira.variable}>
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
