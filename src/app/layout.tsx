import type { Metadata, Viewport } from "next";
import "./globals.css";
import StructuredData from "@/components/StructuredData";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://bizlume-hms.vercel.app";

export const viewport: Viewport = {
  themeColor: "#0E1A2B",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BizLume HMS | AI-Powered Hospital & Outpatient Management System",
    template: "%s | BizLume HMS",
  },
  description:
    "Next-generation Hospital Management System delivering real-time OPD queue optimization, EMR consultations, diagnostic pathology tracking, automated pharmacy inventory, and digital appointment booking.",
  keywords: [
    "Hospital Management System",
    "HMS",
    "EMR",
    "Electronic Medical Records",
    "OPD Queue Management",
    "Healthcare Portal",
    "Clinical Management Software",
    "Doctor Consultation System",
    "Pharmacy Inventory Management",
    "Diagnostic Pathology Tracking",
    "Patient Appointment Booking",
  ],
  authors: [{ name: "BizLume Healthcare Solutions" }],
  creator: "BizLume",
  publisher: "BizLume Healthcare",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BizLume HMS | AI-Powered Hospital & Outpatient Management",
    description:
      "Modern healthcare management platform with intelligent queue dispatch, doctor EMR workstation, digital prescription fulfillment, and lab orders.",
    url: siteUrl,
    siteName: "BizLume HMS",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BizLume HMS | AI-Powered Healthcare Management",
    description:
      "Enterprise clinic management platform with real-time patient queue scoring, EMR workflows, and pharmacy fulfillment.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      "index": true,
      "follow": true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <StructuredData />
      </head>
      <body className="antialiased bg-white selection:bg-cyan/30">
        {children}
      </body>
    </html>
  );
}
