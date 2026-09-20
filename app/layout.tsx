import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Digital Scam Autopsy — Understand How the Scam Works",
  description:
    "Deconstruct deceptive messages into an evidence-backed attack chain. Identify coercion stages, verify exact quotes, and access official defense steps for Indian UPI and banking fraud.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-white text-slate-900 antialiased min-h-screen selection:bg-slate-200">
        {children}
      </body>
    </html>
  );
}
