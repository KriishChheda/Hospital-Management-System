import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BizLume HMS | AI-Powered Hospital Management",
  description: "Modern EMR and Hospital Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-white selection:bg-cyan/30">
        {children}
      </body>
    </html>
  );
}